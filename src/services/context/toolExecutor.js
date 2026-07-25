import { getContentStore, ContentCategory } from './contentStore';
import { fetchFileContent } from '../githubRepoService';
import { getBase64Store } from './base64Store';
import useObjectsStore from '../../stores/objectsStore';
import useCodeStore from '../../stores/codeStore';
import { getNodeInfo, getDependencies, findPath, searchNodes } from './graphQuery';

const TOOL_TIMEOUT_MS = 20_000;
const MAX_FILE_CONTENT_CHARS = 8000;

function persistFileContent(storeId, filePath, content) {
  const store = getContentStore();
  const base64Store = getBase64Store();
  store.upsert(storeId, ContentCategory.REPO_FILE, content, { sourcePath: filePath });
  const entry = store.getEntry(storeId);
  if (entry) {
    for (const chunk of entry.chunks) {
      const b64 = btoa(unescape(encodeURIComponent(chunk.text)));
      base64Store.encodedChunks.set(chunk.id, {
        b64,
        meta: {
          entryId: storeId,
          sourcePath: filePath,
          category: ContentCategory.REPO_FILE,
          keywords: chunk.keywords,
          charCount: chunk.charCount,
          byteSize: b64.length,
          startIndex: chunk.startIndex,
          endIndex: chunk.endIndex,
        },
      });
    }
  }
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
      name: 'read_file',
      description: 'Read the contents of a file from the repository. Returns at least 8000 chars by default. Use offset to read specific sections of very large files (>8000 chars).',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path relative to repo root, e.g. "src/components/Button.tsx"' },
          offset: { type: 'number', description: 'Character offset to start reading from (default 0)' },
          limit: { type: 'number', description: 'Max characters to return (default 8000)' },
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
  { type: 'function', function: { name: 'list_files', description: 'List files in a directory.', parameters: { type: 'object', properties: { path: { type: 'string' } } } } },
  { type: 'function', function: { name: 'search_code', description: 'Search for files matching a pattern.', parameters: { type: 'object', properties: { pattern: { type: 'string' } }, required: ['pattern'] } } },
  { type: 'function', function: { name: 'get_node_info', description: 'Get details about a component.', parameters: { type: 'object', properties: { nodeId: { type: 'string' } }, required: ['nodeId'] } } },
  { type: 'function', function: { name: 'get_dependencies', description: 'Find dependencies.', parameters: { type: 'object', properties: { nodeId: { type: 'string' }, direction: { type: 'string' } }, required: ['nodeId'] } } },
  { type: 'function', function: { name: 'search_nodes', description: 'Search diagram nodes.', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } } },
];

const SUB_AGENT_SYSTEM_PROMPT = `You are a research sub-agent. Your job is to answer a specific question about a codebase by reading files and searching code.

TOOLS: You can read files, list directories, search code, and query the component graph. You CANNOT modify any files.

INSTRUCTIONS:
1. Use the tools to gather the information requested in the prompt
2. Read files fully (8000+ chars) — do not read tiny slices
3. Each file should be read ONCE
4. When you have enough information, write a clear, structured summary

OUTPUT FORMAT:
- Start with a direct answer to the prompt
- Include file paths and line numbers for key findings
- Include relevant code snippets (keep them short)
- Do NOT generate code or suggest changes — only report what exists`;

export async function executeTool(name, args, githubContext, fileTree = [], { runSubAgent, depth = 0 } = {}) {
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
        if (chunks.length > 0) content = chunks.map(c => c.text).join('');
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

      const lines = content.split('\n');
      const totalLines = lines.length;
      const head = lines.slice(0, headLines).map((l, i) => `${i + 1}: ${l}`).join('\n');
      if (totalLines <= headLines + tailLines || tailLines === 0) {
        return { success: true, content: head };
      }
      const tail = lines.slice(-tailLines).map((l, i) => `${totalLines - tailLines + i + 1}: ${l}`).join('\n');
      return { success: true, content: `${head}\n\n... (${totalLines - headLines - tailLines} lines omitted) ...\n\n${tail}` };
    }

    case 'read_file': {
      const path = args.path;
      const offset = Math.max(0, parseInt(args.offset, 10) || 0);
      const requestedLimit = parseInt(args.limit, 10) || MAX_FILE_CONTENT_CHARS;
      const limit = Math.min(Math.max(8000, requestedLimit), MAX_FILE_CONTENT_CHARS);
      const storeId = `repo:${path}`;
      const altId = `github:${path}`;

      const entry = store.getEntry(storeId) || store.getEntry(altId);
      if (entry) {
        const chunks = base64Store.getChunks(entry.chunks.map(c => c.id));
        if (chunks.length > 0) {
          const content = chunks.map(c => c.text).join('');
          const sliced = content.slice(offset, offset + limit);
          if (sliced.length === 0) {
            return { success: true, content: `[End of file: ${path} has ${content.length} chars]` };
          }
          const prefix = offset > 0 ? `[Starting at char ${offset}]` : '';
          const suffix = offset + limit < content.length ? `\n\n[Showing ${sliced.length} of ${content.length} chars — use offset=${offset + limit} to continue]` : '';
          return { success: true, content: prefix + sliced + suffix };
        }
      }

      if (githubContext) {
        try {
          const content = await withTimeout(
            fetchFileContent(githubContext.owner, githubContext.repo, path, githubContext.token),
            TOOL_TIMEOUT_MS,
            `read_file(${path})`,
          );
          if (content) {
            const sliced = content.slice(offset, offset + limit);
            if (sliced.length === 0) {
              return { success: true, content: `[End of file: ${path} has ${content.length} chars]` };
            }
            const prefix = offset > 0 ? `[Starting at char ${offset}]` : '';
            const suffix = offset + limit < content.length ? `\n\n[Showing ${sliced.length} of ${content.length} chars — use offset=${offset + limit} to continue]` : '';
            return { success: true, content: prefix + sliced + suffix };
          }
        } catch (err) {
          return { success: false, content: `Error reading ${path}: ${err.message}` };
        }
      }

      return { success: false, content: `File not found: ${path}` };
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

      // 1. Scene objects — highest relevance (directly in diagram)
      const sceneObjects = useObjectsStore.getState().objects || [];
      for (const obj of sceneObjects) {
        const nodeId = obj.merfolkData?.nodeId || '';
        const name = (obj.headerText || '').toLowerCase();
        const filePath = obj.merfolkData?.codeFilePath || obj.metadata?.codeFilePath || '';
        if (!filePath) continue;
        if (normalize(nodeId).includes(pattern) || normalize(name).includes(pattern)) {
          const nodeType = obj.merfolkData?.nodeType || obj.type || 'unknown';
          results.push({ rank: 0, text: `[${nodeType}:${obj.headerText || nodeId}] → ${filePath}` });
        }
      }

      // 2. Content index — semantic matches (exports, functions, classes, CSS)
      const contentIndex = useCodeStore.getState().contentIndex;
      if (contentIndex) {
        const indexLines = contentIndex.split('\n');
        for (const line of indexLines) {
          if (results.length >= MAX_RESULTS) break;
          if (normalize(line).includes(pattern)) {
            const filePath = line.split(':')[0]?.trim();
            if (filePath) results.push({ rank: 1, text: line });
          }
        }
      }

      // 3. File tree — filename matches
      const matchingFiles = fileTree.filter(f => normalize(f).includes(pattern)).slice(0, 10);
      for (const f of matchingFiles) {
        if (results.length >= MAX_RESULTS) break;
        results.push({ rank: 2, text: f });
      }

      // 4. ContentStore — full-text search in loaded file contents
      const entries = Array.from(store.entries.entries());
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
            results.push({ rank: 3, text: `${filePath}: ${prefix}${snippet}${suffix}` });
            break;
          }
        }
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

    case 'edit': {
      const filePath = args.filePath;
      const oldString = args.oldString;
      const newString = args.newString;
      if (!filePath || oldString == null || newString == null) {
        return { success: false, content: 'edit requires "filePath", "oldString", and "newString" parameters' };
      }
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
        const closeIdx = fullContent.indexOf(oldString.slice(0, Math.min(80, oldString.length)));
        const hint = closeIdx !== -1 ? ` Did you mean around character ${closeIdx}? Check the exact whitespace and indentation.` : ' The oldString was not found. Re-read the file with read_file and copy the exact text.';
        return { success: false, content: `edit failed: oldString not found in ${filePath}.${hint}` };
      }
      const endIdx = idx + oldString.length;
      const updated = fullContent.slice(0, idx) + newString + fullContent.slice(endIdx);
      persistFileContent(storeId, filePath, updated);
      // Build a more informative diff preview
      const oldLines = oldString.split('\n');
      const newLines = newString.split('\n');
      const contextLines = 2;
      const startLine = fullContent.slice(0, idx).split('\n').length;
      const diffLines = [];
      diffLines.push(`--- a/${filePath}`);
      diffLines.push(`+++ b/${filePath}`);
      diffLines.push(`@@ -${startLine},${oldLines.length} +${startLine},${newLines.length} @@`);
      for (const line of oldLines) diffLines.push(`- ${line}`);
      for (const line of newLines) diffLines.push(`+ ${line}`);
      const diffPreview = diffLines.join('\n');
      console.log(`[Edit] ${filePath}: replaced ${oldString.length} chars at offset ${idx} → ${newString.length} chars (persisted to store)`);
      return { success: true, content: `Successfully edited ${filePath} (${fullContent.length} → ${updated.length} chars)\n\nDiff preview:\n${diffPreview}` };
    }

    case 'write': {
      const filePath = args.filePath;
      const content = args.content;
      if (!filePath || content == null) {
        return { success: false, content: 'write requires "filePath" and "content" parameters' };
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
