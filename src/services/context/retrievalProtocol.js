export const RETRIEVAL_MARKER_REGEX = /\[RETRIEVE:([a-zA-Z0-9_\-,\s]+)\]/g;
export const MAX_RETRIEVAL_ROUNDS = 3;

export function detectRetrievalRequest(text) {
  const matches = [...text.matchAll(RETRIEVAL_MARKER_REGEX)];
  if (matches.length === 0) return null;

  const chunkIds = [];
  for (const match of matches) {
    const ids = match[1].split(',').map(s => s.trim()).filter(Boolean);
    chunkIds.push(...ids);
  }

  return chunkIds.length > 0 ? chunkIds : null;
}

export function stripRetrievalMarkers(text) {
  return text.replace(RETRIEVAL_MARKER_REGEX, '').trim();
}

export function buildRetrievalInjection(chunkData) {
  const parts = ['[RETRIEVED CONTENT]'];
  for (const chunk of chunkData) {
    parts.push(`\n--- ${chunk.sourcePath} (chunk ${chunk.id}) ---`);
    parts.push(chunk.text);
    parts.push(`--- end ${chunk.id} ---`);
  }
  parts.push('\n[END RETRIEVED CONTENT]');
  parts.push('\nNow continue your response with the above context available.');

  return {
    role: 'system',
    content: parts.join('\n'),
  };
}
