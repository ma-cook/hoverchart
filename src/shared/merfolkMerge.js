/**
 * merfolkMerge.js — pure, browser-agnostic merfolk markdown merge utilities.
 *
 * Extracted from src/services/githubRepoService.js so the backend scanner can
 * apply diff-only rescan merges in Node without pulling in any DOM/browser
 * dependencies. Contains no imports — safe to bundle from either side.
 */

/**
 * Extract node IDs from a merfolk markdown string.
 * Matches node declarations like  ID{Component: ...}, ID[Function: ...], etc.
 * @param {string} markdown - Merfolk markdown (may include code fences)
 * @returns {Set<string>} - Set of node ID strings
 */
export const extractMerfolkNodeIds = (markdown) => {
  const nodeIds = new Set();
  const content = markdown.match(/```merfolk\n([\s\S]*?)```/)?.[1] || markdown;
  // Match lines starting with a word-char identifier followed by a bracket type
  const nodePattern = /^(\w+)(?:\{|\[\[|\[|\(\(|<)/gm;
  let match;
  while ((match = nodePattern.exec(content))) {
    nodeIds.add(match[1]);
  }
  return nodeIds;
};

/**
 * Filter new merfolk content so that only truly new node declarations are kept.
 * All connection/arrow lines and comments are always kept.
 * @param {string} newContent - Raw merfolk content (without fences)
 * @param {Set<string>} existingIds - Node IDs already present in the diagram
 * @returns {string} - Filtered merfolk content
 */
export const filterNewMerfolkNodes = (newContent, existingIds) => {
  const lines = newContent.split('\n');
  const kept = [];
  const nodePattern = /^(\w+)(?:\{|\[\[|\[|\(\(|<)/;
  // Track IDs seen within the new content itself — in case
  // generateMerfolkMarkdown produced multiple nodes with the same
  // sanitized ID across the changed files.
  const localIds = new Set();
  for (const line of lines) {
    const m = line.match(nodePattern);
    if (m) {
      const id = m[1];
      if (existingIds.has(id) || localIds.has(id)) {
        continue;
      }
      localIds.add(id);
    }
    kept.push(line);
  }
  return kept.join('\n');
};

/**
 * Strip duplicate node declarations from raw merfolk content (no fences).
 * Keeps the first occurrence of each node ID; later declarations are dropped.
 * Connection lines, comments, and blank lines pass through unchanged.
 */
export const deduplicateMerfolkNodes = (content) => {
  const lines = content.split('\n');
  const kept = [];
  const seenIds = new Set();
  const nodePattern = /^(\w+)(?:\{|\[\[|\[|\(\(|<)/;
  for (const line of lines) {
    const m = line.match(nodePattern);
    if (m) {
      if (seenIds.has(m[1])) {
        continue;
      }
      seenIds.add(m[1]);
    }
    kept.push(line);
  }
  return kept.join('\n');
};

/**
 * Merge newly generated merfolk entries into an existing merfolk markdown.
 * Duplicate node declarations (by ID) are stripped; new connections are appended.
 * @param {string} existingMarkdown - The full existing merfolk markdown (with fences)
 * @param {string} newMarkdown - The newly generated merfolk markdown (with fences)
 * @returns {string} - Merged merfolk markdown (single code block)
 */
export const mergeMerfolkMarkdown = (existingMarkdown, newMarkdown) => {
  const extractContent = (md) =>
    md.match(/```merfolk\n([\s\S]*?)```/)?.[1]?.trimEnd() || md.trimEnd();

  const existingContent = extractContent(existingMarkdown);
  const newRawContent = extractContent(newMarkdown);

  // Deduplicate existing content first (may have accumulated duplicates
  // from previous rescans before the merge fix).
  const cleanExisting = deduplicateMerfolkNodes(existingContent);

  const existingIds = extractMerfolkNodeIds(existingMarkdown);
  const filteredNew = filterNewMerfolkNodes(newRawContent, existingIds);

  // Only append if there is actual new content after filtering
  const trimmed = filteredNew.replace(/^[\s%]*$/gm, '').trim();
  if (!trimmed) {
    return `\`\`\`merfolk\n${cleanExisting}\n\`\`\`\n`;
  }

  return `\`\`\`merfolk\n${cleanExisting}\n\n%% === Rescan Additions ===\n${filteredNew}\n\`\`\`\n`;
};