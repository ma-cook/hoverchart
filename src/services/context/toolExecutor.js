import { getContentStore } from './contentStore';
import { fetchFileContent } from '../githubRepoService';
import { getBase64Store } from './base64Store';
import { useObjectsStore } from '../../stores/objectsStore';
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
      description: 'Read the contents of a file from the repository. Use offset/limit to read specific sections of large files.',
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
      const limit = Math.min(Math.max(100, parseInt(args.limit, 10) || MAX_FILE_CONTENT_CHARS), MAX_FILE_CONTENT_CHARS);
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
      const pattern = (args.pattern || '').toLowerCase();
      if (!pattern) return { success: false, content: 'search_code requires a "pattern" parameter' };

      const sceneObjects = useObjectsStore.getState().objects || [];
      const sceneMatches = [];
      for (const obj of sceneObjects) {
        const nodeId = obj.merfolkData?.nodeId || '';
        const name = (obj.headerText || '').toLowerCase();
        const filePath = obj.merfolkData?.codeFilePath || obj.metadata?.codeFilePath || '';
        if (!filePath) continue;
        if (nodeId.toLowerCase().includes(pattern) || name.includes(pattern)) {
          const nodeType = obj.merfolkData?.nodeType || obj.type || 'unknown';
          sceneMatches.push({ nodeId, nodeType, name: obj.headerText || nodeId, filePath });
          if (sceneMatches.length >= 5) break;
        }
      }
      if (sceneMatches.length > 0) {
        const lines = [];
        for (const m of sceneMatches) {
          lines.push(`[${m.nodeType}:${m.name}] → ${m.filePath}`);
          const info = getNodeInfo(m.nodeId);
          const connLines = info.split('\n').filter(l => l.startsWith('  ')).slice(0, 4);
          if (connLines.length > 0) lines.push(connLines.join('\n'));
        }
        return { success: true, content: lines.join('\n') };
      }

      const storeResults = store.search(pattern, { maxChunks: 20 });
      if (storeResults.length > 0) {
        const seen = new Set();
        const lines = [];
        for (const r of storeResults) {
          const path = r.sourcePath;
          if (seen.has(path)) continue;
          seen.add(path);
          const snippet = r.chunk.text.slice(0, 200).replace(/\n/g, ' ');
          lines.push(`${path}: ...${snippet}...`);
          if (lines.length >= 20) break;
        }
        return { success: true, content: lines.join('\n') || 'No matching content found' };
      }

      const matching = fileTree.filter(f => f.toLowerCase().includes(pattern)).slice(0, 50);
      return { success: true, content: matching.length > 0 ? matching.join('\n') : 'No matching files found' };
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
