const CODE_CHARS = new Set('{}[]();:=<>!&|?+-*/%^~`'.split(''));

export function estimateTokens(text) {
  if (!text) return 0;
  let codeCount = 0;
  for (let i = 0; i < text.length; i++) {
    if (CODE_CHARS.has(text[i])) codeCount++;
  }
  const codeRatio = codeCount / Math.max(text.length, 1);
  const charsPerToken = 4 - codeRatio;
  return Math.ceil(text.length / charsPerToken);
}

export function estimateMessageTokens(message) {
  if (!message || !message.content) return 0;
  return estimateTokens(message.content) + 5;
}

export function estimateMessagesTokens(messages) {
  if (!messages) return 0;
  return messages.reduce((sum, m) => sum + estimateMessageTokens(m), 0);
}

export const CONTEXT_WINDOWS = {
  'claude-3.5-sonnet': 200000,
  'claude-3-opus': 200000,
  'claude-3-haiku': 200000,
  'gemini-1.5-pro': 200000,
  'gemini-1.5-flash': 200000,
  'gemini-2': 200000,
  'gpt-4o': 128000,
  'gpt-4-turbo': 128000,
  'gpt-4': 128000,
  'o1': 200000,
  'deepseek': 128000,
  'qwen': 128000,
  'default': 32000,
};

export function getContextWindow(modelId) {
  if (!modelId) return CONTEXT_WINDOWS.default;
  const lower = modelId.toLowerCase();
  for (const [key, size] of Object.entries(CONTEXT_WINDOWS)) {
    if (key === 'default') continue;
    if (lower.includes(key)) return size;
  }
  return CONTEXT_WINDOWS.default;
}
