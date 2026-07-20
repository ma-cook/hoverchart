import { getContentStore } from './contentStore';
import { fetchFileContent } from '../githubRepoService';
import { getBase64Store } from './base64Store';

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
          return { success: true, content: chunks.map(c => c.text).join('') };
        }
      }

      if (githubContext) {
        try {
          const content = await fetchFileContent(githubContext.owner, githubContext.repo, path, githubContext.token);
          if (content) {
            store.upsert(storeId, 'repo_file', content, { sourcePath: path, tags: ['github', 'repo', 'code'] });
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
      const pattern = args.pattern.toLowerCase();
      const matching = fileTree.filter(f => f.toLowerCase().includes(pattern)).slice(0, 50);
      return { success: true, content: matching.length > 0 ? matching.join('\n') : 'No matching files found' };
    }

    default:
      return { success: false, content: `Unknown tool: ${name}` };
  }
}
