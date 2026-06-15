const MERFOLK_BLOCK_REGEX = /```merfolk\n([\s\S]*?)```/g;

export function extractMerfolkBlocks(text) {
  if (!text) return [];
  const blocks = [];
  let match;
  while ((match = MERFOLK_BLOCK_REGEX.exec(text)) !== null) {
    if (match[1] && match[1].trim()) {
      blocks.push(match[1].trim());
    }
  }
  return blocks;
}

export function hasMerfolkBlocks(text) {
  if (!text) return false;
  return MERFOLK_BLOCK_REGEX.test(text);
}
