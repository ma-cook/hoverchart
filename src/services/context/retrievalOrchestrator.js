import { sendToZen } from '../zenService';
import { stripRetrievalMarkers } from './retrievalProtocol';
import { CODE_GEN_TOOLS, executeTool } from './toolExecutor';

const MAX_TOOL_ROUNDS = 10;
const MAX_TOTAL_CHARS = 40000;
const MAX_TOOL_ONLY_ROUNDS = 6;
const MAX_UNHELPFUL_ROUNDS = 3;
const UNHELPFUL_THRESHOLD = 30;
const CODE_REMINDER = `
You have called tools multiple times without producing a code response.
If you have enough context, write your COMPLETE code response NOW.
If you still need to read files, do so, but write your code after reading.
Do NOT keep calling search_code or list_files — use read_file for specific files, then produce code.`;

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

function trimMessages(msgs) {
  if (msgs.length <= 2) return msgs;

  const systemMsg = msgs[0];
  const userMsg = msgs[1];
  const rest = msgs.slice(2);

  const systemLen = (systemMsg.content || '').length;
  if (systemLen > MAX_TOTAL_CHARS * 0.75) {
    const userRestSize = estimateMessagesSize([userMsg, ...rest]);
    const systemBudget = Math.max(4000, MAX_TOTAL_CHARS - userRestSize);
    systemMsg.content = systemMsg.content.slice(0, systemBudget);
  }

  while (rest.length > 0 && estimateMessagesSize([systemMsg, userMsg, ...rest]) > MAX_TOTAL_CHARS) {
    let removeCount = 0;
    if (rest[0]?.role === 'assistant') {
      removeCount = 1;
      while (removeCount < rest.length && rest[removeCount]?.role === 'tool') {
        removeCount++;
      }
    } else {
      removeCount = 1;
    }
    if (removeCount >= rest.length) break;
    rest.splice(0, removeCount);
  }

  console.log(`[Retrieval] Trimmed to ${rest.length + 2} messages (${estimateMessagesSize([systemMsg, userMsg, ...rest])} chars)`);
  return [systemMsg, userMsg, ...rest];
}

function hasCodeBlocks(text) {
  return text && /```[\s\S]+?```/.test(text);
}

function isUsefulToolResult(content, toolName) {
  if (!content) return false;
  if (content.length < UNHELPFUL_THRESHOLD) return false;
  if (/^Error:|^File not found:|^No (matching|files)/i.test(content)) return false;
  if (toolName === 'search_code' && !/\S/.test(content)) return false;
  return true;
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
  let consecutiveUnhelpfulRounds = 0;

  while (rounds < MAX_TOOL_ROUNDS) {
    if (estimateMessagesSize(currentMessages) > MAX_TOTAL_CHARS) {
      currentMessages = trimMessages(currentMessages);
    }

    const isReminderRound = toolOnlyRounds >= MAX_TOOL_ONLY_ROUNDS && !hasCodeBlocks(finalText);

    if (isReminderRound) {
      currentMessages.push({
        role: 'system',
        content: CODE_REMINDER,
      });
      console.warn(`[ToolRound] Round ${rounds + 1}: injecting write-code reminder (${toolOnlyRounds} tool-only rounds)`);
    }

    console.log(`[ToolRound] Round ${rounds + 1}/${MAX_TOOL_ROUNDS} - sending ${currentMessages.length} messages (${estimateMessagesSize(currentMessages)} chars)`);

    const rawResult = await sendToZen({
      messages: currentMessages,
      tools: CODE_GEN_TOOLS,
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

    toolOnlyRounds++;

    onRetrieval?.({ chunkIds: toolCalls.map(tc => tc.name + ':' + JSON.stringify(tc.arguments)), round: rounds + 1 });

    const assistantMessage = { role: 'assistant', content: text || null, tool_calls: toolCalls.map(tc => ({
      id: tc.id,
      type: 'function',
      function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
    }))};

    currentMessages = [...currentMessages, assistantMessage];

    const totalTools = toolCalls.length;
    onToolProgress?.({ tool: 'starting', index: 0, total: totalTools, status: 'executing' });

    const toolPromises = toolCalls.map((tc, idx) => {
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

    const anyUseful = toolResults.some(({ tc, result }) => isUsefulToolResult(result.content, tc.name));
    if (anyUseful) {
      consecutiveUnhelpfulRounds = 0;
    } else {
      consecutiveUnhelpfulRounds++;
      console.warn(`[ToolRound] Round ${rounds + 1}: all ${toolResults.length} tool result(s) unhelpful (${consecutiveUnhelpfulRounds}/${MAX_UNHELPFUL_ROUNDS})`);
    }

    if (consecutiveUnhelpfulRounds >= MAX_UNHELPFUL_ROUNDS) {
      console.warn(`[ToolRound] Breaking: ${consecutiveUnhelpfulRounds} consecutive rounds with no useful tool results`);
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
  }

  return stripRetrievalMarkers(finalText);
}
