import { estimateMessagesTokens } from './tokenEstimator';
import { summarizeText } from './summarizer';

const RECENT_COUNT = 8;

export async function fitConversationWithSummarization(messages, budget, { signal } = {}) {
  if (messages.length <= RECENT_COUNT) {
    return { messages: truncateFromFront(messages, budget), summary: null };
  }

  const recentMessages = messages.slice(-RECENT_COUNT);
  const olderMessages = messages.slice(0, -RECENT_COUNT);

  const recentTokens = estimateMessagesTokens(recentMessages);

  if (recentTokens >= budget) {
    return { messages: truncateFromFront(messages, budget), summary: null };
  }

  const summaryBudget = budget - recentTokens;
  const olderText = olderMessages.map(m => `${m.role}: ${m.content}`).join('\n\n');

  const summary = await summarizeText(olderText, { signal });

  const summaryMessage = {
    role: 'system',
    content: `[CONVERSATION SUMMARY]\n${summary}\n[END SUMMARY]\n\nRecent messages follow:`,
  };

  const summaryTokens = estimateMessagesTokens([summaryMessage]);

  if (summaryTokens > summaryBudget) {
    return { messages: truncateFromFront(messages, budget), summary };
  }

  return {
    messages: [summaryMessage, ...recentMessages],
    summary,
  };
}

function truncateFromFront(messages, budget) {
  const result = [];
  let tokens = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const msgTokens = estimateMessagesTokens([messages[i]]);
    if (tokens + msgTokens > budget) break;
    result.unshift(messages[i]);
    tokens += msgTokens;
  }
  return result;
}
