import { estimateTokens, estimateMessagesTokens, getContextWindow } from './tokenEstimator';
import { fitConversationWithSummarization } from './conversationSummarizer';

const BUDGET_RATIOS = {
  fewShot: 0.20,
  conversation: 0.80,
};

const RESERVED_FOR_OUTPUT = 8192;

export async function buildContext({
  systemPrompt,
  fewShotExamples = [],
  sceneContextParts = [],
  repoContext = '',
  messages,
  modelId,
  signal,
}) {
  const contextWindow = getContextWindow(modelId);
  const available = contextWindow - RESERVED_FOR_OUTPUT;

  const systemTokens = estimateTokens(systemPrompt);
  const sceneTokens = sceneContextParts.reduce((s, p) => s + estimateTokens(p), 0);
  const repoTokens = estimateTokens(repoContext);

  const fixedCost = systemTokens + sceneTokens + repoTokens;
  let remainingBudget = available - fixedCost;

  if (remainingBudget <= 0) {
    return {
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-4),
      ],
      tokenUsage: { total: fixedCost, budget: available, overflow: true },
      summary: null,
    };
  }

  const fewShotBudget = Math.floor(remainingBudget * BUDGET_RATIOS.fewShot);
  const convBudget = remainingBudget - fewShotBudget;

  const trimmedFewShot = trimMessagesToFit(fewShotExamples, fewShotBudget);
  const actualFewShotTokens = estimateMessagesTokens(trimmedFewShot);

  let conversationToInclude = [];
  let summary = null;

  const fullConvTokens = estimateMessagesTokens(messages);

  if (fullConvTokens <= convBudget) {
    conversationToInclude = messages;
  } else {
    const result = await fitConversationWithSummarization(messages, convBudget, { signal });
    conversationToInclude = result.messages;
    summary = result.summary;
  }

  const contextParts = [systemPrompt];
  if (sceneContextParts.length > 0) contextParts.push(sceneContextParts.join('\n\n'));
  if (repoContext) contextParts.push(repoContext);

  const finalMessages = [
    { role: 'system', content: contextParts.join('\n\n') },
    ...trimmedFewShot,
    ...conversationToInclude,
  ];

  const tokenUsage = {
    total: estimateMessagesTokens(finalMessages),
    budget: available,
    system: systemTokens + sceneTokens + repoTokens,
    fewShot: actualFewShotTokens,
    conversation: estimateMessagesTokens(conversationToInclude),
    summaryIncluded: !!summary,
  };

  return { messages: finalMessages, tokenUsage, summary };
}

function trimMessagesToFit(messages, budget) {
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
