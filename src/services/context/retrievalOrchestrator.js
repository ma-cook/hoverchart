import { sendToZen } from '../zenService';
import { stripRetrievalMarkers } from './retrievalProtocol';
import { CODE_GEN_TOOLS, executeTool } from './toolExecutor';

const MAX_TOOL_ROUNDS = 10;

export async function sendWithRetrieval({
  messages,
  onChunk,
  signal,
  onRetrieval,
  githubContext,
  fileTree,
}) {
  let currentMessages = [...messages];
  let finalText = '';
  let rounds = 0;

  const MAX_TOTAL_CHARS = 40000;

  function estimateMessagesSize(msgs) {
    let total = 0;
    for (const m of msgs) total += (m.content || '').length;
    return total;
  }

  function trimMessages(msgs) {
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

    console.log(`[Retrieval] Trimmed messages to ${rest.length} messages (${estimateMessagesSize([systemMsg, userMsg, ...rest])} chars)`);
    return [systemMsg, userMsg, ...rest];
  }

  while (rounds <= MAX_TOOL_ROUNDS) {
    const totalChars = estimateMessagesSize(currentMessages);
    if (totalChars > MAX_TOTAL_CHARS) {
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

    for (const tc of toolCalls) {
      console.log(`[ToolRound] Executing: ${tc.name}(${JSON.stringify(tc.arguments)})`);
      const toolResult = await executeTool(tc.name, tc.arguments, githubContext, fileTree);
      currentMessages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: toolResult.content,
      });
    }

    rounds++;
  }

  return stripRetrievalMarkers(finalText);
}
