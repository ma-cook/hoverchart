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
const TRUNCATION_WARNING = `\n\n[Output truncated at ${(MAX_TOOL_RESULT_CHARS).toLocaleString()} chars. Use read_file with offset/limit or refine your search to narrow results.]`;
const RETRYABLE_TOOLS = new Set(['read_file', 'edit', 'write', 'search_code']);
const MAX_TOOL_RETRIES = 2;
const COMPRESSION_INTERVAL = 12;
const normalizePath = (p) => (p || '').replace(/^\.\//, '').replace(/\\/g, '/');

// ── Harness hard limits — prevent explore-forever / doom loops ───────────────
const MAX_EXPLORATION_ROUNDS = 24;
const FORCE_GENERATION_AFTER_ROUND = 32;
const MAX_SUBAGENT_SPAWNS_PER_TASK = 1;
const SUB_MAX_ROUNDS = 8;
const SUB_MAX_CHARS = 60000;
const SUB_MAX_TOOL_CONTENT = 12000;
const STUCK_EXPLORING_THRESHOLD = 10;

/**
 * Fix 1 + Fix 4: Build a "stop exploring, generate now" nudge that gets
 * appended to the messages when the agent has been exploring past
 * MAX_EXPLORATION_ROUNDS without producing any edit/write tool call.
 */
function buildForceGenerationMessage(rounds, exploredCount) {
  return {
    role: 'user',
    content: `⚠️ EXPLORATION LIMIT REACHED (round ${rounds + 1}, ${exploredCount} files read, no edits yet).

You have explored enough. Now produce the code changes. If you need to read a file to get the exact oldString for an edit, you may — but prioritize calling "edit" over further exploration.

Switch to PRODUCING CODE NOW:
  1. Prefer calling the "edit" tool with exact oldString/newString for the file you already located.
  2. If an edit fails, correct the oldString and retry — or switch to outputting each changed file as a full markdown code block labeled \`\`\`<ext>:<filePath> so the system can capture it.
  3. Output the final response as text containing the code blocks so your changes are recorded.`,
  };
}

/**
 * Fix 5: Synthesize a compact digest of the accumulated tool results so the
 * model receives digested context (not re-compressed noise) before being asked
 * to generate. Returns the synthesized summary text, or null on failure.
 */
async function synthesizeFindingsDigest(currentMessages, originalFileContents, getContentStore, getBase64Store) {
  // Step 1: extract the file paths the LLM has been looking at
  const searchedPaths = [];
  const readPaths = new Set();
  for (const m of currentMessages) {
    if (m.tool_calls) {
      for (const tc of m.tool_calls) {
        try {
          const args = typeof tc.function?.arguments === 'string'
            ? JSON.parse(tc.function.arguments)
            : tc.function?.arguments;
          if (tc.function?.name === 'read_file' && args?.path) readPaths.add(args.path);
          if (tc.function?.name === 'search_code' && args?.pattern) searchedPaths.push(args.pattern);
          if (tc.function?.name === 'file_outline' && args?.path) readPaths.add(args.path);
        } catch { /* ignore */ }
      }
    }
  }

  // Step 2: read the key files' FULL content from the content store
  const DIGEST_FILE_BUDGET = 25000;
  let budgetRemaining = DIGEST_FILE_BUDGET;
  const fileContents = [];

  // Prefer files the LLM explicitly read via read_file or file_outline
  const candidates = Array.from(new Set([...readPaths, ...searchedPaths.flatMap(s =>
    typeof s === 'string' && s.length > 2 ? [s] : []
  )]));

  for (const path of candidates) {
    if (budgetRemaining <= 500) break;
    // Check if already cached
    if (originalFileContents?.has(path)) {
      const content = originalFileContents.get(path);
      const label = `\n=== ${path} ===\n`;
      const available = budgetRemaining - label.length;
      const snippet = content.length > available
        ? content.slice(0, available) + `\n...[truncated]`
        : content;
      fileContents.push(label + snippet);
      budgetRemaining -= label.length + snippet.length;
      continue;
    }
    // Try to load from content store
    try {
      const store = getContentStore?.();
      const b64Store = getBase64Store?.();
      if (store?._hydrated && b64Store?._hydrated) {
        const entry = store.getEntry(`repo:${path}`) || store.getEntry(`github:${path}`);
        if (entry) {
          const chunks = b64Store.getChunks(entry.chunks.map(c => c.id));
          if (chunks.length > 0) {
            const content = chunks.map(c => c.text).join('');
            originalFileContents?.set(path, content);
            const label = `\n=== ${path} ===\n`;
            const available = budgetRemaining - label.length;
            const snippet = content.length > available
              ? content.slice(0, available) + `\n...[truncated]`
              : content;
            fileContents.push(label + snippet);
            budgetRemaining -= label.length + snippet.length;
          }
        }
      }
    } catch { /* ignore */ }
  }

  if (fileContents.length === 0) return null;

  return fileContents.join('\n');
}

function isTransientError(error) {
  const msg = typeof error === 'string' ? error : (error?.message || error?.content || '');
  if (msg.includes('timeout') || msg.includes('timed out')) return true;
  if (msg.includes('ECONNREFUSED') || msg.includes('ECONNRESET')) return true;
  if (msg.includes('ETIMEDOUT') || msg.includes('ENOTFOUND')) return true;
  if (msg.includes('500') || msg.includes('502') || msg.includes('503')) return true;
  if (msg.includes('rate limit') || msg.includes('too many requests')) return true;
  return false;
}

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

async function compressMessages(msgs, { summarizerFn } = {}) {
  if (msgs.length <= 2) return msgs;

  const systemMsg = msgs[0];
  const userMsg = msgs[1];
  const rest = [...msgs.slice(2)];

  const lastReadByPath = new Map();
  // Files the model has attempted to edit/write — their reads must stay exact
  // so the edit tool can land oldString without lossy compression.
  const editTargetPaths = new Set();
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
        if (tc.function?.name === 'edit' || tc.function?.name === 'write') {
          try {
            const args = typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function.arguments;
            if (args?.filePath) editTargetPaths.add(normalizePath(args.filePath));
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
        if (args.path && lastReadByPath.get(args.path) > i && !editTargetPaths.has(normalizePath(args.path))) {
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

  let result = [systemMsg, userMsg, ...rest];
  const totalSize = estimateMessagesSize(result);
  if (totalSize > MAX_CONTEXT_CHARS * 0.6 && rest.length > 10) {
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
    let summarized = 0;
    const keepIndices = new Set(rest.map((_, i) => i));
    const keepLast = Math.max(5, Math.floor(pairs.length * 0.5));
    for (let p = 0; p < pairs.length - keepLast; p++) {
      const pair = pairs[p];
      const hasToolCalls = pair.assistant.tool_calls?.some(tc => tc.function?.name === 'edit' || tc.function?.name === 'write' || tc.function?.name === 'read_file' || tc.function?.name === 'search_code');
      if (!hasToolCalls && (!pair.assistant.content || pair.assistant.content.length < 50)) {
        keepIndices.delete(pair.endIdx);
        for (let k = pair.endIdx - 1; k >= 0 && rest[k] !== pair.assistant; k--) {
          keepIndices.delete(k);
        }
        const idx = rest.indexOf(pair.assistant);
        if (idx >= 0) keepIndices.delete(idx);
        dropped++;
      }
    }
    if (summarizerFn) {
      for (let p = 0; p < pairs.length - keepLast; p++) {
        const pair = pairs[p];
        const asstIdx = rest.indexOf(pair.assistant);
        if (!keepIndices.has(asstIdx)) continue;
        const hasToolCalls = pair.assistant.tool_calls?.some(tc => tc.function?.name === 'edit' || tc.function?.name === 'write' || tc.function?.name === 'read_file' || tc.function?.name === 'search_code');
        // Never summarize pairs that touched a file the model intends to edit —
        // the exact read content and edit result are needed for subsequent edits.
        const pairHitsEditTarget = (pair.assistant.tool_calls || []).some(tc => {
          if (tc.function?.name !== 'read_file' && tc.function?.name !== 'edit' && tc.function?.name !== 'write') return false;
          try {
            const args = typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function.arguments;
            const path = args?.path || args?.filePath;
            return !!path && editTargetPaths.has(normalizePath(path));
          } catch { return false; }
        });
        if (hasToolCalls && !pairHitsEditTarget && pair.tools.length > 0 && pair.assistant.content?.length < 100) {
          const summary = await summarizerFn(pair.assistant, pair.tools);
          if (summary) {
            pair.assistant.content = `[Previously: ${summary}]`;
            pair.assistant.tool_calls = undefined;
            for (const tool of pair.tools) {
              const tIdx = rest.indexOf(tool);
              if (tIdx >= 0) keepIndices.delete(tIdx);
            }
            summarized++;
          }
        }
      }
    }
    if (dropped > 0 || summarized > 0) {
      const filtered = rest.filter((_, i) => keepIndices.has(i));
      console.log(`[Compression] Dropped ${dropped} silent pairs, summarized ${summarized} old pairs`);
      result = [systemMsg, userMsg, ...filtered];
    }
  }

  return result;
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

const CODE_BLOCK_LABEL_REGEX = /```([a-zA-Z0-9+_-]+):([^\n`]*?)\n([\s\S]*?)```/g;

/**
 * Fix 4 post-processor: any markdown code block (```<ext>:<path>) whose path
 * corresponds to a file we have the original content for is converted into a
 * SEARCH/REPLACE patch (or dropped if unchanged). Blocks for NEW files are left
 * as complete-content blocks. This guarantees the push pipeline never receives
 * a full-file dump of an existing file, which it refuses to apply.
 */
function normalizeFinalCodeBlocks(text, originalFileContents) {
  if (!text || !originalFileContents || originalFileContents.size === 0) return text;
  const matches = [...text.matchAll(CODE_BLOCK_LABEL_REGEX)];
  if (matches.length === 0) return text;
  const replacements = [];
  for (const m of matches) {
    const [full, , filePathRaw, content] = m;
    const filePath = normalizePath(filePathRaw.trim());
    if (!filePath || filePath.includes(' ')) continue;
    const original = originalFileContents.get(filePath);
    if (original == null) continue;
    if (original === content) {
      replacements.push({ full, next: '' });
      continue;
    }
    const patch = generateSearchReplacePatch(original, content, filePath);
    if (patch) {
      replacements.push({ full, next: patch });
    }
  }
  let updated = text;
  for (const { full, next } of replacements) {
    updated = updated.replace(full, next);
  }
  return updated;
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

async function executeWithRetry(tc, execFn) {
  for (let attempt = 0; attempt <= MAX_TOOL_RETRIES; attempt++) {
    try {
      const result = await execFn();
      if (!result.success && isTransientError(result.content) && attempt < MAX_TOOL_RETRIES && RETRYABLE_TOOLS.has(tc.name)) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 4000);
        console.warn(`[Retry] ${tc.name} attempt ${attempt + 1}/${MAX_TOOL_RETRIES + 1}: ${result.content?.slice(0, 80)}... Retrying in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      return result;
    } catch (error) {
      if (attempt < MAX_TOOL_RETRIES && RETRYABLE_TOOLS.has(tc.name) && isTransientError(error)) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 4000);
        console.warn(`[Retry] ${tc.name} attempt ${attempt + 1}/${MAX_TOOL_RETRIES + 1} threw: ${error.message}. Retrying in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw error;
    }
  }
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
  let lastCompressionRound = -COMPRESSION_INTERVAL;

  // Fix 2: track sub-agent spawns per task to enforce hard cap and dedupe prompts.
  const subAgentSpawnCount = { value: 0 };
  const subAgentPrompts = new Set();

  // Fix 1 / Fix 4: track whether the agent has produced any edit/write this run.
  let producedEdit = false;
  let forceGenerationInjected = false;
  let digestInjected = false;
  // Names of tools actually sent to the model this round. Used by the
  // execution-time gate to block hallucinated calls to tools that are not in
  // the round's tool list.
  let currentToolNames = new Set();

  resetEditTracker();
  initializeDefaultSkills({
    fileTree,
    fileSizes: _fileSizes,
    sceneObjects,
  });

  // Pre-activate architecture context so the model has the graph/community
  // tools and their instructions ready from round 1 — no list_skills /
  // activate_skill discovery rounds needed.
  for (const skillName of ['architecture-map', 'import-analysis', 'community-architecture']) {
    REGISTRY.activate(skillName);
  }

  const userMessages = messages.filter(m => m.role === 'user');
  const taskType = globalRouter.classifyTaskType(messages, computeTools());
  console.log(`[sendWithRetrieval] Classified task type: ${taskType}`);

  const mainInvocation = globalMonitor.startInvocation({
    agentName: 'sendWithRetrieval',
    inputs: { messageCount: messages.length, fileTreeSize: fileTree?.length },
  });

  const summarizeOldRound = async (assistantMsg, toolMsgs) => {
    const toolSnippets = toolMsgs.map(t => (t.content || '').slice(0, 800)).join('\n---\n');
    const prompt = `Summarize what the assistant learned or accomplished in 1 sentence (max 50 words):\n\nAssistant: ${(assistantMsg.content || '(no text)').slice(0, 300)}\n\nTool results:\n${toolSnippets.slice(0, 2500)}`;
    try {
      const result = await sendToZen({
        messages: [
          { role: 'system', content: 'You summarize concisely. Return only the summary, no prefixes.' },
          { role: 'user', content: prompt },
        ],
        tools: [],
        signal: null,
      });
      const summary = (typeof result === 'string' ? result : result?.text || '').trim().slice(0, 400);
      return summary || null;
    } catch { return null; }
  };

  while (true) {
    const currentSize = estimateMessagesSize(currentMessages);
    if (currentSize > MAX_CONTEXT_CHARS || (currentSize > MAX_CONTEXT_CHARS * 0.6 && (rounds - lastCompressionRound) >= COMPRESSION_INTERVAL)) {
      lastCompressionRound = rounds;
      currentMessages = await compressMessages(currentMessages, { summarizerFn: summarizeOldRound });
      console.log(`[ToolRound] Compressed to ${currentMessages.length} messages (${estimateMessagesSize(currentMessages)} chars)`);
    }

    // ── Fix 1: gentle nudge from exploration → generation ───────────────────
    // When the agent has been exploring past the cap without edits, append a
    // nudge message asking it to switch to producing changes. Unlike the old
    // behavior, the system prompt is NOT replaced and NO tools are stripped —
    // the model keeps read_file/search_code so it can still pull exact text
    // for edit oldString and verify its changes. The nudge is advisory only.
    if (
      !producedEdit &&
      !forceGenerationInjected &&
      rounds >= MAX_EXPLORATION_ROUNDS &&
      rounds < FORCE_GENERATION_AFTER_ROUND
    ) {
      forceGenerationInjected = true;
      const forceMsg = buildForceGenerationMessage(rounds, readFiles.size);
      currentMessages = [...currentMessages, forceMsg];
      console.warn(`[ToolRound] Fix 1: nudged into generation at round ${rounds + 1} — all tools remain available`);
    }

    // ── Fix 5: synthesize a digest so the model gets digested context ─────
    // Once before the force-generation round, hand the model a terse digest
    // of what exploration found (file:line targets to edit), so it has the
    // synthesis it needs rather than re-reading compressed noise.
    if (
      !producedEdit &&
      !digestInjected &&
      rounds >= STUCK_EXPLORING_THRESHOLD &&
      rounds < MAX_EXPLORATION_ROUNDS
    ) {
      digestInjected = true;
      try {
        const digest = await synthesizeFindingsDigest(currentMessages, originalFileContents, getContentStore, getBase64Store);
        if (digest) {
          currentMessages = [...currentMessages, {
            role: 'user',
            content: `📋 EXPLORATION DIGEST (synthesized from prior tool calls):\n\n${digest}\n\nUse this digest to locate your edit targets. Do NOT re-read these files.`,
          }];
          console.warn(`[ToolRound] Fix 5: injected findings digest at round ${rounds + 1} (${digest.length} chars)`);
        }
      } catch (e) {
        console.warn(`[ToolRound] Fix 5: digest synthesis failed: ${e.message}`);
      }
    }

    // ── Fix 4: last-resort hard stop past FORCE_GENERATION_AFTER_ROUND ──────
    if (!producedEdit && rounds >= FORCE_GENERATION_AFTER_ROUND) {
      console.warn(`[ToolRound] Fix 4: hard stop at round ${rounds + 1} (>= ${FORCE_GENERATION_AFTER_ROUND}) with 0 edits — forcing generation exit`);
      // Strip ALL tools and demand the LLM emit its proposed changes as
      // SEARCH/REPLACE blocks (for existing files) or full-content blocks
      // (for new files) inside markdown code blocks. The push pipeline applies
      // SEARCH/REPLACE against the current repo content, so this does not
      // depend on the edit tool's oldString matching succeeding and never
      // dumps a whole existing file (which the pusher would refuse).
      const originalSystem = currentMessages[0]?.content || '';
      currentMessages[0] = {
        ...currentMessages[0],
        content: `FINAL RESPONSE REQUIRED — OUTPUT CODE CHANGES ONLY

You have explored enough. No tools are available now. Respond with ONLY your proposed code changes as markdown code blocks.

For an EXISTING file, output ONE code block labeled \`\`\`<ext>:<repo-relative-path> whose content is one or more SEARCH/REPLACE pairs:

\`\`\`jsx:src/components/UIOverlay.jsx
<<<<<<< SEARCH
<exact current code that must match the file — copy it from the read_file output>
=======
<replacement code>
>>>>>>> REPLACE
\`\`\`

Rules:
- The SEARCH text MUST match the current file content EXACTLY (including whitespace/indentation). Copy it from the read_file output you already received.
- Keep each SEARCH/REPLACE pair as small as possible while uniquely identifying the location.
- For a NEW file that does not exist yet, output \`\`\`<ext>:<repo-relative-path> containing the COMPLETE new file content (no SEARCH/REPLACE markers).
- One code block per file. Label format: \`\`\`<extension>:<filePath> (colon, no spaces, no "path=").
- Output nothing except a one-line intro and the code blocks.

If no file changes are needed, output exactly: "No changes required."

Original system prompt (abbreviated):
---
${originalSystem.slice(0, 1500)}`,
      };
      const forceExit = {
        role: 'user',
        content: `⚠️ FINAL REQUEST (round ${rounds + 1}): You MUST now produce the code changes. Existing files: use SEARCH/REPLACE blocks (<<<<<<< SEARCH / ======= / >>>>>>> REPLACE) whose SEARCH text matches the current file exactly, inside a single \`\`\`<ext>:<filePath> block. New files: output the complete content. This is the last message you will receive — do not explain, just output the code blocks.`,
      };
      currentMessages = [...currentMessages, forceExit];
      let finalRaw = null;
      try {
        finalRaw = await sendToZen({ messages: currentMessages, tools: [], signal });
      } catch (e) {
        console.warn(`[ToolRound] Fix 4: final send failed: ${e.message}`);
      }
      const finalRes = typeof finalRaw === 'string' ? { text: finalRaw, toolCalls: [] } : (finalRaw || { text: '', toolCalls: [] });
      if (finalRes.text) {
        // If the model still emitted full-file blocks for files we have the
        // original content for, convert them to SEARCH/REPLACE patches so the
        // push pipeline can apply them without losing code.
        const normalized = normalizeFinalCodeBlocks(finalRes.text, originalFileContents);
        finalText = finalText ? finalText + '\n\n' + normalized : normalized;
      }
      break;
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
        const availableTools = computeTools({});
        currentToolNames = new Set(availableTools.map(t => t.function.name));
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
      // Fix 2: enforce a hard cap on sub-agent spawns per task.
      if (subAgentSpawnCount.value >= MAX_SUBAGENT_SPAWNS_PER_TASK) {
        console.warn(`[SubAgent] Spawn rejected: cap reached (${MAX_SUBAGENT_SPAWNS_PER_TASK} per task). Returning short refusal.`);
        return `[Sub-agent unavailable: spawn cap of ${MAX_SUBAGENT_SPAWNS_PER_TASK} reached for this task. Use the main thread's existing tools/edit instead.]`;
      }
      // Fix 2: deduplicate near-identical prompts (ignore whitespace differences).
      const promptKey = (prompt || '').trim().replace(/\s+/g, ' ').toLowerCase().slice(0, 200);
      if (subAgentPrompts.has(promptKey)) {
        console.warn(`[SubAgent] Spawn rejected: duplicate prompt ("${promptKey.slice(0, 60)}..."). Returning refusal.`);
        return `[Sub-agent not spawned: an identical sub-agent was already used this task. Re-use its results or do the research directly with read_file/search_code.]`;
      }
      subAgentPrompts.add(promptKey);
      subAgentSpawnCount.value++;

      const subInvocation = globalMonitor.startInvocation({
        agentName: 'sub-agent',
        inputs: { prompt: prompt.slice(0, 200), depth: subDepth },
      });
      const subMessages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ];
      let subText = '';
      // Fix 3: constants now declared at module scope (SUB_MAX_ROUNDS, SUB_MAX_CHARS,
      //        SUB_MAX_TOOL_CONTENT) with budgets large enough for an 80KB file.
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
          return executeWithRetry(tc, () => executeTool(tc.name, tc.arguments, ghCtx, ft, { runSubAgent, depth: subDepth }))
            .then(r => ({ tc, result: r }))
            .catch(e => ({ tc, result: { success: false, content: `Error: ${e.message}` } }));
        }));
        for (const { tc, result: subResult } of subResults) {
          let content = subResult.content || '';
          if (content.length > SUB_MAX_TOOL_CONTENT) {
            const subWarning = `\n[Sub-agent output truncated at ${SUB_MAX_TOOL_CONTENT.toLocaleString()} chars. Use more specific queries to narrow results.]`;
            content = content.slice(0, SUB_MAX_TOOL_CONTENT) + subWarning;
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
      // Execution-time gate: never execute a tool that wasn't sent to the
      // model this round. The model sometimes keeps calling tools that were
      // stripped (search_code / list_files / etc.) because it saw them in
      // earlier context; executing them would silently keep it in exploration
      // mode. Return a synthetic "unavailable" result instead so it pivots.
      if (!currentToolNames.has(tc.name)) {
        console.warn(`[ToolRound] Blocking ${tc.name} — not in this round's available tools`);
        onToolProgress?.({ tool: tc.name, index: idx + 1, total: totalTools, status: 'done' });
        const generationHint = forceGenerationInjected
          ? ' You are in GENERATION MODE: produce code changes now. Call "edit" (or "write" for a new file), or output code blocks as text.'
          : '';
        return Promise.resolve({
          tc,
          result: {
            success: false,
            content: `[Tool unavailable: ${tc.name} is not in this round's available tools.${generationHint}]`,
          },
          error: null,
        });
      }
      if (tc.name === 'read_file' && tc.arguments?.path) {
        const key = readKey(tc);
        const filePath = normalizePath(tc.arguments.path);
        // Serve the requested range from the exact cached content FIRST so
        // re-reads return real text (needed for precise edit oldString), and
        // never a "do not re-read" stub.
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

        if (readFilesBefore.has(key)) {
          const off = tc.arguments.offset || 1;
          const lim = tc.arguments.limit || 2000;
          console.warn(`[ToolRound] Round ${rounds + 1}: ${filePath} (offset=${off}) already read and not cached, skipping fetch`);
          onToolProgress?.({ tool: tc.name, index: idx + 1, total: totalTools, status: 'done' });
          globalMonitor.recordTool({ toolName: tc.name, args: tc.arguments, result: '[cached]', duration: 0 });
          return Promise.resolve({
            tc,
            result: { success: true, content: `[Already loaded: ${filePath} lines ${off}-${off + lim - 1} — see prior tool response above.]` },
            error: null,
          });
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
      return executeWithRetry(tc, () => executeTool(tc.name, tc.arguments, githubContext, fileTree, { runSubAgent, depth: 0 }))
        .then(result => {
          if (tc.name === 'read_file' && result._fullContent) {
            const fp = normalizePath(tc.arguments?.path);
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

    for (const { tc, result } of toolResults) {
      if ((tc.name === 'edit' || tc.name === 'write') && result.success && tc.arguments?.filePath) {
        originalFileContents.delete(normalizePath(tc.arguments.filePath));
      }
    }

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
        // Fix 1: mark that the agent has transitioned from exploration → generation.
        if (toolResult.success) producedEdit = true;
      }
      let content = toolResult.content;
      if (content && content.length > MAX_TOOL_RESULT_CHARS) {
        content = content.slice(0, MAX_TOOL_RESULT_CHARS) + TRUNCATION_WARNING;
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
