import { sendToZen, buildComponentIndex, buildGraphSummary, buildFileTreeSection, buildContentIndexSection, buildImportGraphSection, buildLspOverviewSection } from '../zenService';
import { stripRetrievalMarkers } from './retrievalProtocol';
import { CODE_GEN_TOOLS, executeTool } from './toolExecutor';
import { getContentStore } from './contentStore';
import { getBase64Store } from './base64Store';
import useObjectsStore from '../../stores/objectsStore';
import useDiagramStore from '../../stores/diagramStore';

const MAX_TOTAL_CHARS = 100000;
const MAX_UNHELPFUL_ROUNDS = 5;
const MAX_SAME_FILE_READS = 2;
const MAX_TOOL_ROUNDS = 30;

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

const CODE_GEN_NO_TOOLS_PROMPT = `You are a code generation expert. Generate production-ready code based on the user's request and the files provided below.

═══════════════════════════════════════════════════════════════
CRITICAL RULES — VIOLATION WILL CAUSE INCORRECT OUTPUT
═══════════════════════════════════════════════════════════════

1. If files are provided below, you MUST modify THOSE EXACT FILES. Do NOT create new files.
2. For each provided file, output a code block with that file's path containing the MODIFIED version.
3. NEVER create a new file (e.g. TopBar.jsx) for functionality that already exists inside an existing file.
4. Start each modified file from the content provided and apply your changes to it.
5. Do NOT fabricate imports, state, hooks, or structure — use what is actually in the provided files.
6. NEVER output a file that does not appear in the FILES TO MODIFY section below.
7. If you need to add a new component, describe it as a TODO comment inside the existing file where it belongs, rather than creating a new file.
8. For EXISTING files: use SEARCH/REPLACE markers instead of outputting the entire file. This prevents accidentally losing code:
   <<<<<<< SEARCH
   exact code to find and replace (must match the provided content exactly)
   =======
   replacement code
   >>>>>>> REPLACE
   You can use multiple SEARCH/REPLACE blocks per file.

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════

Write a 1-2 sentence summary, then output code blocks:

For EXISTING files (preferred — safer, prevents code loss):
\`\`\`jsx:src/components/FileName.jsx
<<<<<<< SEARCH
exact existing code to find
=======
replacement code
>>>>>>> REPLACE
\`\`\`

For NEW files only (when no existing file can be modified):
\`\`\`jsx:src/components/NewFile.jsx
<entire new file content>
\`\`\`

Each code block MUST have the file path after the language tag.
Do NOT use XML tags, DSML format, or any format other than standard markdown code blocks.`;

function collectFileContents(messages) {
  const filePaths = new Set();
  for (const m of messages) {
    if (m.role !== 'tool' || !m.content) continue;
    const content = m.content;
    if (content.startsWith('[Already loaded:') ||
        content.startsWith('[End of file:') ||
        content.startsWith('[Starting at') ||
        content.startsWith('[Search results for') ||
        content.startsWith('Error') ||
        content.startsWith('No matching')) continue;
    const prev = messages.indexOf(m) > 0 ? messages[messages.indexOf(m) - 1] : null;
    if (prev?.role === 'assistant' && prev.tool_calls) {
      for (const tc of prev.tool_calls) {
        if (tc.function?.name === 'read_file' && tc.id === m.tool_call_id) {
          try {
            const args = typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function.arguments;
            if (args.path) filePaths.add(args.path);
          } catch { /* JSON parse failed */ }
        }
      }
    }
  }

  if (filePaths.size === 0) return [];

  const store = getContentStore();
  const base64Store = getBase64Store();
  const parts = [];
  for (const filePath of filePaths) {
    const storeId = `repo:${filePath}`;
    const altId = `github:${filePath}`;
    const entry = store.getEntry(storeId) || store.getEntry(altId);
    if (entry) {
      const chunks = base64Store.getChunks(entry.chunks.map(c => c.id));
      if (chunks.length > 0) {
        const content = chunks.map(c => c.text).join('');
        if (content.length > 100) parts.push(content);
      }
    }
  }
  return parts;
}

function trimMessages(msgs) {
  if (msgs.length <= 2) return msgs;

  const systemMsg = msgs[0];
  const userMsg = msgs[1];
  const rest = msgs.slice(2);

  const systemLen = (systemMsg.content || '').length;
  if (systemLen > MAX_TOTAL_CHARS * 0.5) {
    const userRestSize = estimateMessagesSize([userMsg, ...rest]);
    const systemBudget = Math.max(4000, MAX_TOTAL_CHARS - userRestSize);
    systemMsg.content = systemMsg.content.slice(0, systemBudget);
    console.warn(`[Retrieval] Truncated system message to ${systemBudget} chars`);
  }

  if (estimateMessagesSize([systemMsg, userMsg, ...rest]) <= MAX_TOTAL_CHARS) {
    console.log(`[Retrieval] No trim needed (${estimateMessagesSize([systemMsg, userMsg, ...rest])} chars)`);
    return [systemMsg, userMsg, ...rest];
  }

  const searchResultIndices = new Set();
  for (let i = 0; i < rest.length; i++) {
    if (rest[i]?.role === 'tool') {
      const prev = i > 0 ? rest[i - 1] : null;
      if (prev?.role === 'assistant' && prev.tool_calls) {
        const isSearchOnly = prev.tool_calls.every(tc => tc.function?.name === 'search_code' || tc.function?.name === 'search_nodes' || tc.function?.name === 'get_node_info');
        if (isSearchOnly) searchResultIndices.add(i);
      }
    }
  }

  const indicesToRemove = [];
  for (const idx of searchResultIndices) {
    if (rest[idx]) indicesToRemove.push(idx);
  }

  const toRemoveSet = new Set(indicesToRemove);
  const filtered = rest.filter((_, i) => !toRemoveSet.has(i));

  if (estimateMessagesSize([systemMsg, userMsg, ...filtered]) <= MAX_TOTAL_CHARS) {
    console.log(`[Retrieval] Removed ${indicesToRemove.length} search results → ${filtered.length + 2} messages (${estimateMessagesSize([systemMsg, userMsg, ...filtered])} chars)`);
    return [systemMsg, userMsg, ...filtered];
  }

  // Compaction: replace old read_file results with summaries when file was read again later
  const lastReadByPath = new Map();
  for (let i = 0; i < filtered.length; i++) {
    const msg = filtered[i];
    if (msg.role === 'assistant' && msg.tool_calls) {
      for (const tc of msg.tool_calls) {
        if (tc.function?.name === 'read_file') {
          try {
            const args = typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function.arguments;
            if (args.path) lastReadByPath.set(args.path, i);
          } catch { /* JSON parse failed */ }
        }
      }
    }
  }

  let compactedCount = 0;
  for (let i = 0; i < filtered.length; i++) {
    const msg = filtered[i];
    if (msg.role === 'tool' && typeof msg.content === 'string' && msg.content.length > 2000) {
      const prev = i > 0 ? filtered[i - 1] : null;
      if (prev?.role === 'assistant' && prev.tool_calls) {
        for (const tc of prev.tool_calls) {
          if (tc.function?.name === 'read_file' && tc.id === msg.tool_call_id) {
            try {
              const args = typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function.arguments;
              if (args.path && lastReadByPath.get(args.path) > i) {
                const origLen = msg.content.length;
                msg.content = `[Previously read: ${args.path} — ${origLen} chars — use content from the later read_file response above]`;
                compactedCount++;
              }
            } catch { /* JSON parse failed */ }
          }
        }
      }
    }
  }

  if (compactedCount > 0) {
    console.log(`[Retrieval] Compacted ${compactedCount} old read_file results → ${estimateMessagesSize([systemMsg, userMsg, ...filtered])} chars`);
  }

  const SEARCH_TOOLS = new Set(['search_code', 'search_nodes', 'get_node_info']);
  let searchCompactedCount = 0;
  for (let i = 0; i < filtered.length; i++) {
    const msg = filtered[i];
    if (msg.role !== 'tool' || typeof msg.content !== 'string' || msg.content.length < 300) continue;
    const prev = i > 0 ? filtered[i - 1] : null;
    if (prev?.role !== 'assistant' || !prev?.tool_calls) continue;
    const tc = prev.tool_calls.find(t => t.id === msg.tool_call_id);
    if (!tc || !SEARCH_TOOLS.has(tc.function?.name)) continue;
    const hasSubsequent = filtered.slice(i + 1).some(m => m.role === 'assistant');
    if (!hasSubsequent) continue;
    const lines = msg.content.split('\n').filter(l => l.trim());
    const fileMatches = [];
    for (const line of lines) {
      const pathMatch = line.match(/^([^\s:]+\.[a-z]{1,4})[:\s]/i);
      if (pathMatch && !fileMatches.includes(pathMatch[1])) fileMatches.push(pathMatch[1]);
    }
    const summary = fileMatches.length > 0
      ? `[Search results for '${tc.function.name}(${JSON.stringify(JSON.parse(tc.function.arguments || '{}'))})' — ${lines.length} matches in: ${fileMatches.slice(0, 5).join(', ')}${fileMatches.length > 5 ? ` +${fileMatches.length - 5} more` : ''}]`
      : `[Search results for '${tc.function.name}(${JSON.stringify(JSON.parse(tc.function.arguments || '{}'))})' — ${lines.length} lines — see earlier response]`;
    msg.content = summary;
    searchCompactedCount++;
  }
  if (searchCompactedCount > 0) {
    console.log(`[Retrieval] Compressed ${searchCompactedCount} stale search results → ${estimateMessagesSize([systemMsg, userMsg, ...filtered])} chars`);
  }

  if (estimateMessagesSize([systemMsg, userMsg, ...filtered]) <= MAX_TOTAL_CHARS) {
    return [systemMsg, userMsg, ...filtered];
  }

  const workMsgs = [systemMsg, userMsg, ...filtered];
  while (filtered.length > 0 && estimateMessagesSize(workMsgs) > MAX_TOTAL_CHARS) {
    let removeCount = 0;
    if (filtered[0]?.role === 'assistant') {
      removeCount = 1;
      while (removeCount < filtered.length && filtered[removeCount]?.role === 'tool') {
        removeCount++;
      }
    } else {
      removeCount = 1;
    }
    const removed = filtered.splice(0, Math.min(removeCount, filtered.length));
    console.warn(`[Retrieval] Removed ${removed.length} messages (${removed.map(m => m.role).join(', ')})`);
  }

  console.log(`[Retrieval] Trimmed to ${filtered.length + 2} messages (${estimateMessagesSize([systemMsg, userMsg, ...filtered])} chars)`);
  return [systemMsg, userMsg, ...filtered];
}

function hasCodeBlocks(text) {
  return text && /```[\s\S]+?```/.test(text);
}

function stripFabricatedNewFiles(text, allowedFilePaths) {
  if (!text || !allowedFilePaths || allowedFilePaths.length === 0) return text;
  const allowedSet = new Set(allowedFilePaths);
  const BLOCK_REGEX = /```(\w+):([^\n]+)\n([\s\S]*?)```/g;
  let match;
  const toStrip = [];
  while ((match = BLOCK_REGEX.exec(text)) !== null) {
    const filePath = match[2].trim();
    if (filePath && !allowedSet.has(filePath)) {
      toStrip.push(match[0]);
    }
  }
  if (toStrip.length > 0) {
    let modified = text;
    for (const block of toStrip) {
      modified = modified.replace(block, '');
    }
    console.warn(`[ToolRound] Stripped ${toStrip.length} fabricated new file(s) — allowed: [${[...allowedSet].join(', ')}]`);
    return modified;
  }
  return text;
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
    return `read_file:${tc.arguments.path}:${tc.arguments.offset || 0}:${tc.arguments.limit || 8000}`;
  }
  return `${tc.name}:${JSON.stringify(tc.arguments)}`;
}

export async function sendWithRetrieval({
  messages,
  onChunk,
  signal,
  onRetrieval,
  onToolProgress,
  githubContext,
  fileTree,
  fileSizes,
}) {
  let currentMessages = [...messages];
  let finalText = '';
  let rounds = 0;
  let consecutiveUnhelpfulRounds = 0;
  const readFiles = new Map();
  let duplicateReadRounds = 0;
  const toolCallHistory = new Map();
  let editWriteCount = 0;
  const editedFilePaths = new Set();
  const originalFileContents = new Map();

  while (rounds < MAX_TOOL_ROUNDS) {
    if (estimateMessagesSize(currentMessages) > MAX_TOTAL_CHARS) {
      currentMessages = trimMessages(currentMessages);
    }

    console.log(`[ToolRound] Round ${rounds + 1} - sending ${currentMessages.length} messages (${estimateMessagesSize(currentMessages)} chars)`);

    const MAX_SEND_RETRIES = 2;
    let rawResult = null;
    let sendFailed = false;
    for (let sendAttempt = 0; sendAttempt <= MAX_SEND_RETRIES; sendAttempt++) {
      try {
        rawResult = await sendToZen({
          messages: currentMessages,
          tools: CODE_GEN_TOOLS,
          signal,
          onChunk: (delta, fullText) => {
            onChunk?.(delta, stripRetrievalMarkers(fullText));
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

    let doomLoopDetected = false;
    for (const tc of toolCalls) {
      const key = readKey(tc);
      const count = (toolCallHistory.get(key) || 0) + 1;
      toolCallHistory.set(key, count);
      if (count >= 3) {
        console.warn(`[ToolRound] Doom loop detected: ${tc.name}(${JSON.stringify(tc.arguments)}) called ${count} times`);
        doomLoopDetected = true;
      }
    }
    if (doomLoopDetected) {
      console.warn(`[ToolRound] Breaking: same tool called 3+ times with identical arguments`);
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
      return subText;
    };

    const toolPromises = toolCalls.map((tc, idx) => {
      if (tc.name === 'read_file') {
        const key = readKey(tc);
        if (readFilesBefore.has(key)) {
          console.warn(`[ToolRound] Round ${rounds + 1}: ${tc.arguments.path} (offset=${tc.arguments.offset||0}) already read, skipping fetch`);
          onToolProgress?.({ tool: tc.name, index: idx + 1, total: totalTools, status: 'done' });
          return Promise.resolve({
            tc,
            result: { success: true, content: `[Already loaded: ${tc.arguments.path} — see prior tool response above]` },
            error: null,
          });
        }
        readFiles.set(key, true);
        const filePath = tc.arguments?.path;
        if (filePath && !originalFileContents.has(filePath)) {
          const store = getContentStore();
          const b64Store = getBase64Store();
          const entry = store.getEntry(`repo:${filePath}`) || store.getEntry(`github:${filePath}`);
          if (entry) {
            const chunks = b64Store.getChunks(entry.chunks.map(c => c.id));
            if (chunks.length > 0) {
              originalFileContents.set(filePath, chunks.map(c => c.text).join(''));
            }
          }
        }
      }
      console.log(`[ToolRound] Executing: ${tc.name}(${JSON.stringify(tc.arguments)})`);
      onToolProgress?.({ tool: tc.name, index: idx + 1, total: totalTools, status: 'executing' });
      return executeTool(tc.name, tc.arguments, githubContext, fileTree, { runSubAgent, depth: 0 })
        .then(result => {
          onToolProgress?.({ tool: tc.name, index: idx + 1, total: totalTools, status: 'done' });
          return { tc, result, error: null };
        })
        .catch(error => {
          console.warn(`[ToolRound] Tool ${tc.name} failed:`, error.message);
          onToolProgress?.({ tool: tc.name, index: idx + 1, total: totalTools, status: 'error' });
          return { tc, result: { success: false, content: `Error: ${error.message}` }, error };
        });
    });

    const toolResults = await Promise.all(toolPromises);

    const allDuplicateReads = toolCalls.length > 0 && toolCalls.every(tc =>
      tc.name === 'read_file' && readFilesBefore.has(readKey(tc))
    );

    const anyUseful = toolResults.some(({ tc, result }) => isUsefulToolResult(result.content, tc.name));
    if (anyUseful) {
      consecutiveUnhelpfulRounds = 0;
    } else {
      consecutiveUnhelpfulRounds++;
      for (const { tc, result } of toolResults) {
        const preview = (result.content || '').slice(0, 150).replace(/\n/g, ' ');
        console.warn(`[ToolRound] Round ${rounds + 1}: ${tc.name} → unhelpful (${result.content?.length || 0} chars): "${preview}"`);
      }
      console.warn(`[ToolRound] Unhelpful streak: ${consecutiveUnhelpfulRounds}/${MAX_UNHELPFUL_ROUNDS}`);
    }

    if (allDuplicateReads) {
      duplicateReadRounds++;
      console.warn(`[ToolRound] Round ${rounds + 1}: all read_file calls are for already-read files (${duplicateReadRounds}/${MAX_SAME_FILE_READS})`);
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
      if (tc.name === 'edit' || tc.name === 'write') {
        editWriteCount++;
        if (tc.arguments?.filePath) editedFilePaths.add(tc.arguments.filePath);
      }
      currentMessages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: toolResult.content,
      });
    }

    onToolProgress?.({ tool: 'done', index: totalTools, total: totalTools, status: 'complete' });
    rounds++;
  }

  if (rounds >= MAX_TOOL_ROUNDS) {
    console.warn(`[ToolRound] Hit round cap (${MAX_TOOL_ROUNDS}), exiting loop`);
  }

  if (!hasCodeBlocks(finalText) && editWriteCount === 0) {
    console.warn(`[ToolRound] Exiting with no code blocks and no edits after ${rounds} rounds (${finalText.length} chars of text)`);
    console.warn(`[ToolRound] Attempting forced code generation round (no tools)...`);

    const fileContents = collectFileContents(currentMessages);
    const userMsg = currentMessages[1];
    const sceneObjects = useObjectsStore.getState().objects || [];
    const componentIndex = buildComponentIndex(sceneObjects);
    const graphSummary = buildGraphSummary(useDiagramStore.getState());
    const fileTreeBlock = buildFileTreeSection(fileTree || [], fileSizes);
    const contentIndexBlock = buildContentIndexSection();
    const importGraphBlock = buildImportGraphSection();
    const lspOverviewBlock = buildLspOverviewSection();

    const fileBlock = fileContents.length > 0
      ? `\n\n═══ FILES TO MODIFY (output these same file paths with your changes applied) ═══\n\n${fileContents.join('\n\n---\n\n')}\n\n═══ END FILES ═══`
      : '';

    const indexBlock = componentIndex && componentIndex !== '(no scene components)'
      ? `\n\nCOMPONENT INDEX (component → file):\n${componentIndex}`
      : '';

    const graphBlock = graphSummary
      ? `\n\nGRAPH OVERVIEW:\n${graphSummary}`
      : '';

    const fileTreeInfo = `\n\nFILE TREE:\n${fileTreeBlock}`;
    const contentIndexInfo = `\n\nCONTENT INDEX:\n${contentIndexBlock}`;
    const importGraphInfo = importGraphBlock && importGraphBlock !== '(no import graph available — run a scan first)' && importGraphBlock !== '(no import graph available)'
      ? `\n\nIMPORT GRAPH:\n${importGraphBlock}`
      : '';

    const lspInfo = lspOverviewBlock && lspOverviewBlock !== '(no LSP data available)'
      ? `\n\nLSP SEMANTIC ANALYSIS:\n${lspOverviewBlock}`
      : '';

    const noFilesWarning2 = fileContents.length === 0
      ? `\n\nIMPORTANT: You have not read any files yet. Use the FILE TREE and CONTENT INDEX above to find the right files, then output your best attempt. In future requests, always call file_outline or read_file before writing code.`
      : '';

    const header2 = fileContents.length > 0
      ? `IMPORTANT: You MUST modify ONLY the files listed below. Do NOT create any new files. Use SEARCH/REPLACE markers for each change to prevent losing code.`
      : `Here is the repository context:`;

    const forcedMessages = [
      { role: 'system', content: CODE_GEN_NO_TOOLS_PROMPT },
      userMsg,
      { role: 'user', content: `${header2}${fileTreeInfo}${contentIndexInfo}${importGraphInfo}${indexBlock}${graphBlock}${lspInfo}${fileBlock}${noFilesWarning2}\n\nNow write the code. Output ONLY code blocks — one per file — using the EXACT file paths shown above.` },
    ];

    try {
      const forcedResult = await sendToZen({
        messages: forcedMessages,
        tools: [],
        signal,
        onChunk: (delta, fullText) => {
          onChunk?.(delta, stripRetrievalMarkers(fullText));
        },
      });

      const forcedText = typeof forcedResult === 'string' ? forcedResult : forcedResult?.text || '';
      if (forcedText) {
        finalText = finalText ? finalText + '\n\n' + forcedText : forcedText;
        console.warn(`[ToolRound] Forced round produced ${forcedText.length} chars`);
      }
    } catch (e) {
      console.warn(`[ToolRound] Forced round failed:`, e.message);
    }
  }

  {
    const fileContents = collectFileContents(currentMessages);
    if (fileContents.length > 0) {
      const allowedPaths = new Set();
      for (const m of currentMessages) {
        if (m.role === 'assistant' && m.tool_calls) {
          for (const tc of m.tool_calls) {
            const fn = tc.function;
            if (fn?.name === 'read_file' && fn.arguments) {
              try {
                const args = typeof fn.arguments === 'string' ? JSON.parse(fn.arguments) : fn.arguments;
                if (args.path) allowedPaths.add(args.path);
              } catch { /* JSON parse failed */ }
            }
          }
        }
      }
      if (allowedPaths.size > 0) {
        finalText = stripFabricatedNewFiles(finalText, [...allowedPaths]);
      }
    }
    if (!fileContents.length && fileTree && fileTree.length > 0) {
      const fileTreePaths = fileTree.map(f => f.path);
      finalText = stripFabricatedNewFiles(finalText, fileTreePaths);
    }
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

  return stripRetrievalMarkers(finalText);
}
