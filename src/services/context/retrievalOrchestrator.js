import { sendToZen } from '../zenService';
import { stripRetrievalMarkers } from './retrievalProtocol';
import { CODE_GEN_TOOLS, executeTool } from './toolExecutor';

const MAX_TOOL_ROUNDS = 10;
const MAX_TOTAL_CHARS = 120000;
const MAX_TOOL_ONLY_ROUNDS = 3;
const MAX_UNHELPFUL_ROUNDS = 3;
const MAX_SEARCH_ROUNDS = 4;
const MAX_TOTAL_READS = 8;
const CODE_REMINDER = `
CRITICAL: You have been calling tools for multiple rounds without producing code.
STOP calling search_code or list_files. You have enough context now.
Write your COMPLETE code response NOW — output the full implementation with code blocks.
If you absolutely need one more specific file, use read_file for that exact path, then IMMEDIATELY write your code.`;

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

function stripToolCallsFromHistory(msgs) {
  const cleaned = [];
  for (const m of msgs) {
    if (m.role === 'assistant' && m.tool_calls) continue;
    if (m.role === 'tool') continue;
    cleaned.push(m);
  }
  return cleaned;
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
        const isSearchOnly = prev.tool_calls.every(tc => tc.function?.name === 'search_code');
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
}) {
  let currentMessages = [...messages];
  let finalText = '';
  let rounds = 0;
  let toolOnlyRounds = 0;
  let totalSearchRounds = 0;
  let totalReads = 0;
  let consecutiveUnhelpfulRounds = 0;
  const readFiles = new Map();
  let duplicateReadRounds = 0;
  const toolCallHistory = new Map();

  while (rounds < MAX_TOOL_ROUNDS) {
    if (estimateMessagesSize(currentMessages) > MAX_TOTAL_CHARS) {
      currentMessages = trimMessages(currentMessages);
    }

    const forceWriteCode = (toolOnlyRounds >= MAX_TOOL_ONLY_ROUNDS || totalReads >= MAX_TOTAL_READS) && !hasCodeBlocks(finalText);
    const forceNoTools = totalSearchRounds >= MAX_SEARCH_ROUNDS;

    if (forceWriteCode || forceNoTools) {
      currentMessages.push({
        role: 'system',
        content: CODE_REMINDER,
      });
      console.warn(`[ToolRound] Round ${rounds + 1}: injecting write-code reminder (${toolOnlyRounds} tool-only, ${totalSearchRounds} search, ${totalReads} reads)`);
    }

    const useTools = !forceNoTools && !forceWriteCode;
    console.log(`[ToolRound] Round ${rounds + 1}/${MAX_TOOL_ROUNDS} - sending ${currentMessages.length} messages (${estimateMessagesSize(currentMessages)} chars) tools=${useTools}`);

    const rawResult = await sendToZen({
      messages: currentMessages,
      tools: useTools ? CODE_GEN_TOOLS : [],
      signal,
      onChunk: (delta, fullText) => {
        onChunk?.(delta, stripRetrievalMarkers(fullText));
      },
    });

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

    toolOnlyRounds++;

    const isSearchOnly = toolCalls.every(tc => tc.name === 'search_code');
    if (isSearchOnly) {
      totalSearchRounds++;
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
        totalReads++;
      }
      console.log(`[ToolRound] Executing: ${tc.name}(${JSON.stringify(tc.arguments)})`);
      onToolProgress?.({ tool: tc.name, index: idx + 1, total: totalTools, status: 'executing' });
      return executeTool(tc.name, tc.arguments, githubContext, fileTree)
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
      console.warn(`[ToolRound] Round ${rounds + 1}: all read_file calls are for already-read files (${duplicateReadRounds}/2)`);
    } else {
      duplicateReadRounds = 0;
    }

    if (consecutiveUnhelpfulRounds >= MAX_UNHELPFUL_ROUNDS) {
      console.warn(`[ToolRound] Breaking: ${consecutiveUnhelpfulRounds} consecutive rounds with no useful tool results`);
      break;
    }

    if (duplicateReadRounds >= 2) {
      console.warn(`[ToolRound] Breaking: ${duplicateReadRounds} consecutive rounds of re-reading same files`);
      break;
    }

    for (const { tc, result: toolResult } of toolResults) {
      currentMessages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: toolResult.content,
      });
    }

    onToolProgress?.({ tool: 'done', index: totalTools, total: totalTools, status: 'complete' });
    rounds++;
  }

  if (!hasCodeBlocks(finalText)) {
    console.warn(`[ToolRound] Exiting with no code blocks after ${rounds} rounds (${finalText.length} chars of text)`);
    console.warn(`[ToolRound] Attempting forced code generation round (no tools)...`);

    const cleanedHistory = stripToolCallsFromHistory(currentMessages);
    const forcedMessages = [
      ...cleanedHistory,
      { role: 'system', content: `IMPORTANT: Output ONLY code blocks. Do NOT use tool calls, do NOT use XML tags, do NOT use DSML format.

Use this exact format for each file you want to create or modify:

\`\`\`jsx:src/components/FileName.jsx
// your code here
\`\`\`

Write the COMPLETE file contents. Each code block must have the file path after the language tag.` },
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

  return stripRetrievalMarkers(finalText);
}
