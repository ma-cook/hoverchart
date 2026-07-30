import { sendToZen } from '../zenService';
import { stripRetrievalMarkers } from './retrievalProtocol';
import { executeTool, resetEditTracker } from './toolExecutor';
import { computeTools, computeSubAgentTools } from './toolProvider';
import { initializeDefaultSkills, REGISTRY } from './skillManager';
import { getContentStore } from './contentStore';
import { getBase64Store } from './base64Store';
import { globalMonitor } from './agentMonitor';
import { globalRouter } from './modelRouter';
import { RagPipeline } from './ragPipeline';

const MAX_UNHELPFUL_ROUNDS = 5;
const MAX_SAME_FILE_READS = 2;
const MAX_CONTEXT_CHARS = 120000;
const MAX_TOOL_RESULT_CHARS = 30000;

function estimateMessagesSize(msgs) {
  let total = 0;
  for (const m of msgs) {
    total += (m.content || '').length;
    if (m.tool_calls) {
      for (const tc of m.tool_calls) {
        total += (tc.function?.arguments || '').length;
      }
    }
  }
  return total;
}

async function compressMessages(msgs) {
  if (msgs.length <= 2) return msgs;

  const systemMsg = msgs[0];
  const userMsg = msgs[1];
  const rest = [...msgs.slice(2)];

  const lastReadByPath = new Map();
  for (let i = 0; i < rest.length; i++) {
    const msg = rest[i];
    if (msg.role === 'assistant' && msg.tool_calls) {
      for (const tc of msg.tool_calls) {
        if (tc.function?.name === 'read_file') {
          try {
            const args = typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function.arguments;
            if (args.path) lastReadByPath.set(args.path, i);
          } catch { /* ignore */ }
        }
      }
    }
    if (i % 10 === 0) await new Promise(r => setTimeout(r, 0));
  }

  const SEARCH_TOOLS = new Set(['search_code', 'search_nodes', 'get_node_info', 'file_outline', 'quick_look']);
  let compressedCount = 0;
  for (let i = 0; i < rest.length; i++) {
    const msg = rest[i];
    if (msg.role !== 'tool' || typeof msg.content !== 'string') continue;
    if (msg.content.length < 500) continue;

    const prev = i > 0 ? rest[i - 1] : null;
    if (prev?.role !== 'assistant' || !prev?.tool_calls) continue;

    const tc = prev.tool_calls.find(t => t.id === msg.tool_call_id);
    if (!tc) continue;

    if (tc.function?.name === 'read_file') {
      try {
        const args = typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function.arguments;
        if (args.path && lastReadByPath.get(args.path) > i) {
          msg.content = `[Previously read: ${args.path} — ${msg.content.length} chars — see the later read_file above]`;
          compressedCount++;
        }
      } catch { /* ignore */ }
    } else if (tc.function?.name === 'edit' && msg.content.length > 300) {
      const hasSubsequent = rest.slice(i + 1).some(m => m.role === 'assistant');
      if (hasSubsequent) {
        const firstLine = msg.content.split('\n')[0] || '';
        msg.content = `[Edit applied — ${firstLine}]`;
        compressedCount++;
      }
    } else if (SEARCH_TOOLS.has(tc.function?.name)) {
      const hasSubsequent = rest.slice(i + 1).some(m => m.role === 'assistant');
      if (hasSubsequent) {
        const lines = msg.content.split('\n').filter(l => l.trim());
        const fileMatches = [];
        for (const line of lines) {
          const pathMatch = line.match(/^([^\s:]+\.[a-z]{1,4})[:\s]/i);
          if (pathMatch && !fileMatches.includes(pathMatch[1])) fileMatches.push(pathMatch[1]);
        }
        const summary = fileMatches.length > 0
          ? `[Search results — ${lines.length} matches in: ${fileMatches.slice(0, 5).join(', ')}${fileMatches.length > 5 ? ` +${fileMatches.length - 5} more` : ''}]`
          : `[Search results — ${lines.length} lines]`;
        msg.content = summary;
        compressedCount++;
      }
    }
    if (i % 10 === 0) await new Promise(r => setTimeout(r, 0));
  }

  if (compressedCount > 0) {
    console.log(`[Compression] Compressed ${compressedCount} stale tool results`);
  }

  const totalSize = estimateMessagesSize([systemMsg, userMsg, ...rest]);
  if (totalSize > MAX_CONTEXT_CHARS * 0.8 && rest.length > 10) {
    const pairs = [];
    for (let i = 0; i < rest.length; i++) {
      const msg = rest[i];
      if (msg.role === 'assistant' && msg.tool_calls) {
        const toolResults = [];
        let j = i + 1;
        while (j < rest.length && rest[j].role === 'tool') {
          toolResults.push(rest[j]);
          j++;
        }
        pairs.push({ assistant: msg, tools: toolResults, endIdx: j - 1 });
        i = j - 1;
      }
    }
    let dropped = 0;
    const keepIndices = new Set(rest.map((_, i) => i));
    for (let p = 0; p < pairs.length - 3; p++) {
      const pair = pairs[p];
      const hasToolCalls = pair.assistant.tool_calls?.some(tc => tc.name === 'edit' || tc.name === 'write' || tc.name === 'read_file' || tc.name === 'search_code');
      if (!pair.assistant.content || (!hasToolCalls && pair.assistant.content.length < 50)) {
        keepIndices.delete(pair.endIdx);
        for (let k = pair.endIdx - 1; k >= 0 && rest[k] !== pair.assistant; k--) {
          keepIndices.delete(k);
        }
        const idx = rest.indexOf(pair.assistant);
        if (idx >= 0) keepIndices.delete(idx);
        dropped++;
      }
    }
    if (dropped > 0) {
      const filtered = rest.filter((_, i) => keepIndices.has(i));
      console.log(`[Compression] Dropped ${dropped} silent assistant+tool pairs to free context`);
      return [systemMsg, userMsg, ...filtered];
    }
  }

  return [systemMsg, userMsg, ...rest];
}

function generateSearchReplacePatch(original, modified, filePath) {
  if (!original || !modified || original === modified) return null;
  const origLines = original.split('\n');
  const modLines = modified.split('\n');
  const blocks = [];
  let i = 0;
  let j = 0;
  while (i < origLines.length || j < modLines.length) {
    if (i < origLines.length && j < modLines.length && origLines[i] === modLines[j]) {
      i++;
      j++;
      continue;
    }
    const searchStart = i;
    const replaceStart = j;
    while (i < origLines.length && j < modLines.length && origLines[i] !== modLines[j]) {
      i++;
      j++;
    }
    if (i === origLines.length && j < modLines.length) {
      while (j < modLines.length) j++;
      break;
    }
    if (j === modLines.length && i < origLines.length) {
      while (i < origLines.length) i++;
      break;
    }
    const searchLines = origLines.slice(searchStart, i);
    const replaceLines = modLines.slice(replaceStart, j);
    if (searchLines.length > 0 || replaceLines.length > 0) {
      const contextBefore = searchStart > 0 ? origLines[searchStart - 1] : '';
      const contextAfter = i < origLines.length ? origLines[i] : '';
      blocks.push({
        search: searchLines.join('\n'),
        replace: replaceLines.join('\n'),
        contextBefore,
        contextAfter,
      });
    }
  }
  if (blocks.length === 0) return null;
  const ext = filePath.split('.').pop() || 'txt';
  const patchParts = blocks.map(b => {
    const lines = [];
    if (b.contextBefore) lines.push(` ${b.contextBefore}`);
    lines.push(`<<<<<<< SEARCH`);
    lines.push(b.search);
    lines.push(`=======`);
    lines.push(b.replace);
    lines.push(`>>>>>>> REPLACE`);
    if (b.contextAfter) lines.push(` ${b.contextAfter}`);
    return lines.join('\n');
  });
  return `\`\`\`${ext}:${filePath}\n${patchParts.join('\n\n')}\n\`\`\``;
}

const FAILURE_PATTERNS = /^Error:|^File not found:|^No (matching|files) found|^Unknown tool|^search_code requires/i;

function isUsefulToolResult(content, toolName) {
  if (!content) return false;
  if (FAILURE_PATTERNS.test(content.trim())) return false;
  if (toolName === 'search_code' && content.trim().split('\n').length < 1) return false;
  return true;
}

function readKey(tc) {
  if (tc.name === 'read_file') {
    return `read_file:${tc.arguments.path}:${tc.arguments.offset || 1}:${tc.arguments.limit || 8000}`;
  }
  return `${tc.name}:${JSON.stringify(tc.arguments)}`;
}

export function buildCodeGenPipeline({ sendToLLM, executeToolCall, compressMessages, estimateSize }) {
  const pipeline = new RagPipeline();

  pipeline.use(RagPipeline.createRouterStage(async (ctx) => {
    const taskType = globalRouter.classifyTaskType(ctx.messages, ctx.tools);
    const route = await globalRouter.route(taskType, {
      providerId: ctx.providerId,
      model: ctx.model,
      messages: ctx.messages,
    });
    return { taskType, route };
  }));

  pipeline.use({
    name: 'send',
    execute: async (ctx) => {
      const raw = await sendToLLM(ctx.messages, ctx.tools, ctx.signal);
      const result = typeof raw === 'string' ? { text: raw, toolCalls: [] } : raw;
      return { rawResult: result, text: result.text, toolCalls: result.toolCalls || [] };
    },
  });

  pipeline.use(RagPipeline.createStopIf(async (ctx) => {
    return !ctx.toolCalls || ctx.toolCalls.length === 0;
  }));

  pipeline.use({
    name: 'compress-check',
    execute: async (ctx) => {
      if (estimateSize(ctx.messages) > MAX_CONTEXT_CHARS) {
        ctx.messages = await compressMessages(ctx.messages);
      }
      return { messages: ctx.messages };
    },
  });

  pipeline.use({
    name: 'execute-tools',
    execute: async (ctx) => {
      const promises = ctx.toolCalls.map(tc => executeToolCall(tc));
      const results = await Promise.all(promises);
      const usefulCount = results.filter(r => isUsefulToolResult(r.result.content, r.tc.name)).length;
      return { toolResults: results, usefulCount, uselessCount: results.length - usefulCount };
    },
  });

  return pipeline;
}

export async function sendWithRetrieval({
  messages,
  onChunk,
  signal,
  onRetrieval,
  onToolProgress,
  githubContext,
  fileTree,
  _fileSizes,
  sceneObjects,
}) {
  let currentMessages = [...messages];
  let finalText = '';
  let rounds = 0;
  let consecutiveUnhelpfulRounds = 0;
  const readFiles = new Map();
  let duplicateReadRounds = 0;
  const editedFilePaths = new Set();
  const originalFileContents = new Map();

  resetEditTracker();
  initializeDefaultSkills({
    fileTree,
    fileSizes: _fileSizes,
    sceneObjects,
  });

  const userMessages = messages.filter(m => m.role === 'user');
  const taskType = globalRouter.classifyTaskType(messages, computeTools());
  console.log(`[sendWithRetrieval] Classified task type: ${taskType}`);

  const mainInvocation = globalMonitor.startInvocation({
    agentName: 'sendWithRetrieval',
    inputs: { messageCount: messages.length, fileTreeSize: fileTree?.length },
  });

  while (true) {
    if (estimateMessagesSize(currentMessages) > MAX_CONTEXT_CHARS) {
      currentMessages = await compressMessages(currentMessages);
      console.log(`[ToolRound] Compressed to ${currentMessages.length} messages (${estimateMessagesSize(currentMessages)} chars)`);
    }

    const roundInvocation = globalMonitor.startInvocation({
      agentName: `round-${rounds + 1}`,
      inputs: { messageCount: currentMessages.length, charSize: estimateMessagesSize(currentMessages) },
      iteration: rounds,
    });

    console.log(`[ToolRound] Round ${rounds + 1} - sending ${currentMessages.length} messages (${estimateMessagesSize(currentMessages)} chars)`);

    const MAX_SEND_RETRIES = 2;
    let rawResult = null;
    let sendFailed = false;
    for (let sendAttempt = 0; sendAttempt <= MAX_SEND_RETRIES; sendAttempt++) {
      try {
        const availableTools = computeTools();
        rawResult = await sendToZen({
          messages: currentMessages,
          tools: availableTools,
          signal,
          onChunk: (delta, fullText) => {
            const displayedText = finalText ? finalText + '\n\n' + fullText : fullText;
            onChunk?.(delta, stripRetrievalMarkers(displayedText));
          },
        });
        break;
      } catch (sendErr) {
        console.warn(`[ToolRound] Round ${rounds + 1} sendToZen failed (${sendAttempt + 1}/${MAX_SEND_RETRIES + 1}): ${sendErr.message}`);
        if (sendAttempt < MAX_SEND_RETRIES) {
          await new Promise(r => setTimeout(r, 1000 * (sendAttempt + 1)));
        } else {
          sendFailed = true;
        }
      }
    }
    if (sendFailed) {
      console.warn(`[ToolRound] Round ${rounds + 1}: all send attempts failed, breaking loop`);
      break;
    }

    const result = typeof rawResult === 'string' ? { text: rawResult, toolCalls: [] } : rawResult;
    const { text, toolCalls } = result;
    if (text) {
      finalText = finalText ? finalText + '\n\n' + text : text;
    }
    console.log(`[ToolRound] Round ${rounds + 1} complete. Text: ${(text || '').length} chars (total: ${finalText.length}), Tool calls: ${toolCalls.length}`);

    if (toolCalls.length === 0) {
      break;
    }

    const roundKeys = toolCalls.map(tc => readKey(tc));
    const dupCounts = new Map();
    for (const key of roundKeys) {
      dupCounts.set(key, (dupCounts.get(key) || 0) + 1);
    }
    let doomLoopDetected = false;
    for (const [key, count] of dupCounts) {
      if (count >= 4) {
        console.warn(`[ToolRound] Doom loop detected: tool called ${count} times with identical args in one round`);
        doomLoopDetected = true;
      }
    }
    if (doomLoopDetected) {
      console.warn(`[ToolRound] Breaking: same tool called 4+ times in a single round`);
      break;
    }

    onRetrieval?.({ chunkIds: toolCalls.map(tc => tc.name + ':' + JSON.stringify(tc.arguments)), round: rounds + 1 });

    const assistantMessage = { role: 'assistant', content: text || null, tool_calls: toolCalls.map(tc => ({
      id: tc.id,
      type: 'function',
      function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
    }))};

    currentMessages = [...currentMessages, assistantMessage];

    const totalTools = toolCalls.length;
    onToolProgress?.({ tool: 'starting', index: 0, total: totalTools, status: 'executing' });

    const readFilesBefore = new Set(readFiles.keys());

    const runSubAgent = async ({ prompt, tools, systemPrompt, githubContext: ghCtx, fileTree: ft, depth: subDepth }) => {
      const subInvocation = globalMonitor.startInvocation({
        agentName: 'sub-agent',
        inputs: { prompt: prompt.slice(0, 200), depth: subDepth },
      });
      const subMessages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ];
      let subText = '';
      const SUB_MAX_ROUNDS = 5;
      const SUB_MAX_CHARS = 25000;
      const SUB_MAX_TOOL_CONTENT = 6000;
      const subReadFiles = new Set();
      for (let subRound = 0; subRound < SUB_MAX_ROUNDS; subRound++) {
        let raw;
        try {
          raw = await sendToZen({ messages: subMessages, tools, signal });
        } catch (e) {
          console.warn(`[SubAgent] Round ${subRound + 1} sendToZen failed:`, e.message);
          break;
        }
        const res = typeof raw === 'string' ? { text: raw, toolCalls: [] } : raw;
        if (res.text) subText = subText ? subText + '\n\n' + res.text : res.text;
        if (!res.toolCalls || res.toolCalls.length === 0) break;
        subMessages.push({
          role: 'assistant',
          content: res.text || null,
          tool_calls: res.toolCalls.map(tc => ({
            id: tc.id,
            type: 'function',
            function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
          })),
        });
        const subResults = await Promise.all(res.toolCalls.map(tc => {
          if (tc.name === 'read_file') {
            const rKey = `${tc.arguments.path}:${tc.arguments.offset || 0}:${tc.arguments.limit || 8000}`;
            if (subReadFiles.has(rKey)) {
              return Promise.resolve({
                tc,
                result: { success: true, content: `[Already loaded: ${tc.arguments.path} — see prior tool response above]` },
              });
            }
            subReadFiles.add(rKey);
          }
          return executeTool(tc.name, tc.arguments, ghCtx, ft, { runSubAgent, depth: subDepth })
            .then(r => ({ tc, result: r }))
            .catch(e => ({ tc, result: { success: false, content: `Error: ${e.message}` } }));
        }));
        for (const { tc, result: subResult } of subResults) {
          let content = subResult.content || '';
          if (content.length > SUB_MAX_TOOL_CONTENT) {
            content = content.slice(0, SUB_MAX_TOOL_CONTENT) + `\n... [truncated at ${SUB_MAX_TOOL_CONTENT} chars]`;
          }
          subMessages.push({ role: 'tool', tool_call_id: tc.id, content });
        }
        const subSize = estimateMessagesSize(subMessages);
        console.log(`[SubAgent] Round ${subRound + 1} done. Messages size: ${subSize} chars`);
        if (subSize > SUB_MAX_CHARS) {
          console.warn(`[SubAgent] Budget exceeded (${subSize} > ${SUB_MAX_CHARS}), stopping.`);
          break;
        }
      }
      if (!subText) {
        const toolResults = [];
        for (let i = subMessages.length - 1; i >= 0; i--) {
          const msg = subMessages[i];
          if (msg.role === 'tool' && msg.content) {
            toolResults.unshift(msg.content);
          }
        }
        if (toolResults.length > 0) {
          subText = toolResults.join('\n\n').slice(0, 8000);
        }
      }
      globalMonitor.endInvocation({ output: subText });
      return subText;
    };

      const toolPromises = toolCalls.map((tc, idx) => {
      const toolStart = performance.now();
      if (tc.name === 'read_file' && tc.arguments?.path) {
        const key = readKey(tc);
        const filePath = tc.arguments.path;
        if (readFilesBefore.has(key)) {
          const off = tc.arguments.offset || 1;
          const lim = tc.arguments.limit || 2000;
          console.warn(`[ToolRound] Round ${rounds + 1}: ${filePath} (offset=${off}) already read, skipping fetch`);
          onToolProgress?.({ tool: tc.name, index: idx + 1, total: totalTools, status: 'done' });
          globalMonitor.recordTool({ toolName: tc.name, args: tc.arguments, result: '[cached]', duration: 0 });
          return Promise.resolve({
            tc,
            result: { success: true, content: `[Already loaded: ${filePath} lines ${off}-${off + lim - 1} — see prior tool response above. Do NOT re-read this section.]` },
            error: null,
          });
        }

        const fullCached = originalFileContents.get(filePath);
        if (fullCached) {
          const off = Math.max(1, parseInt(tc.arguments.offset, 10) || 1);
          const lim = Math.min(parseInt(tc.arguments.limit, 10) || 8000, 10000);
          const lines = fullCached.split('\n');
          if (off <= lines.length) {
            const endLine = Math.min(off + lim - 1, lines.length);
            const sliced = lines.slice(off - 1, off - 1 + lim).map((l, i) => `${off + i}: ${l}`).join('\n');
            console.log(`[ToolRound] Serving ${filePath} lines ${off}-${endLine} from cache (${fullCached.length} chars total)`);
            onToolProgress?.({ tool: tc.name, index: idx + 1, total: totalTools, status: 'done' });
            globalMonitor.recordTool({ toolName: tc.name, args: tc.arguments, result: '[cache-hit]', duration: 0 });
            return Promise.resolve({
              tc,
              result: { success: true, content: `[Read ${filePath}: lines ${off}-${endLine} of ${lines.length}]\n${sliced}` },
              error: null,
            });
          }
        }

        readFiles.set(key, true);
        if (filePath && !originalFileContents.has(filePath)) {
          const store = getContentStore();
          const b64Store = getBase64Store();
          if (store._hydrated && b64Store._hydrated) {
            const entry = store.getEntry(`repo:${filePath}`) || store.getEntry(`github:${filePath}`);
            if (entry) {
              const chunks = b64Store.getChunks(entry.chunks.map(c => c.id));
              if (chunks.length > 0) {
                originalFileContents.set(filePath, chunks.map(c => c.text).join(''));
              }
            }
          }
        }
      }
      console.log(`[ToolRound] Executing: ${tc.name}(${JSON.stringify(tc.arguments)})`);
      onToolProgress?.({ tool: tc.name, index: idx + 1, total: totalTools, status: 'executing' });
      return executeTool(tc.name, tc.arguments, githubContext, fileTree, { runSubAgent, depth: 0 })
        .then(result => {
          if (tc.name === 'read_file' && result._fullContent) {
            const fp = tc.arguments?.path;
            if (fp && !originalFileContents.has(fp)) {
              originalFileContents.set(fp, result._fullContent);
            }
          }
          const toolDuration = Math.round(performance.now() - toolStart);
          globalMonitor.recordTool({
            toolName: tc.name,
            args: tc.arguments,
            result: result.content,
            duration: toolDuration,
            error: result.success ? null : new Error(result.content?.slice(0, 100)),
          });
          onToolProgress?.({ tool: tc.name, index: idx + 1, total: totalTools, status: 'done' });
          return { tc, result: { success: result.success, content: result.content }, error: null };
        })
        .catch(error => {
          const toolDuration = Math.round(performance.now() - toolStart);
          globalMonitor.recordTool({
            toolName: tc.name,
            args: tc.arguments,
            result: null,
            duration: toolDuration,
            error,
          });
          console.warn(`[ToolRound] Tool ${tc.name} failed:`, error.message);
          onToolProgress?.({ tool: tc.name, index: idx + 1, total: totalTools, status: 'error' });
          return { tc, result: { success: false, content: `Error: ${error.message}` }, error };
        });
    });

    const toolResults = await Promise.all(toolPromises);

    const usefulCount = toolResults.filter(({ tc, result }) => isUsefulToolResult(result.content, tc.name)).length;
    const uselessCount = toolResults.length - usefulCount;
    if (usefulCount > uselessCount) {
      consecutiveUnhelpfulRounds = 0;
    } else {
      consecutiveUnhelpfulRounds++;
      for (const { tc, result } of toolResults) {
        const preview = (result.content || '').slice(0, 150).replace(/\n/g, ' ');
        console.warn(`[ToolRound] Round ${rounds + 1}: ${tc.name} → unhelpful (${result.content?.length || 0} chars): "${preview}"`);
      }
      console.warn(`[ToolRound] Unhelpful streak: ${consecutiveUnhelpfulRounds}/${MAX_UNHELPFUL_ROUNDS}`);
    }

    const readDupCount = toolCalls.filter(tc =>
      tc.name === 'read_file' && readFilesBefore.has(readKey(tc))
    ).length;
    const allDuplicateReads = toolCalls.length > 0 && readDupCount >= Math.ceil(toolCalls.length / 2);

    if (allDuplicateReads) {
      duplicateReadRounds++;
      console.warn(`[ToolRound] Round ${rounds + 1}: ${readDupCount}/${toolCalls.length} read_file calls are duplicates (${duplicateReadRounds}/${MAX_SAME_FILE_READS})`);
    } else {
      duplicateReadRounds = 0;
    }

    if (consecutiveUnhelpfulRounds >= MAX_UNHELPFUL_ROUNDS) {
      console.warn(`[ToolRound] Breaking: ${consecutiveUnhelpfulRounds} consecutive rounds with no useful tool results`);
      break;
    }

    if (duplicateReadRounds >= MAX_SAME_FILE_READS) {
      console.warn(`[ToolRound] Breaking: ${duplicateReadRounds} consecutive rounds of re-reading same files`);
      break;
    }

    for (const { tc, result: toolResult } of toolResults) {
      if ((tc.name === 'edit' || tc.name === 'write') && tc.arguments?.filePath) {
        editedFilePaths.add(tc.arguments.filePath);
      }
      let content = toolResult.content;
      if (content && content.length > MAX_TOOL_RESULT_CHARS) {
        content = content.slice(0, MAX_TOOL_RESULT_CHARS) + `\n\n... (truncated at ${MAX_TOOL_RESULT_CHARS} chars)`;
      }
      currentMessages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content,
      });
    }

    onToolProgress?.({ tool: 'done', index: totalTools, total: totalTools, status: 'complete' });
    globalMonitor.endInvocation({ output: finalText, tokens: toolResults.length });
    rounds++;
  }

  if (editedFilePaths.size > 0) {
    const store = getContentStore();
    const base64Store = getBase64Store();
    const syntheticBlocks = [];
    for (const filePath of editedFilePaths) {
      if (finalText.includes(`:${filePath}\n`)) continue;
      const storeId = `repo:${filePath}`;
      const entry = store.getEntry(storeId);
      if (!entry) continue;
      const chunks = base64Store.getChunks(entry.chunks.map(c => c.id));
      const modifiedContent = chunks.map(c => c.text).join('');
      if (!modifiedContent) continue;
      const ext = filePath.split('.').pop() || 'txt';
      const originalContent = originalFileContents.get(filePath);
      if (originalContent && originalContent !== modifiedContent) {
        const patch = generateSearchReplacePatch(originalContent, modifiedContent, filePath);
        if (patch) {
          syntheticBlocks.push(patch);
          continue;
        }
      }
      syntheticBlocks.push(`\`\`\`${ext}:${filePath}\n${modifiedContent}\n\`\`\``);
    }
    if (syntheticBlocks.length > 0) {
      const blockText = syntheticBlocks.join('\n\n');
      finalText = finalText ? finalText + '\n\n' + blockText : blockText;
      console.log(`[ToolRound] Generated ${syntheticBlocks.length} synthetic code block(s) from edit/write tools`);
    }
  }

  const usageReport = globalRouter.getUsageReport();
  console.log(`[sendWithRetrieval] Model usage:`, JSON.stringify(usageReport));

  globalMonitor.endInvocation({
    output: finalText,
    tokens: rounds,
  });

  return stripRetrievalMarkers(finalText);
}
