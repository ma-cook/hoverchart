export const RETRIEVAL_MARKER_REGEX = /\[RETRIEVE:([^\]]+)\]/g;
export const MAX_RETRIEVAL_ROUNDS = 3;
export const GITHUB_FILE_PREFIX = 'github:';

export function isGithubFileRequest(chunkId) {
  return chunkId.startsWith(GITHUB_FILE_PREFIX);
}

export function extractGithubPath(chunkId) {
  return chunkId.slice(GITHUB_FILE_PREFIX.length);
}

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

const RETRIEVAL_INJECTION_BUDGET = 15000;

export function buildRetrievalInjection(chunkData) {
  const parts = ['[RETRIEVED CONTENT]'];
  let charCount = parts[0].length;
  let truncated = 0;

  for (const chunk of chunkData) {
    const header = `\n--- ${chunk.sourcePath} (chunk ${chunk.id}) ---`;
    const footer = `\n--- end ${chunk.id} ---`;
    const entryLen = header.length + chunk.text.length + footer.length + 1;

    if (charCount + entryLen > RETRIEVAL_INJECTION_BUDGET) {
      truncated++;
      continue;
    }

    parts.push(header);
    parts.push(chunk.text);
    parts.push(footer);
    charCount += entryLen;
  }

  if (truncated > 0) {
    parts.push(`\n... (${truncated} chunks truncated for context size)`);
  }

  parts.push('\n[END RETRIEVED CONTENT]');
  parts.push('\nNow continue your response with the above context available.');

  return {
    role: 'system',
    content: parts.join('\n'),
  };
}
