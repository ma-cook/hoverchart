import { sendToZen } from '../zenService';

export async function summarizeText(text, { signal } = {}) {
  if (!text || text.length < 200) return text;

  const truncated = text.length > 8000 ? text.slice(0, 8000) : text;

  const messages = [
    {
      role: 'system',
      content: 'You are a precise summarization assistant. Output only the summary, no preamble. Preserve: key decisions, technical choices, filenames, user preferences, unresolved questions. Drop: greetings, pleasantries, intermediate reasoning.',
    },
    {
      role: 'user',
      content: `Summarize this conversation into a concise paragraph (max 150 words):\n\n${truncated}`,
    },
  ];

  try {
    const result = await sendToZen({ messages, signal, onChunk: () => {} });
    return result || text;
  } catch {
    return text;
  }
}
