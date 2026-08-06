import { getContentStore, ContentCategory, waitForContentStoreHydration } from './contentStore';
import { fetchFileContent } from '../githubRepoService';
import { getBase64Store, waitForBase64StoreHydration } from './base64Store';
import { extractKeywords } from './chunkIndex';
import useObjectsStore from '../../stores/objectsStore';
import useCodeStore from '../../stores/codeStore';
import { getNodeInfo, getDependencies, findPath, searchNodes, getCommunityInfo, getCommunityNodes, searchCommunities, getLspDefinition, getLspReferences, getLspTypeInfo, getLspCallGraph, getLspOverview } from './graphQuery';
import { computeSubAgentTools } from './toolProvider';
import { SKILL_MANAGEMENT_TOOL_DEFS } from './skillManager';

const TOOL_TIMEOUT_MS = 20_000;
const DEFAULT_READ_LINES = 8000;
const MAX_READ_LINES = 10000;
const MAX_HITS_PER_FILE = 5;

const normalizePath = (p) => (p || '').replace(/^\.\//, '').replace(/\\/g, '/');

/**
 * Build the full-text search corpus (filePath → text) for search_code/grep.
 * Prefers the worker-backed content store (the source of truth). If it holds
 * no "repo:" entries — e.g. right after a reload before the worker finishes,
 * or when the cached repo context was saved without contents (the old
 * "407 files, 0 contents" bug) — it falls back to the in-memory
 * repoFileContents map so searches don't silently report "no matches" for
 * symbols that actually exist.
 */
function buildRepoCorpus(store, codeStoreState) {
  const corpus = new Map();
  let repoEntries = 0;
  for (const [id, entry] of store.entries) {
    if (id.startsWith('repo:')) {
      const text = entry.chunks.map(c => c.text).join('');
      if (text) corpus.set(id.slice(5), text);
      repoEntries++;
    }
  }
  if (repoEntries === 0) {
    const contents = codeStoreState?.repoFileContents;
    if (contents) {
      if (!_seededRepoCorpus && Object.keys(contents).length > 0) {
        _seededRepoCorpus = true;
        seedRepoCorpusFromFileContents(contents);
      }
      for (const [filePath, content] of Object.entries(contents)) {
        if (content) corpus.set(filePath, content);
      }
    }
    if (corpus.size > 0) {
      console.warn(`[search] Content store empty — fell back to in-memory repoFileContents (${corpus.size} files)`);
    }
  }
  return corpus;
}

let _seededRepoCorpus = false;
const HYDRATION_WAIT_MS = 8000;

/**
 * Last-resort direct seeding of the content store from the in-memory
 * repoFileContents map, used when the worker-backed population is slow or
 * failed. Fires async so search itself isn't blocked; re-checks that the
 * worker hasn't already populated the store before upserting.
 */
async function seedRepoCorpusFromFileContents(contents) {
  try {
    const store = getContentStore();
    await Promise.race([
      waitForContentStoreHydration(),
      new Promise((r) => setTimeout(r, HYDRATION_WAIT_MS)),
    ]);
    const hasRepoEntries = Array.from(store.entries.keys()).some(id => id.startsWith('repo:'));
    if (hasRepoEntries) return;
    for (const [filePath, content] of Object.entries(contents)) {
      if (!content) continue;
      store.upsert(`repo:${filePath}`, ContentCategory.REPO_FILE, content, {
        sourcePath: filePath,
        tags: ['repo', 'code'],
      });
    }
    console.log(`[search] Seeded content store with ${Object.keys(contents).length} repo files`);
  } catch (err) {
    console.warn('[search] Direct corpus seeding failed:', err.message);
  }
}

const appliedEdits = new Map();

async function persistFileContent(storeId, filePath, content) {
    const store = getContentStore();
    const base64Store = getBase64Store();

    const existing = store.entries.get(storeId);
    if (existing) {
      for (const chunk of existing.chunks) {
        for (const kw of chunk.keywords) {
          const set = store.invertedIndex.get(kw);
          if (set) {
            set.delete(chunk.id);
            if (set.size === 0) store.invertedIndex.delete(kw);
          }
        }
      }
      store.totalChunks -= existing.chunks.length;
    }

    await new Promise(r => setTimeout(r, 0));

    const cfg = { chunkSize: 3000, overlap: 300, delimiter: '\n\n' };
    const chunks = [];
    let start = 0;
    let chunkIndex = 0;
    while (start < content.length) {
      let end = Math.min(start + cfg.chunkSize, content.length);
      if (end < content.length) {
        const lastDelimiter = content.lastIndexOf(cfg.delimiter, end);
        if (lastDelimiter > start + cfg.chunkSize * 0.5) {
          end = lastDelimiter;
        }
      }
      const slice = content.slice(start, end);
      chunks.push({
        // Unique per entry (storeId) so Base64Store's flat chunk map can't
        // confuse this file's chunk-N with another file's chunk-N.
        id: `${storeId}:chunk-${chunkIndex}`,
        text: slice,
        startIndex: start,
        endIndex: end,
        keywords: extractKeywords(slice),
        charCount: slice.length,
      });
      start = end - cfg.overlap;
      if (start >= content.length) break;
      chunkIndex++;
      if (chunkIndex % 10 === 0) await new Promise(r => setTimeout(r, 0));
    }

    const entry = {
      id: storeId,
      category: ContentCategory.REPO_FILE,
      chunks,
      sourcePath: filePath,
      tags: [],
      lastUpdated: Date.now(),
      totalChars: content.length,
    };

    for (const chunk of chunks) {
      for (const kw of chunk.keywords) {
        if (!store.invertedIndex.has(kw)) store.invertedIndex.set(kw, new Set());
        store.invertedIndex.get(kw).add(chunk.id);
      }
    }

    store.entries.set(storeId, entry);
    store.totalChunks += chunks.length;
    store._persist();

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      base64Store.encodedChunks.set(chunk.id, {
        text: chunk.text,
        meta: {
          entryId: storeId,
          sourcePath: filePath,
          category: ContentCategory.REPO_FILE,
          keywords: chunk.keywords,
          charCount: chunk.charCount,
          byteSize: chunk.text.length,
          startIndex: chunk.startIndex,
          endIndex: chunk.endIndex,
        },
      });
      if (i % 25 === 0) await new Promise(r => setTimeout(r, 0));
    }
}

function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      matrix[i][j] = a[i - 1] === b[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + 1);
  return matrix[a.length][b.length];
}

function lineTrimmedMatch(content, oldString) {
  const contentLines = content.split('\n');
  const searchLines = oldString.split('\n').filter(l => l !== '');
  if (searchLines.length === 0) return null;
  for (let i = 0; i <= contentLines.length - searchLines.length; i++) {
    let matches = true;
    for (let j = 0; j < searchLines.length; j++) {
      if (contentLines[i + j].trim() !== searchLines[j].trim()) { matches = false; break; }
    }
    if (matches) {
      const start = contentLines.slice(0, i).join('\n').length + (i > 0 ? 1 : 0);
      const end = contentLines.slice(0, i + searchLines.length).join('\n').length;
      return { index: start, length: end - start };
    }
  }
  return null;
}

function blockAnchorMatch(content, oldString) {
  const searchLines = oldString.split('\n').filter(l => l !== '');
  if (searchLines.length < 3) return null;
  const firstLine = searchLines[0].trim();
  const lastLine = searchLines[searchLines.length - 1].trim();
  const contentLines = content.split('\n');
  const candidates = [];
  for (let i = 0; i < contentLines.length; i++) {
    if (contentLines[i].trim() !== firstLine) continue;
    for (let j = i + 2; j < contentLines.length; j++) {
      if (contentLines[j].trim() === lastLine &&
          Math.abs((j - i + 1) - searchLines.length) <= Math.max(1, Math.floor(searchLines.length * 0.25))) {
        candidates.push({ startLine: i, endLine: j });
        break;
      }
    }
  }
  let best = null, bestScore = 0;
  for (const c of candidates) {
    let score = 0, count = 0;
    for (let k = 1; k < searchLines.length - 1 && k < (c.endLine - c.startLine); k++) {
      const a = contentLines[c.startLine + k].trim();
      const b = searchLines[k].trim();
      const maxLen = Math.max(a.length, b.length);
      if (maxLen > 0) { score += 1 - levenshteinDistance(a, b) / maxLen; count++; }
    }
    score = count > 0 ? score / count : 1;
    if (score > bestScore) { bestScore = score; best = c; }
  }
  if (!best || bestScore < 0.65) return null;
  const start = contentLines.slice(0, best.startLine).join('\n').length + (best.startLine > 0 ? 1 : 0);
  const end = contentLines.slice(0, best.endLine + 1).join('\n').length;
  return { index: start, length: end - start };
}

function whitespaceNormalizedMatch(content, oldString) {
  const normalize = (s) => s.replace(/\s+/g, ' ').trim();
  const normOld = normalize(oldString);
  const contentLines = content.split('\n');
  const oldLines = oldString.split('\n');
  for (let i = 0; i <= contentLines.length - oldLines.length; i++) {
    const block = contentLines.slice(i, i + oldLines.length).join('\n');
    if (normalize(block) === normOld) {
      const start = contentLines.slice(0, i).join('\n').length + (i > 0 ? 1 : 0);
      const end = contentLines.slice(0, i + oldLines.length).join('\n').length;
      return { index: start, length: end - start };
    }
  }
  return null;
}

function indentationFlexibleMatch(content, oldString) {
  const stripIndent = (s) => {
    const lines = s.split('\n');
    const nonEmpty = lines.filter(l => l.trim().length > 0);
    if (nonEmpty.length === 0) return s;
    const minIndent = Math.min(...nonEmpty.map(l => { const m = l.match(/^(\s*)/); return m ? m[1].length : 0; }));
    return lines.map(l => l.trim().length === 0 ? l : l.slice(minIndent)).join('\n');
  };
  const normOld = stripIndent(oldString);
  const contentLines = content.split('\n');
  const oldLines = oldString.split('\n');
  for (let i = 0; i <= contentLines.length - oldLines.length; i++) {
    const block = contentLines.slice(i, i + oldLines.length).join('\n');
    if (stripIndent(block) === normOld) {
      const start = contentLines.slice(0, i).join('\n').length + (i > 0 ? 1 : 0);
      const end = contentLines.slice(0, i + oldLines.length).join('\n').length;
      return { index: start, length: end - start };
    }
  }
  return null;
}

function findMatch(content, oldString) {
  const strategies = [
    { name: 'exact', fn: (c, o) => { const i = c.indexOf(o); return i >= 0 ? { index: i, length: o.length } : null; } },
    { name: 'lineTrimmed', fn: lineTrimmedMatch },
    { name: 'blockAnchor', fn: blockAnchorMatch },
    { name: 'whitespaceNormalized', fn: whitespaceNormalizedMatch },
    { name: 'indentationFlexible', fn: indentationFlexibleMatch },
  ];
  for (const strategy of strategies) {
    const result = strategy.fn(content, oldString);
    if (result) {
      if (strategy.name !== 'exact') {
        console.log(`[Edit] Matched via ${strategy.name} strategy (index ${result.index}, length ${result.length})`);
      }
      return result;
    }
  }
  return null;
}

function withTimeout(promise, ms, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

async function generateFileOutline(content, filePath) {
  const lines = content.split('\n');
  const totalLines = lines.length;
  const totalChars = content.length;
  const isJSX = /\.(jsx|tsx)$/.test(filePath);
  const isJS = /\.(js|jsx|ts|tsx|mjs)$/.test(filePath);

  const imports = [];
  const exports = [];
  const components = [];
  const functions = [];
  const hooks = [];
  const stateVars = [];
  const classes = [];
  const types = [];

  for (let i = 0; i < totalLines; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const lineNum = i + 1;

    if (trimmed.startsWith('import ') || trimmed.startsWith('import{')) {
      imports.push(lineNum);
      continue;
    }
    if (trimmed.startsWith('export default ') || trimmed.startsWith('export const ') || trimmed.startsWith('export function ') || trimmed.startsWith('export class ') || trimmed.startsWith('export type ') || trimmed.startsWith('export interface ')) {
      exports.push({ line: lineNum, text: trimmed.slice(0, 80) });
    }

    if (isJS) {
      const compMatch = trimmed.match(/^(?:export\s+)?(?:default\s+)?(?:function|const|var)\s+([A-Z]\w+)/);
      if (compMatch) {
        const name = compMatch[1];
        const tag = trimmed.includes('export') ? ' [exported]' : '';
        const isDefault = trimmed.includes('export default') ? ' [default export]' : '';
        components.push({ line: lineNum, name: name + tag + isDefault, text: trimmed.slice(0, 80) });
      }

      const funcMatch = trimmed.match(/^(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+(\w+)/);
      if (funcMatch && !compMatch) {
        functions.push({ line: lineNum, name: funcMatch[1], text: trimmed.slice(0, 80) });
      }

      if (isJSX) {
        const hookMatch = trimmed.match(/(?:const|let|var)\s+\[?\w+\]?\s*=\s*(use\w+)\(/);
        if (hookMatch) {
          hooks.push({ line: lineNum, hook: hookMatch[1], text: trimmed.slice(0, 80) });
        }
        const useStateMatch = trimmed.match(/(?:const|let|var)\s+(\w+)\s*,\s*\w+\]\s*=\s*useState/);
        if (useStateMatch) {
          stateVars.push({ line: lineNum, name: useStateMatch[1], text: trimmed.slice(0, 80) });
        }
      }

      const classMatch = trimmed.match(/^(?:export\s+)?(?:default\s+)?class\s+(\w+)/);
      if (classMatch) {
        classes.push({ line: lineNum, name: classMatch[1], text: trimmed.slice(0, 80) });
      }

      const typeMatch = trimmed.match(/^(?:export\s+)?(?:type|interface)\s+(\w+)/);
      if (typeMatch) {
        types.push({ line: lineNum, name: typeMatch[1], text: trimmed.slice(0, 80) });
      }
    }
    if (i % 200 === 199) await new Promise(r => setTimeout(r, 0));
  }

  const parts = [];
  parts.push(`FILE: ${filePath} (${totalLines} lines, ${totalChars} chars)\n`);

  if (imports.length > 0) {
    parts.push(`Lines 1-${Math.max(...imports)}: imports`);
  }

  if (components.length > 0) {
    parts.push('');
    for (const c of components) {
      parts.push(`  ${c.line}: ${c.name} — ${c.text}`);
    }
  }

  if (functions.length > 0) {
    if (components.length > 0) parts.push('');
    parts.push('Functions:');
    for (const f of functions) {
      parts.push(`  ${f.line}: ${f.name}() — ${f.text}`);
    }
  }

  if (classes.length > 0) {
    parts.push('');
    parts.push('Classes:');
    for (const c of classes) {
      parts.push(`  ${c.line}: class ${c.name} — ${c.text}`);
    }
  }

  if (types.length > 0) {
    parts.push('');
    parts.push('Types:');
    for (const t of types) {
      parts.push(`  ${t.line}: ${t.name} — ${t.text}`);
    }
  }

  if (hooks.length > 0) {
    parts.push('');
    parts.push('Hooks:');
    for (const h of hooks) {
      parts.push(`  ${h.line}: ${h.hook}() — ${h.text}`);
    }
  }

  if (stateVars.length > 0) {
    parts.push('');
    parts.push('State:');
    for (const s of stateVars) {
      parts.push(`  ${s.line}: ${s.name} — ${s.text}`);
    }
  }

  if (exports.length > 0) {
    parts.push('');
    parts.push('Exports:');
    for (const e of exports) {
      parts.push(`  ${e.line}: ${e.text}`);
    }
  }

  return parts.join('\n');
}

export const CODE_GEN_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'quick_look',
      description: 'Quick preview of a file — shows the first N lines (and optionally last N lines). Faster than read_file for checking imports, exports, or overall structure without loading the entire file.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path relative to repo root' },
          head: { type: 'number', description: 'Number of lines from the top (default 40)' },
          tail: { type: 'number', description: 'Number of lines from the bottom (default 20, 0 to disable)' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'file_outline',
      description: 'Get a structural outline of a file: function names, component names, exports, hooks, state variables, and their line numbers. Uses ~500 chars vs 32K for read_file. Use this FIRST to understand file structure before reading full content.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path relative to repo root' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read the contents of a file from the repository. Returns up to 8000 lines by default — prefer reading large sections in one call rather than many tiny slices. Each line is prefixed with its line number (e.g. "42:  code here"). Use offset to read later sections of large files.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path relative to repo root, e.g. "src/components/Button.tsx"' },
          offset: { type: 'number', description: 'Line number to start reading from (default 1, 1-indexed)' },
          limit: { type: 'number', description: 'Max lines to return (default 8000). Use a large value to read the full file in one call.' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_files',
      description: 'List files in a directory. Returns file names and subdirectories.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory path relative to repo root. Use "" or "/" for root.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_code',
      description: 'Search for files matching a pattern or containing specific text. Returns matching file paths and graph context.',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Search term or glob pattern, e.g. "Button" or "*.tsx"' },
        },
        required: ['pattern'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_node_info',
      description: 'Get full details about a component/function/store in the diagram: its type, file path, all connections (with labels and types), parent, and children. Use this to understand a component\'s relationships before modifying it.',
      parameters: {
        type: 'object',
        properties: {
          nodeId: { type: 'string', description: 'The node ID from the diagram, e.g. "Button", "AuthStore", "useAuth"' },
        },
        required: ['nodeId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_dependencies',
      description: 'Find what depends on a node (upstream) or what the node depends on (downstream). Use this to understand the blast radius of changes.',
      parameters: {
        type: 'object',
        properties: {
          nodeId: { type: 'string', description: 'The node ID to check dependencies for' },
          direction: { type: 'string', description: '"upstream" (who depends on me), "downstream" (what I depend on), or "both" (default)' },
        },
        required: ['nodeId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'find_path',
      description: 'Find the shortest data-flow path between two components in the diagram. Use this to understand how data flows between parts of the system.',
      parameters: {
        type: 'object',
        properties: {
          source: { type: 'string', description: 'Starting node ID' },
          target: { type: 'string', description: 'Ending node ID' },
        },
        required: ['source', 'target'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_nodes',
      description: 'Search for components, functions, stores, or hooks by name or type in the diagram. Returns matching nodes with their file paths.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search term — matches against node names, types, and IDs' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_community_info',
      description: 'Get architectural overview of a community: its summary, node count, key components, internal and external connections. Use this to understand what a subsystem does before diving into specific nodes.',
      parameters: {
        type: 'object',
        properties: {
          communityId: { type: 'number', description: 'The community ID (number, e.g. 0, 1, 2...). Use search_communities to find IDs.' },
        },
        required: ['communityId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_community_nodes',
      description: 'List all nodes in a community with their types and file paths. Use this to see every component/function/hook in a subsystem.',
      parameters: {
        type: 'object',
        properties: {
          communityId: {
            type: 'number',
            description: 'The ID of the community to list nodes for',
          },
        },
        required: ['communityId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_communities',
      description: 'Search communities by keyword (name, node types, file paths). Returns matching communities with summaries. Use this to find which subsystem handles a feature.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search term (e.g. "auth", "database", "dashboard")' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_lsp_definition',
      description: 'Resolve where an import resolves to across the codebase using LSP type information. Shows the actual target file, line, and symbol. More accurate than the import graph for barrel re-exports.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Import name (e.g. "useAuth"), file name (e.g. "Button"), or symbol name' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_lsp_references',
      description: 'Find all files that reference a given symbol using LSP. Shows which consumers import or use a specific export.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Symbol name (e.g. "fetchUser"), file name, or export name' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_lsp_type_info',
      description: 'Get type signatures and documentation for a symbol from LSP. Shows parameter types, return types, and JSDoc/TSDoc.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Symbol name (e.g. "Props", "useAuth", "fetchUser")' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_lsp_call_graph',
      description: 'Show the call graph for a function — who calls it, and what it calls. Useful for understanding the impact of changing a function.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Function name (e.g. "handleSubmit") or file name' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_lsp_overview',
      description: 'Get a summary of available LSP metadata: how many definitions, references, type entries, and call graph entries are available.',
      parameters: { type: 'object' },
    },
  },
  {
    type: 'function',
    function: {
      name: 'task',
      description: 'Spawn a sub-agent to research a question about the codebase. The sub-agent can read files, search code, and query the graph — but cannot modify anything. Use this for complex exploration that would take many tool calls, to keep the main conversation clean.',
      parameters: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Clear, specific research question or task for the sub-agent. E.g. "Find all components that use the useAuth hook and list their file paths" or "Read TopBar.jsx and summarize its props, state, and child components"' },
        },
        required: ['prompt'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'edit',
      description: 'Make a targeted edit to a file by replacing a string match. Line number prefixes (e.g. "10: code") from read_file output are automatically stripped before matching. The match is flexible — it handles whitespace differences, indentation changes, and uses fuzzy matching for larger blocks (first/last line anchors with similarity scoring). You MUST call read_file first before editing.',
      parameters: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'File path relative to repo root' },
          oldString: { type: 'string', description: 'The text to find and replace. Should match reasonably closely — exact match is preferred but whitespace/indentation differences are tolerated.' },
          newString: { type: 'string', description: 'The replacement string' },
        },
        required: ['filePath', 'oldString', 'newString'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write',
      description: 'Create a new file or completely overwrite an existing file. Use for NEW files only. For modifying existing files, use the edit tool — it handles whitespace differences, line number prefixes from read_file output, and fuzzy matching so you never need to rewrite the whole file.',
      parameters: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'File path relative to repo root' },
          content: { type: 'string', description: 'The complete file content' },
        },
        required: ['filePath', 'content'],
      },
    },
  },
];

const SUB_AGENT_TOOLS = [
  { type: 'function', function: { name: 'read_file', description: 'Read file contents.', parameters: { type: 'object', properties: { path: { type: 'string' }, offset: { type: 'number' }, limit: { type: 'number' } }, required: ['path'] } } },
  { type: 'function', function: { name: 'file_outline', description: 'Get structural outline of a file.', parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } } },
  { type: 'function', function: { name: 'list_files', description: 'List files in a directory.', parameters: { type: 'object', properties: { path: { type: 'string' } } } } },
  { type: 'function', function: { name: 'search_code', description: 'Search for files matching a pattern.', parameters: { type: 'object', properties: { pattern: { type: 'string' } }, required: ['pattern'] } } },
  { type: 'function', function: { name: 'get_node_info', description: 'Get details about a component.', parameters: { type: 'object', properties: { nodeId: { type: 'string' } }, required: ['nodeId'] } } },
  { type: 'function', function: { name: 'get_dependencies', description: 'Find dependencies.', parameters: { type: 'object', properties: { nodeId: { type: 'string' }, direction: { type: 'string' } }, required: ['nodeId'] } } },
  { type: 'function', function: { name: 'search_nodes', description: 'Search diagram nodes.', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } } },
  { type: 'function', function: { name: 'get_lsp_definition', description: 'Resolve where an import goes via LSP.', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } } },
  { type: 'function', function: { name: 'get_lsp_references', description: 'Find all references to a symbol via LSP.', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } } },
  { type: 'function', function: { name: 'get_lsp_type_info', description: 'Get type signature for a symbol via LSP.', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } } },
];

const SUB_AGENT_SYSTEM_PROMPT = `You are a research sub-agent. Your job is to answer a specific question about a codebase by reading files and searching code.

TOOLS: You can read files, list directories, search code, and query the component graph. You CANNOT modify any files.

INSTRUCTIONS:
1. Use the tools to gather the information requested in the prompt
2. Read files fully (8000+ chars) — do not read tiny slices
3. Each file should be read ONCE
4. After each round of tool use, include a text summary of what you found so far
5. When you have enough information, write a clear, structured summary as your final response

OUTPUT FORMAT:
- Start with a direct answer to the prompt
- Include file paths and line numbers for key findings
- Include relevant code snippets (keep them short)
- Do NOT generate code or suggest changes — only report what exists
- ALWAYS include text in your response, even if you are also using tools`;

export function resetEditTracker() {
  appliedEdits.clear();
}

export async function executeTool(name, args, githubContext, fileTree = [], { runSubAgent, depth = 0 } = {}) {
  await Promise.race([
    Promise.all([waitForContentStoreHydration(), waitForBase64StoreHydration()]),
    new Promise(r => setTimeout(r, 5000)),
  ]);
  await new Promise(r => setTimeout(r, 0));
  const store = getContentStore();
  const base64Store = getBase64Store();

  // Wait for IndexedDB hydration before tools read the store — otherwise
  // search_code/grep/read_file can see an empty corpus right after a reload
  // and report "no matches" for symbols that actually exist. Bounded like the
  // first race: a stuck hydration promise must never leave a tool hanging
  // (which the orchestrator's hard timeout would otherwise abort as a
  // "timed out" failure).
  try {
    await Promise.race([
      Promise.all([waitForContentStoreHydration(), waitForBase64StoreHydration()]),
      new Promise(r => setTimeout(r, 5000)),
    ]);
  } catch { /* hydration failure is non-fatal */ }

  switch (name) {
    case 'quick_look': {
      const path = normalizePath(args.path);
      const headLines = Math.min(parseInt(args.head, 10) || 40, 100);
      const tailArg = args.tail;
      const tailLines = tailArg != null ? Math.min(parseInt(tailArg, 10), 50) : 20;
      const storeId = `repo:${path}`;
      const altId = `github:${path}`;

      let content = null;
      const entry = store.getEntry(storeId) || store.getEntry(altId);
      if (entry) {
        const chunks = base64Store.getChunks(entry.chunks.map(c => c.id));
        if (chunks.length > 0) {
          await new Promise(r => setTimeout(r, 0));
          content = chunks.map(c => c.text).join('');
        }
      }

      if (!content && githubContext) {
        try {
          content = await withTimeout(
            fetchFileContent(githubContext.owner, githubContext.repo, path, githubContext.token),
            TOOL_TIMEOUT_MS,
            `quick_look(${path})`,
          );
        } catch (err) {
          return { success: false, content: `Error reading ${path}: ${err.message}` };
        }
      }

      if (!content) return { success: false, content: `File not found: ${path}` };

      await new Promise(r => setTimeout(r, 0));
      const lines = content.split('\n');
      const totalLines = lines.length;
      const head = lines.slice(0, headLines).map((l, i) => `${i + 1}: ${l}`).join('\n');
      if (totalLines <= headLines + tailLines || tailLines === 0) {
        return { success: true, content: head };
      }
      const tail = lines.slice(-tailLines).map((l, i) => `${totalLines - tailLines + i + 1}: ${l}`).join('\n');
      return { success: true, content: `${head}\n\n... (${totalLines - headLines - tailLines} lines omitted) ...\n\n${tail}` };
    }

    case 'file_outline': {
      const path = normalizePath(args.path);
      const storeId = `repo:${path}`;
      const altId = `github:${path}`;
      let fullContent = null;
      const entry = store.getEntry(storeId) || store.getEntry(altId);
      if (entry) {
        const chunks = base64Store.getChunks(entry.chunks.map(c => c.id));
        if (chunks.length > 0) {
          await new Promise(r => setTimeout(r, 0));
          fullContent = chunks.map(c => c.text).join('');
        }
      }
      if (!fullContent && githubContext) {
        try {
          fullContent = await withTimeout(
            fetchFileContent(githubContext.owner, githubContext.repo, path, githubContext.token),
            TOOL_TIMEOUT_MS,
            `file_outline(${path})`,
          );
        } catch (err) {
          return { success: false, content: `Error reading ${path}: ${err.message}` };
        }
      }
      if (!fullContent) return { success: false, content: `File not found: ${path}` };
      await new Promise(r => setTimeout(r, 0));
      const outline = await generateFileOutline(fullContent, path);
      return { success: true, content: outline };
    }

    case 'read_file': {
      const path = normalizePath(args.path);
      const startLine = Math.max(1, parseInt(args.offset, 10) || 1);
      let requestedLines = parseInt(args.limit, 10) || DEFAULT_READ_LINES;
      if (requestedLines > 0 && requestedLines < 200) {
        requestedLines = Math.min(200, DEFAULT_READ_LINES);
      }
      const lineLimit = Math.min(requestedLines, MAX_READ_LINES);
      const effectiveLimit = parseInt(args.limit, 10) || DEFAULT_READ_LINES;
      const storeId = `repo:${path}`;
      const altId = `github:${path}`;

      let fullContent = null;
      const entry = store.getEntry(storeId) || store.getEntry(altId);
      if (entry) {
        const chunks = base64Store.getChunks(entry.chunks.map(c => c.id));
        if (chunks.length > 0) {
          await new Promise(r => setTimeout(r, 0));
          fullContent = chunks.map(c => c.text).join('');
        }
      }

      if (!fullContent && githubContext) {
        try {
          fullContent = await withTimeout(
            fetchFileContent(githubContext.owner, githubContext.repo, path, githubContext.token),
            TOOL_TIMEOUT_MS,
            `read_file(${path})`,
          );
          if (fullContent) {
            persistFileContent(storeId, path, fullContent);
          }
        } catch (err) {
          return { success: false, content: `Error reading ${path}: ${err.message}` };
        }
      }

      if (!fullContent) {
        return { success: false, content: `File not found: ${path}` };
      }

      await new Promise(r => setTimeout(r, 0));
      const allLines = fullContent.split('\n');
      const totalLines = allLines.length;
      const endLine = Math.min(startLine + lineLimit - 1, totalLines);
      if (startLine > totalLines) {
        return { success: true, content: `[End of file: ${path} has ${totalLines} lines. Use offset=${totalLines} to read the last lines.]` };
      }
      const selectedLines = allLines.slice(startLine - 1, endLine);
      const numbered = selectedLines.map((line, i) => `${startLine + i}: ${line}`).join('\n');
      const sectionLabel = `[Read ${path}: lines ${startLine}-${endLine} of ${totalLines}]`;
      const suffix = endLine < totalLines
        ? `\n\n(Use offset=${endLine + 1} to continue reading.)`
        : '\n\n(End of file)';
      return { success: true, content: `${sectionLabel}\n${numbered}${suffix}`, _fullContent: fullContent };
    }

    case 'list_files': {
      const prefix = (args.path || '').replace(/^\//, '');
      const files = fileTree.filter(f => {
        if (prefix && !f.startsWith(prefix)) return false;
        return true;
      }).slice(0, 200);
      return { success: true, content: files.join('\n') || 'No files found' };
    }

    case 'search_code': {
      // Normalize BOTH the query and the searched text the same way (lowercase,
      // strip - _ .). The old code normalized the query but not the corpus, so
      // searches for snake_case / kebab-case identifiers or filenames with an
      // extension failed to match text that clearly contained them.
      const normalize = (s) => (s || '').toLowerCase().replace(/[-_.]/g, '');
      const rawPattern = (args.pattern || '');
      const pattern = normalize(rawPattern);
      if (!pattern) return { success: false, content: 'search_code requires a "pattern" parameter' };
      // Fall back to the pattern without a trailing extension ("SpaceChat.jsx"
      // → "spacechat") so content lines like `import SpaceChat ...` still hit.
      const basePattern = normalize(rawPattern.replace(/\.[a-z0-9]+$/, ''));
      const matchesPattern = (normLine) => normLine.includes(pattern) ||
        (basePattern.length >= 3 && normLine.includes(basePattern));
      const READ_FILE_HINT = '\n\n→ Use read_file("path", offset=LINE, limit=N) to jump to an exact line, or quick_look("path") for a preview.';
      const MAX_RESULTS = 20;

      const results = [];
      const codeStoreState = useCodeStore.getState();
      const fileSizeMap = new Map(codeStoreState.fileSizes || []);
      const sizeHint = (filePath) => {
        const sz = fileSizeMap.get(filePath);
        return sz ? ` (${sz} chars)` : '';
      };

      // 1. Scene objects — highest relevance (directly in diagram)
      const sceneObjects = useObjectsStore.getState().objects || [];
      for (const obj of sceneObjects) {
        const nodeId = obj.merfolkData?.nodeId || '';
        const name = (obj.headerText || '').toLowerCase();
        const filePath = obj.merfolkData?.codeFilePath || obj.metadata?.codeFilePath || '';
        if (!filePath) continue;
        if (normalize(nodeId).includes(pattern) || normalize(name).includes(pattern)) {
          const nodeType = obj.merfolkData?.nodeType || obj.type || 'unknown';
          results.push({ rank: 0, text: `[${nodeType}:${obj.headerText || nodeId}] → ${filePath}${sizeHint(filePath)}` });
        }
      }

      // 2. Content index — semantic matches (exports, functions, classes, CSS)
      const fileIndex = useCodeStore.getState().fileIndexByPath;
      if (fileIndex) {
        for (const [filePath, entry] of fileIndex) {
          if (results.length >= MAX_RESULTS) break;
          const searchable = [
            filePath,
            ...(entry.exports || []),
            ...(entry.functions || []),
            ...(entry.cssClasses || []),
            ...(entry.htmlElements || []),
          ].join(' ');
          if (normalize(searchable).includes(pattern)) {
            const parts = [];
            if (entry.exports?.size > 0) parts.push(`exports:${[...entry.exports].join(',')}`);
            if (entry.functions?.size > 0) parts.push(`fn:${[...entry.functions].join(',')}`);
            if (entry.cssClasses?.size > 0) parts.push(`css:${[...entry.cssClasses].join(',')}`);
            results.push({ rank: 1, text: `${filePath}${sizeHint(filePath)}: ${parts.join(' | ')}` });
          }
        }
      }

      // 3. File tree — filename matches
      const matchingFiles = fileTree.filter(f => normalize(f).includes(pattern)).slice(0, 10);
      for (const f of matchingFiles) {
        if (results.length >= MAX_RESULTS) break;
        results.push({ rank: 2, text: `${f}${sizeHint(f)}` });
      }

      // 4. Full-text search with line numbers, ranked by per-file hit count.
      //    The most-referenced files (definition + heaviest usage) surface
      //    first. Uses the content store, falling back to the in-memory
      //    repoFileContents map when the store corpus is empty.
      await new Promise(r => setTimeout(r, 0));
      const normLine = (line) => line.toLowerCase().replace(/[-_.]/g, '');
      const corpus = buildRepoCorpus(store, codeStoreState);
      const fileHitCounts = new Map();
      const fileHitSamples = new Map();
      let scanCount = 0;
      for (const [filePath, fullText] of corpus) {
        if (fullText == null || fullText.length === 0) continue;
        const lines = fullText.split('\n');
        let count = 0;
        const samples = [];
        for (let li = 0; li < lines.length && count < MAX_HITS_PER_FILE; li++) {
          if (matchesPattern(normLine(lines[li]))) {
            count++;
            if (samples.length < 3) {
              samples.push({ lineNum: li + 1, text: lines[li].trim().slice(0, 200) });
            }
          }
        }
        if (count > 0) {
          fileHitCounts.set(filePath, count);
          fileHitSamples.set(filePath, samples);
        }
        scanCount++;
        if (scanCount % 50 === 0) await new Promise(r => setTimeout(r, 0));
      }

      const topFiles = [...fileHitCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);
      for (const [filePath] of topFiles) {
        if (results.length >= MAX_RESULTS) break;
        for (const s of fileHitSamples.get(filePath)) {
          results.push({ rank: 3, text: `${filePath}${sizeHint(filePath)}:${s.lineNum}: ${s.text}` });
        }
      }

      if (results.length === 0) {
        const fuzzyMatches = fileTree
          .filter(f => normalize(f).includes(pattern.slice(0, 4)))
          .slice(0, 10);
        const hint = fuzzyMatches.length > 0
          ? `No exact matches for "${args.pattern}". Closest files: ${fuzzyMatches.join(', ')}`
          : `No matching files found. Try different search terms or use list_files("path") to browse directories.`;
        return { success: true, content: hint };
      }

      results.sort((a, b) => a.rank - b.rank);
      const output = results.slice(0, MAX_RESULTS).map(r => r.text).join('\n');
      return { success: true, content: output + READ_FILE_HINT };
    }

    case 'grep': {
      const patternSrc = args.pattern || '';
      if (!patternSrc) return { success: false, content: 'grep requires a "pattern" parameter' };
      let re;
      try {
        re = new RegExp(patternSrc, args.caseSensitive ? '' : 'i');
      } catch (e) {
        return { success: false, content: `Invalid regex pattern: ${e.message}` };
      }
      const prefix = normalizePath(args.path || '').replace(/\/+$/, '');
      const MAX_GREP_RESULTS = 25;
      const MAX_PER_FILE = 8;
      const results = [];
      const grepCodeStoreState = useCodeStore.getState();
      const fileSizeMap = new Map(grepCodeStoreState.fileSizes || []);
      const sizeHint = (filePath) => {
        const sz = fileSizeMap.get(filePath);
        return sz ? ` (${sz} chars)` : '';
      };
      const corpus = buildRepoCorpus(store, grepCodeStoreState);
      for (const [filePath, fullText] of corpus) {
        if (prefix && !filePath.startsWith(prefix)) continue;
        const lines = fullText.split('\n');
        let fileHits = 0;
        for (let li = 0; li < lines.length && fileHits < MAX_PER_FILE; li++) {
          if (re.test(lines[li])) {
            results.push(`${filePath}${sizeHint(filePath)}:${li + 1}: ${lines[li].trim().slice(0, 200)}`);
            fileHits++;
          }
        }
        if (results.length >= MAX_GREP_RESULTS) break;
      }
      if (results.length === 0) {
        const scope = prefix ? ` under "${prefix}"` : '';
        return {
          success: true,
          content: `No matches for /${patternSrc}/${scope}. The content index may be empty for this repo — try search_code for filename/symbol matches, or quick_look/read_file on candidate files.`,
        };
      }
      return { success: true, content: results.join('\n') };
    }

    case 'get_node_info': {
      const nodeId = args.nodeId;
      if (!nodeId) return { success: false, content: 'get_node_info requires a "nodeId" parameter' };
      const result = getNodeInfo(nodeId);
      return { success: true, content: result };
    }

    case 'get_dependencies': {
      const nodeId = args.nodeId;
      if (!nodeId) return { success: false, content: 'get_dependencies requires a "nodeId" parameter' };
      const direction = args.direction || 'both';
      const result = getDependencies(nodeId, direction);
      return { success: true, content: result };
    }

    case 'find_path': {
      const source = args.source;
      const target = args.target;
      if (!source || !target) return { success: false, content: 'find_path requires "source" and "target" parameters' };
      const result = findPath(source, target);
      return { success: true, content: result };
    }

    case 'search_nodes': {
      const query = args.query;
      if (!query) return { success: false, content: 'search_nodes requires a "query" parameter' };
      const result = searchNodes(query);
      return { success: true, content: result };
    }

    case 'get_community_info': {
      const communityId = parseInt(args.communityId, 10);
      if (isNaN(communityId)) return { success: false, content: 'get_community_info requires a numeric "communityId" parameter' };
      const result = getCommunityInfo(communityId);
      return { success: true, content: result };
    }

    case 'get_community_nodes': {
      const communityId = parseInt(args.communityId, 10);
      if (isNaN(communityId)) return { success: false, content: 'get_community_nodes requires a numeric "communityId" parameter' };
      const result = getCommunityNodes(communityId);
      return { success: true, content: result };
    }

    case 'search_communities': {
      const query = args.query;
      if (!query) return { success: false, content: 'search_communities requires a "query" parameter' };
      const result = searchCommunities(query);
      return { success: true, content: result };
    }

    case 'get_lsp_definition': {
      const query = args.query;
      if (!query) return { success: false, content: 'get_lsp_definition requires a "query" parameter' };
      const result = getLspDefinition(query);
      return { success: true, content: result };
    }

    case 'get_lsp_references': {
      const query = args.query;
      if (!query) return { success: false, content: 'get_lsp_references requires a "query" parameter' };
      const result = getLspReferences(query);
      return { success: true, content: result };
    }

    case 'get_lsp_type_info': {
      const query = args.query;
      if (!query) return { success: false, content: 'get_lsp_type_info requires a "query" parameter' };
      const result = getLspTypeInfo(query);
      return { success: true, content: result };
    }

    case 'get_lsp_call_graph': {
      const query = args.query;
      if (!query) return { success: false, content: 'get_lsp_call_graph requires a "query" parameter' };
      const result = getLspCallGraph(query);
      return { success: true, content: result };
    }

    case 'get_lsp_overview': {
      const result = getLspOverview();
      return { success: true, content: result };
    }

    case 'edit': {
      const filePath = normalizePath(args.filePath);
      const oldString = args.oldString;
      const newString = args.newString;
      if (!filePath || oldString == null || newString == null) {
        return { success: false, content: 'edit requires "filePath", "oldString", and "newString" parameters' };
      }
      const storeId = `repo:${filePath}`;
      const altId = `github:${filePath}`;

      let entry = store.getEntry(storeId) || store.getEntry(altId);
      if (!entry && githubContext) {
        try {
          const fresh = await withTimeout(
            fetchFileContent(githubContext.owner, githubContext.repo, filePath, githubContext.token),
            TOOL_TIMEOUT_MS,
            `edit-load(${filePath})`,
          );
          if (fresh) {
            await persistFileContent(storeId, filePath, fresh);
            entry = store.getEntry(storeId);
          }
        } catch (err) {
          return { success: false, content: `edit failed: could not load ${filePath}: ${err.message}` };
        }
      }
      if (!entry) {
        return { success: false, content: `File not loaded: ${filePath}. Use read_file("${filePath}") first to load it into memory.` };
      }

      const stripLineNumbers = (s) => s.split('\n').map(l => l.replace(/^\d+:\s*/, '')).join('\n');
      const cleanedOldString = stripLineNumbers(oldString);
      const hadLineNumbers = cleanedOldString !== oldString;
      const editKey = `${filePath}\0${cleanedOldString}`;
      const prevCount = appliedEdits.get(editKey) || 0;
      if (prevCount >= 2) {
        return { success: false, content: `This edit was already applied ${prevCount} time(s) to ${filePath}. The oldString still matches the current file — the edit likely succeeded already. Re-read the file with read_file to see the current state, then make a DIFFERENT edit.` };
      }

      const loadContent = () => {
        const chunks = base64Store.getChunks(entry.chunks.map(c => c.id));
        let content = chunks.map(c => c.text).join('');
        // Reconcile CRLF files (from local/vcs sources) against LF oldStrings.
        if (content.includes('\r\n') && !cleanedOldString.includes('\r\n')) {
          content = content.replace(/\r\n/g, '\n');
        }
        return content;
      };
      let matchContent = loadContent();

      const attemptEdit = (content) => {
        const match = findMatch(content, cleanedOldString);
        if (!match) return { match: null };
        if (match.length > cleanedOldString.length * 4 && cleanedOldString.split('\n').length > 1) {
          return { oversized: true, match };
        }
        const updated = content.slice(0, match.index) + newString + content.slice(match.index + match.length);
        return { match, updated };
      };

      let attempt = attemptEdit(matchContent);
      if (!attempt.match && !attempt.oversized && githubContext) {
        // The content store may hold a stale copy (persisted from an earlier
        // session). Re-fetch the current file from GitHub and retry once.
        try {
          const fresh = await withTimeout(
            fetchFileContent(githubContext.owner, githubContext.repo, filePath, githubContext.token),
            TOOL_TIMEOUT_MS,
            `edit-refresh(${filePath})`,
          );
          if (fresh) {
            await persistFileContent(storeId, filePath, fresh);
            entry = store.getEntry(storeId);
            matchContent = loadContent();
            attempt = attemptEdit(matchContent);
            if (attempt.match) {
              console.log(`[Edit] ${filePath}: store was stale — re-fetched from GitHub and matched`);
            }
          }
        } catch (err) {
          console.warn(`[Edit] refresh failed for ${filePath}: ${err.message}`);
        }
      }

      if (!attempt.match) {
        const firstLine = oldString.split('\n')[0].slice(0, 80);
        const cleanedFirstLine = cleanedOldString.split('\n')[0].slice(0, 80);
        const contentLines = matchContent.split('\n');
        let closestLine = -1;
        let closestContent = '';
        for (let i = 0; i < contentLines.length; i++) {
          if (contentLines[i].includes(cleanedFirstLine)) { closestLine = i + 1; closestContent = contentLines[i].slice(0, 120); break; }
        }
        let hint = '';
        if (hadLineNumbers) {
          hint = ` Line number prefixes (e.g. "10: code") were stripped from oldString but still no match.`;
        }
        if (closestLine !== -1) {
          hint += ` The first line was found near line ${closestLine}:\n  Provided:   "${firstLine}"\n  File near ${closestLine}: "${closestContent}"\n  Match the indentation and content exactly — line numbers are automatically stripped.`;
        } else {
          hint += ` The oldString was not found in the file's current content. Re-read the file with read_file and provide the exact text from its output (line numbers are stripped automatically).`;
        }
        return { success: false, content: `edit failed: oldString not found in ${filePath}.${hint}` };
      }
      if (attempt.oversized) {
        return { success: false, content: `edit failed: matched span (${attempt.match.length} chars) is much larger than oldString (${cleanedOldString.length} chars). Re-read the file and provide more of the surrounding context in oldString.` };
      }

      const updated = attempt.updated;
      appliedEdits.set(editKey, (appliedEdits.get(editKey) || 0) + 1);
      await persistFileContent(storeId, filePath, updated);

      const oldLines = cleanedOldString.split('\n');
      const newLines = newString.split('\n');
      const startLine = matchContent.slice(0, attempt.match.index).split('\n').length;
      const updatedLines = updated.split('\n');
      const contextBefore = 5;
      const contextAfter = 5;
      const showStart = Math.max(0, startLine - 1 - contextBefore);
      const showEnd = Math.min(updatedLines.length, startLine - 1 + newLines.length + contextAfter);
      const contextBlock = updatedLines.slice(showStart, showEnd)
        .map((line, i) => `${showStart + i + 1}: ${line}`)
        .join('\n');
      const summary = `Successfully edited ${filePath} at line ${startLine} (${matchContent.length} → ${updated.length} chars, ${newLines.length - oldLines.length >= 0 ? '+' : ''}${newLines.length - oldLines.length} lines). File now has ${updatedLines.length} lines.`;
      const importLines = updatedLines.slice(0, 30).map((line, i) => `${i + 1}: ${line}`).join('\n');
      console.log(`[Edit] ${filePath}: replaced ${cleanedOldString.length} chars at line ${startLine} → ${newString.length} chars${hadLineNumbers ? ' (line numbers stripped)' : ''}`);
      return { success: true, content: `${summary}\n\nImports at top of file (lines 1-${Math.min(30, updatedLines.length)}):\n${importLines}\n\nContext around edit (${showStart + 1}-${showEnd}):\n${contextBlock}` };
    }

    case 'write': {
      const filePath = normalizePath(args.filePath);
      const content = args.content;
      if (!filePath || content == null) {
        return { success: false, content: 'write requires "filePath" and "content" parameters' };
      }
      const existingFile = fileTree.some(f => f === filePath);
      if (!existingFile) {
        const parentDir = filePath.split('/').slice(0, -1).join('/');
        const parentExists = parentDir && fileTree.some(f => f.startsWith(parentDir + '/') || f === parentDir);
        if (!parentExists && fileTree.length > 0) {
          return { success: false, content: `Cannot create "${filePath}": parent directory does not exist in the repository. Use list_files to find the correct location, or check the FILE TREE section for valid paths.` };
        }
      }
      const storeId = `repo:${filePath}`;
      await persistFileContent(storeId, filePath, content);

      const kw = extractKeywords(content);
      const chunkId = `${storeId}:chunk-write-${Date.now()}`;
      const newEntry = {
        id: storeId,
        category: ContentCategory.REPO_FILE,
        chunks: [{ id: chunkId, text: content, startIndex: 0, endIndex: content.length, keywords: kw, charCount: content.length }],
        sourcePath: filePath,
        tags: [],
        lastUpdated: Date.now(),
        totalChars: content.length,
      };
      store.entries.set(storeId, newEntry);
      base64Store.encodedChunks.set(chunkId, {
        text: content,
        meta: { entryId: storeId, sourcePath: filePath, category: ContentCategory.REPO_FILE, keywords: kw, charCount: content.length, byteSize: content.length, startIndex: 0, endIndex: content.length },
      });

      console.log(`[Write] ${filePath}: wrote ${content.length} chars (persisted to store)`);
      return { success: true, content: `Successfully wrote ${content.length} chars to ${filePath}` };
    }

    case 'task': {
      if (depth >= 1) {
        return { success: false, content: 'Sub-agents cannot spawn further sub-agents. Complete your research with the available tools instead.' };
      }
      if (!runSubAgent) {
        return { success: false, content: 'Sub-agent execution is not available in this context.' };
      }
      const prompt = args.prompt;
      if (!prompt) return { success: false, content: 'task requires a "prompt" parameter' };
      try {
        console.log(`[SubAgent] Spawning sub-agent (depth=${depth + 1}): "${prompt.slice(0, 100)}..."`);
        const subResult = await runSubAgent({
          prompt,
          tools: computeSubAgentTools(),
          systemPrompt: SUB_AGENT_SYSTEM_PROMPT,
          githubContext,
          fileTree,
          depth: depth + 1,
        });
        console.log(`[SubAgent] Sub-agent returned ${subResult.length} chars`);
        return { success: true, content: subResult };
      } catch (err) {
        console.warn(`[SubAgent] Sub-agent failed:`, err.message);
        return { success: false, content: `Sub-agent error: ${err.message}` };
      }
    }

    case 'list_skills':
    case 'activate_skill':
    case 'deactivate_skill': {
      const toolDef = SKILL_MANAGEMENT_TOOL_DEFS.find(t => t.name === name);
      if (!toolDef) return { success: false, content: `Unknown skill tool: ${name}` };
      return toolDef.execute(args);
    }

    default:
      return { success: false, content: `Unknown tool: ${name}` };
  }
}
