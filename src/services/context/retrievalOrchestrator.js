import { sendToZen } from '../zenService';
import { stripRetrievalMarkers } from './retrievalProtocol';
import { CODE_GEN_TOOLS, executeTool } from './toolExecutor';

const MAX_TOOL_ROUNDS = 10;
const MAX_TOTAL_CHARS = 40000;

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

  if (estimateMessagesSize([systemMsg, userMsg, ...rest]) > MAX_TOTAL_CHARS && systemMsg.content?.length > 4000) {
    const budget = MAX_TOTAL_CHARS - estimateMessagesSize([userMsg, ...rest]);
    if (budget > 0) {
      systemMsg.content = systemMsg.content.slice(0, budget);
    }
  }

  console.log(`[Retrieval] Trimmed to ${rest.length} messages (${estimateMessagesSize([systemMsg, userMsg, ...rest])} chars)`);
  return [systemMsg, userMsg, ...rest];
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

  while (rounds <= MAX_TOOL_ROUNDS) {
    if (estimateMessagesSize(currentMessages) > MAX_TOTAL_CHARS) {
      currentMessages = trimMessages(currentMessages);
    }

    console.log(`[ToolRound] Round ${rounds}/${MAX_TOOL_ROUNDS} - sending ${currentMessages.length} messages (${estimateMessagesSize(currentMessages)} chars)`);

    const result = await sendToZen({
      messages: currentMessages,
      tools: CODE_GEN_TOOLS,
      signal,
      onChunk: (delta, fullText) => {
        onChunk?.(delta, stripRetrievalMarkers(fullText));
      },
    });

    const { text, toolCalls } = result;
    finalText = text || finalText;
    console.log(`[ToolRound] Round ${rounds} complete. Text: ${finalText.length} chars, Tool calls: ${toolCalls.length}`);

    if (toolCalls.length === 0) {
      break;
    }

    onRetrieval?.({ chunkIds: toolCalls.map(tc => tc.name + ':' + JSON.stringify(tc.arguments)), round: rounds + 1 });

    const assistantMessage = { role: 'assistant', content: finalText || null, tool_calls: toolCalls.map(tc => ({
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

  return stripRetrievalMarkers(finalText);
}
