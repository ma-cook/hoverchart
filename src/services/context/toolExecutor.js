import { getContentStore, ContentCategory, waitForContentStoreHydration } from './contentStore';
import { fetchFileContent } from '../githubRepoService';
import { getBase64Store, waitForBase64StoreHydration } from './base64Store';
import { extractKeywords } from './chunkIndex';
import useObjectsStore from '../../stores/objectsStore';
import useCodeStore from '../../stores/codeStore';
import { getNodeInfo, getDependencies, findPath, searchNodes, getCommunityInfo, getCommunityNodes, searchCommunities, getLspDefinition, getLspReferences, getLspTypeInfo, getLspCallGraph, getLspOverview } from './graphQuery';

const TOOL_TIMEOUT_MS = 20_000;
const DEFAULT_READ_LINES = 2000;
const MAX_READ_LINES = 4000;

const appliedEdits = new Map();

function persistFileContent(storeId, filePath, content) {
  setTimeout(async () => {
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
        id: `chunk-${chunkIndex}`,
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
  }, 0);
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
      description: 'Read the contents of a file from the repository. Returns up to 1000 lines by default. Each line is prefixed with its line number (e.g. "42:  code here"). Use offset to read later sections of large files.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path relative to repo root, e.g. "src/components/Button.tsx"' },
          offset: { type: 'number', description: 'Line number to start reading from (default 1, 1-indexed)' },
          limit: { type: 'number', description: 'Max lines to return (default 1000)' },
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
      description: 'Make a targeted edit to a file by replacing an exact string match. Use this for modifications — it is more precise than regenerating the whole file. You MUST call read_file first to get the current content, then use the exact text as oldString.',
      parameters: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'File path relative to repo root' },
          oldString: { type: 'string', description: 'The exact string to find and replace (must match file content exactly)' },
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
      description: 'Create a new file or completely overwrite an existing file. Use this for NEW files only. For modifying existing files, use the edit tool instead.',
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

  switch (name) {
    case 'quick_look': {
      const path = args.path;
      const headLines = Math.min(parseInt(args.head, 10) || 40, 100);
      const tailLines = Math.min(parseInt(args.tail, 10) || 20, 50);
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
      const path = args.path;
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
      const path = args.path;
      const startLine = Math.max(1, parseInt(args.offset, 10) || 1);
      const requestedLines = parseInt(args.limit, 10) || DEFAULT_READ_LINES;
      const lineLimit = Math.min(requestedLines, MAX_READ_LINES);
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
      return { success: true, content: `${sectionLabel}\n${numbered}${suffix}` };
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
      const normalize = (s) => (s || '').toLowerCase().replace(/[-_]/g, '');
      const pattern = normalize(args.pattern);
      if (!pattern) return { success: false, content: 'search_code requires a "pattern" parameter' };
      const READ_FILE_HINT = '\n\n→ Use quick_look("path") for a preview, or read_file("path") for full content.';
      const MAX_RESULTS = 15;

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

      // 4. ContentStore — full-text search in loaded file contents
      await new Promise(r => setTimeout(r, 0));
      const entries = Array.from(store.entries.entries());
      let scanCount = 0;
      for (const [id, entry] of entries) {
        if (results.length >= MAX_RESULTS) break;
        if (!id.startsWith('repo:')) continue;
        const filePath = id.slice(5);
        for (const chunk of entry.chunks) {
          const text = (chunk.text || '').toLowerCase();
          const idx = text.indexOf(pattern);
          if (idx >= 0) {
            const start = Math.max(0, idx - 50);
            const end = Math.min(text.length, idx + pattern.length + 80);
            const snippet = chunk.text.slice(start, end).replace(/\n/g, ' ').trim();
            const prefix = start > 0 ? '...' : '';
            const suffix = end < chunk.text.length ? '...' : '';
            results.push({ rank: 3, text: `${filePath}${sizeHint(filePath)}: ${prefix}${snippet}${suffix}` });
            break;
          }
        }
        scanCount++;
        if (scanCount % 50 === 0) await new Promise(r => setTimeout(r, 0));
      }

      if (results.length === 0) {
        return { success: true, content: 'No matching files found. Try different search terms or use list_files("path") to browse directories.' };
      }

      results.sort((a, b) => a.rank - b.rank);
      const output = results.slice(0, MAX_RESULTS).map(r => r.text).join('\n');
      return { success: true, content: output + READ_FILE_HINT };
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
      const filePath = args.filePath;
      const oldString = args.oldString;
      const newString = args.newString;
      if (!filePath || oldString == null || newString == null) {
        return { success: false, content: 'edit requires "filePath", "oldString", and "newString" parameters' };
      }
      const editKey = `${filePath}\0${oldString}`;
      const prevCount = appliedEdits.get(editKey) || 0;
      if (prevCount >= 1) {
        return { success: false, content: `This edit was already applied ${prevCount} time(s) to ${filePath}. The oldString still exists in the file, which means your newString must also contain the oldString text — this creates duplicates. Re-read the file with read_file to see the current state, then make a DIFFERENT edit that doesn't re-insert the same code.` };
      }
      appliedEdits.set(editKey, prevCount + 1);
      const storeId = `repo:${filePath}`;
      const altId = `github:${filePath}`;
      const entry = store.getEntry(storeId) || store.getEntry(altId);
      if (!entry) {
        return { success: false, content: `File not found in cache: ${filePath}. Call read_file("${filePath}") first to load it.` };
      }
      const chunks = base64Store.getChunks(entry.chunks.map(c => c.id));
      const fullContent = chunks.map(c => c.text).join('');
      const idx = fullContent.indexOf(oldString);
      if (idx === -1) {
        const firstLine = oldString.split('\n')[0].slice(0, 80);
        const contentLines = fullContent.split('\n');
        let closestLine = -1;
        for (let i = 0; i < contentLines.length; i++) {
          if (contentLines[i].includes(firstLine)) { closestLine = i + 1; break; }
        }
        const hint = closestLine !== -1
          ? ` The first line of oldString was found near line ${closestLine}. Re-read the file and use the exact text with correct whitespace/indentation.`
          : ' The oldString was not found. Re-read the file with read_file and copy the exact text including all indentation.';
        return { success: false, content: `edit failed: oldString not found in ${filePath}.${hint}` };
      }
      const endIdx = idx + oldString.length;
      const updated = fullContent.slice(0, idx) + newString + fullContent.slice(endIdx);
      persistFileContent(storeId, filePath, updated);

      const oldLines = oldString.split('\n');
      const newLines = newString.split('\n');
      const startLine = fullContent.slice(0, idx).split('\n').length;
      const updatedLines = updated.split('\n');
      const contextBefore = 5;
      const contextAfter = 5;
      const showStart = Math.max(0, startLine - 1 - contextBefore);
      const showEnd = Math.min(updatedLines.length, startLine - 1 + newLines.length + contextAfter);
      const contextBlock = updatedLines.slice(showStart, showEnd)
        .map((line, i) => `${showStart + i + 1}: ${line}`)
        .join('\n');
      const summary = `Successfully edited ${filePath} at line ${startLine} (${fullContent.length} → ${updated.length} chars, ${newLines.length - oldLines.length >= 0 ? '+' : ''}${newLines.length - oldLines.length} lines). File now has ${updatedLines.length} lines.`;
      console.log(`[Edit] ${filePath}: replaced ${oldString.length} chars at line ${startLine} → ${newString.length} chars (persisted to store)`);
      return { success: true, content: `${summary}\n\nContext around edit (${showStart + 1}-${showEnd}):\n${contextBlock}` };
    }

    case 'write': {
      const filePath = args.filePath;
      const content = args.content;
      if (!filePath || content == null) {
        return { success: false, content: 'write requires "filePath" and "content" parameters' };
      }
      const existingFile = fileTree.some(f => f.path === filePath);
      if (!existingFile) {
        const parentDir = filePath.split('/').slice(0, -1).join('/');
        const parentExists = parentDir && fileTree.some(f => f.path.startsWith(parentDir + '/') || f.path === parentDir);
        if (!parentExists && fileTree.length > 0) {
          return { success: false, content: `Cannot create "${filePath}": parent directory does not exist in the repository. Use list_files to find the correct location, or check the FILE TREE section for valid paths.` };
        }
      }
      const storeId = `repo:${filePath}`;
      persistFileContent(storeId, filePath, content);
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
          tools: SUB_AGENT_TOOLS,
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

    default:
      return { success: false, content: `Unknown tool: ${name}` };
  }
}
