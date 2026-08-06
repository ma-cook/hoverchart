const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
  'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
  'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each',
  'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
  'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
  'because', 'but', 'and', 'or', 'if', 'while', 'this', 'that', 'these',
  'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'it', 'its',
  'they', 'them', 'their', 'what', 'which', 'who', 'whom',
  'import', 'export', 'from', 'const', 'let', 'var', 'function', 'return',
  'if', 'else', 'for', 'while', 'class', 'extends', 'new', 'this',
  'async', 'await', 'try', 'catch', 'throw', 'typeof', 'instanceof',
  'true', 'false', 'null', 'undefined', 'void', 'delete', 'yield',
]);

export function extractKeywords(text, maxKeywords = 10) {
  if (!text) return [];
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));

  const freq = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

export function chunkText(text, { chunkSize = 2000, overlap = 200, delimiter = '\n\n', idPrefix = '' } = {}) {
  if (!text) return [];
  const chunks = [];
  let start = 0;
  let chunkIndex = 0;

  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length);

    if (end < text.length) {
      const lastDelimiter = text.lastIndexOf(delimiter, end);
      if (lastDelimiter > start + chunkSize * 0.5) {
        end = lastDelimiter;
      }
    }

    const chunkContent = text.slice(start, end);
    chunks.push({
      // Chunk IDs must be globally unique across ALL entries. A bare
      // "chunk-N" (as before) collides between files, so Base64Store's
      // flat encodedChunks map (and its linear fallback) could return ANOTHER
      // file's chunk text — corrupting read_file/quick_look/edit content and
      // forcing spurious "oldString not found" → GitHub re-fetch churn that
      // looked like the edit tool hanging. idPrefix is the entry id.
      id: idPrefix ? `${idPrefix}:chunk-${chunkIndex}` : `chunk-${chunkIndex}`,
      text: chunkContent,
      startIndex: start,
      endIndex: end,
      keywords: extractKeywords(chunkContent),
      charCount: chunkContent.length,
    });

    start = end - overlap;
    if (start >= text.length) break;
    chunkIndex++;
  }

  return chunks;
}
