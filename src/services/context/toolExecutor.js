import { getContentStore } from './contentStore';
import { fetchFileContent } from '../githubRepoService';
import { getBase64Store } from './base64Store';

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
      description: 'Read the full contents of a file from the repository. Returns the complete file text.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path relative to repo root, e.g. "src/components/Button.tsx"' },
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
      description: 'Search for files matching a pattern or containing specific text. Returns matching file paths.',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Search term or glob pattern, e.g. "Button" or "*.tsx"' },
        },
        required: ['pattern'],
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
      const storeId = `repo:${path}`;
      const altId = `github:${path}`;

      const entry = store.getEntry(storeId) || store.getEntry(altId);
      if (entry) {
        const chunks = base64Store.getChunks(entry.chunks.map(c => c.id));
        if (chunks.length > 0) {
          const content = chunks.map(c => c.text).join('');
          if (content.length > MAX_FILE_CONTENT_CHARS) {
            return { success: true, content: content.slice(0, MAX_FILE_CONTENT_CHARS) + `\n\n[Truncated: showing first ${MAX_FILE_CONTENT_CHARS} of ${content.length} chars]` };
          }
          return { success: true, content };
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
            if (content.length > MAX_FILE_CONTENT_CHARS) {
              return { success: true, content: content.slice(0, MAX_FILE_CONTENT_CHARS) + `\n\n[Truncated: showing first ${MAX_FILE_CONTENT_CHARS} of ${content.length} chars]` };
            }
            return { success: true, content };
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

    default:
      return { success: false, content: `Unknown tool: ${name}` };
  }
}
