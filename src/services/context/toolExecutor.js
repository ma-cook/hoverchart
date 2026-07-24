import { getContentStore, ContentCategory } from './contentStore';
import { fetchFileContent } from '../githubRepoService';
import { getBase64Store } from './base64Store';
import useObjectsStore from '../../stores/objectsStore';
import useCodeStore from '../../stores/codeStore';
import { getNodeInfo, getDependencies, findPath, searchNodes } from './graphQuery';

const TOOL_TIMEOUT_MS = 20_000;
const MAX_FILE_CONTENT_CHARS = 8000;

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
];

export async function executeTool(name, args, githubContext, fileTree = []) {
  const store = getContentStore();
  const base64Store = getBase64Store();

  switch (name) {
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
      const READ_FILE_HINT = '\n\n→ Use read_file("path") to see the full content of any file listed above.';

      const sceneObjects = useObjectsStore.getState().objects || [];
      const sceneMatches = [];
      for (const obj of sceneObjects) {
        const nodeId = obj.merfolkData?.nodeId || '';
        const name = (obj.headerText || '').toLowerCase();
        const filePath = obj.merfolkData?.codeFilePath || obj.metadata?.codeFilePath || '';
        if (!filePath) continue;
        if (normalize(nodeId).includes(pattern) || normalize(name).includes(pattern)) {
          const nodeType = obj.merfolkData?.nodeType || obj.type || 'unknown';
          sceneMatches.push(`[${nodeType}:${obj.headerText || nodeId}] → ${filePath}`);
          if (sceneMatches.length >= 10) break;
        }
      }
      if (sceneMatches.length > 0) {
        return { success: true, content: sceneMatches.join('\n') + READ_FILE_HINT };
      }

      const contentIndex = useCodeStore.getState().contentIndex;
      if (contentIndex) {
        const indexLines = contentIndex.split('\n');
        const indexMatches = [];
        for (const line of indexLines) {
          if (normalize(line).includes(pattern)) {
            const filePath = line.split(':')[0]?.trim();
            if (filePath) indexMatches.push(line);
            if (indexMatches.length >= 10) break;
          }
        }
        if (indexMatches.length > 0) {
          return { success: true, content: indexMatches.join('\n') + READ_FILE_HINT };
        }
      }

      const matching = fileTree.filter(f => normalize(f).includes(pattern)).slice(0, 50);
      if (matching.length > 0) {
        return { success: true, content: matching.join('\n') + READ_FILE_HINT };
      }

      const entries = Array.from(store.entries.entries());
      const contentMatches = [];
      for (const [id, entry] of entries) {
        if (!id.startsWith('repo:')) continue;
        const filePath = id.slice(5);
        for (const chunk of entry.chunks) {
          const text = (chunk.text || '').toLowerCase();
          const idx = text.indexOf(pattern);
          if (idx >= 0) {
            const start = Math.max(0, idx - 40);
            const end = Math.min(text.length, idx + pattern.length + 60);
            const snippet = chunk.text.slice(start, end).replace(/\n/g, ' ');
            contentMatches.push(`${filePath}: ...${snippet}...`);
            break;
          }
        }
        if (contentMatches.length >= 10) break;
      }
      return { success: true, content: contentMatches.length > 0 ? contentMatches.join('\n') + READ_FILE_HINT : 'No matching files found. Try different search terms or use list_files("path") to browse directories.' };
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

    default:
      return { success: false, content: `Unknown tool: ${name}` };
  }
}
