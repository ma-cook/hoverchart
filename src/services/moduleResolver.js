/**
 * moduleResolver.js
 *
 * Resolves JavaScript/TypeScript import paths against a repository's file tree,
 * supporting tsconfig.json path aliases, extension resolution, and index file
 * resolution. This is the core of L1 import resolution improvements.
 */

const JS_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.cjs'];
const INDEX_FILES = ['index.tsx', 'index.ts', 'index.jsx', 'index.js', 'index.mjs'];

/**
 * Parse tsconfig.json content and extract compilerOptions.paths.
 * Supports both `paths` and `baseUrl` resolution.
 *
 * @param {string} tsconfigContent - Raw JSON string of tsconfig.json
 * @returns {{ baseUrl: string, paths: Map<string, string[]> }} Resolved alias config
 */
export function parseTsConfig(tsconfigContent) {
  if (!tsconfigContent) return { baseUrl: '', paths: new Map() };

  try {
    const config = JSON.parse(tsconfigContent);
    const options = config.compilerOptions || {};
    const baseUrl = options.baseUrl || '';
    const rawPaths = options.paths || {};
    const paths = new Map();

    for (const [alias, targets] of Object.entries(rawPaths)) {
      // tsconfig paths: { "@/*": ["./src/*"] }
      // Strip trailing /* or * for matching
      const aliasKey = alias.replace(/\/\*$/, '').replace(/\*$/, '');
      const resolvedTargets = (Array.isArray(targets) ? targets : [targets]).map(t =>
        t.replace(/\/\*$/, '').replace(/\*$/, '')
      );
      paths.set(aliasKey, resolvedTargets);
    }

    return { baseUrl, paths };
  } catch {
    return { baseUrl: '', paths: new Map() };
  }
}

/**
 * Build a file lookup index from the repository file structure.
 * Maps normalized paths (no extension) to full file paths for fast resolution.
 *
 * @param {string[]} fileTree - Array of file paths from the repo
 * @returns {{ byPath: Map<string, string>, byBasename: Map<string, string[]>, barrels: Set<string> }}
 */
export function buildFileIndex(fileTree) {
  const byPath = new Map();      // "src/components/Button" -> "src/components/Button.tsx"
  const byBasename = new Map();  // "Button" -> ["src/components/Button", "src/lib/Button"]
  const barrels = new Set();     // Set of file paths that are barrel/index files

  for (const filePath of fileTree) {
    // Strip extension for normalized lookup
    const ext = JS_EXTENSIONS.find(e => filePath.endsWith(e));
    const noExt = ext ? filePath.slice(0, -ext.length) : filePath;

    byPath.set(noExt, filePath);

    // Track basenames (last segment)
    const basename = noExt.split('/').pop();
    if (basename) {
      if (!byBasename.has(basename)) byBasename.set(basename, []);
      byBasename.get(basename).push(noExt);
    }

    // Track barrel/index files
    const baseName = filePath.split('/').pop();
    if (baseName && /^index\.(tsx?|jsx?|mjs|cjs)$/.test(baseName)) {
      barrels.add(noExt.replace(/\/index$/, ''));  // "src/components/index" -> "src/components"
    }
  }

  return { byPath, byBasename, barrels };
}

/**
 * Resolve an import source string to an actual file path using the file tree.
 *
 * Resolution order:
 * 1. Alias resolution (tsconfig paths)
 * 2. Relative path resolution (against importing file's directory)
 * 3. Extension resolution (try .tsx, .ts, .jsx, .js)
 * 4. Index file resolution (try /index.tsx, /index.ts, etc.)
 *
 * @param {string} source - The import source string (e.g. "../Button", "@/components/Button")
 * @param {string} fromFile - The file path doing the importing (e.g. "src/App.tsx")
 * @param {{ baseUrl: string, paths: Map<string, string[]> }} tsConfig - Parsed tsconfig
 * @param {{ byPath: Map<string, string>, byBasename: Map<string, string[]>, barrels: Set<string> }} fileIndex - File lookup index
 * @returns {string|null} Resolved file path, or null if not found
 */
export function resolveImport(source, fromFile, tsConfig, fileIndex) {
  if (!source || !fromFile) return null;

  // Skip external packages (no relative path, no alias)
  const isRelative = source.startsWith('./') || source.startsWith('../');
  const isAliased = tsConfig.paths.size > 0 && !isRelative && !source.startsWith('.');

  // 1. Try alias resolution
  if (isAliased) {
    const resolved = resolveAlias(source, tsConfig, fileIndex);
    if (resolved) return resolved;
  }

  // 2. Try relative path resolution
  if (isRelative) {
    const resolved = resolveRelative(source, fromFile, fileIndex);
    if (resolved) return resolved;
  }

  // 3. Try basename lookup (for non-relative, non-aliased imports that might be local)
  // This catches cases like `import Button from 'Button'` in monorepos
  const basename = source.split('/').pop();
  if (basename && fileIndex.byBasename.has(basename)) {
    const candidates = fileIndex.byBasename.get(basename);
    // Prefer candidates in the same directory or parent directories
    const fromDir = fromFile.split('/').slice(0, -1).join('/');
    const sameDir = candidates.find(c => c.startsWith(fromDir));
    if (sameDir) {
      return fileIndex.byPath.get(sameDir) || sameDir;
    }
    if (candidates.length === 1) {
      return fileIndex.byPath.get(candidates[0]) || candidates[0];
    }
  }

  return null;
}

/**
 * Resolve an aliased import path (e.g. "@/components/Button" -> "src/components/Button.tsx")
 */
function resolveAlias(source, tsConfig, fileIndex) {
  for (const [alias, targets] of tsConfig.paths) {
    if (source === alias || source.startsWith(alias + '/')) {
      const remainder = source.slice(alias.length);
      for (const target of targets) {
        const candidate = target + remainder;
        const resolved = tryResolve(candidate, fileIndex);
        if (resolved) return resolved;
      }
    }
  }
  return null;
}

/**
 * Resolve a relative import path (e.g. "../Button" from "src/App.tsx" -> "src/Button.tsx")
 */
function resolveRelative(source, fromFile, fileIndex) {
  const fromDir = fromFile.split('/').slice(0, -1).join('/');
  // Normalize the relative path
  const parts = (fromDir + '/' + source).split('/');
  const normalized = [];
  for (const part of parts) {
    if (part === '..') normalized.pop();
    else if (part !== '.' && part !== '') normalized.push(part);
  }
  const candidate = normalized.join('/');
  return tryResolve(candidate, fileIndex);
}

/**
 * Try to resolve a base path by checking extensions and index files.
 */
function tryResolve(basePath, fileIndex) {
  // Direct match (no extension needed, already resolved)
  if (fileIndex.byPath.has(basePath)) {
    return fileIndex.byPath.get(basePath);
  }

  // Try with JS extensions
  for (const ext of JS_EXTENSIONS) {
    const candidate = basePath + ext;
    if (fileIndex.byPath.has(candidate)) {
      return fileIndex.byPath.get(candidate);
    }
  }

  // Try as directory with index file
  for (const indexFile of INDEX_FILES) {
    const candidate = basePath + '/' + indexFile;
    if (fileIndex.byPath.has(candidate)) {
      return fileIndex.byPath.get(candidate);
    }
  }

  return null;
}

/**
 * Follow re-export chains transitively.
 * Given a set of barrel files and their module import relationships,
 * resolve re-exports so that consumers of a barrel see the actual source files.
 *
 * @param {Map<string, Set<string>>} moduleImportRelationships - source -> Set<importedBase>
 * @param {{ byPath: Map<string, string>, barrels: Set<string> }} fileIndex - File lookup index
 * @returns {Map<string, Set<string>>} Enhanced map with transitive re-exports resolved
 */
export function resolveBarrelChains(moduleImportRelationships, fileIndex) {
  const resolved = new Map();

  // Copy original relationships
  for (const [source, targets] of moduleImportRelationships) {
    resolved.set(source, new Set(targets));
  }

  // For each barrel file, find what it re-exports and propagate to consumers
  const barrelExports = new Map();  // barrelPath -> Set<actualFilePath>

  for (const barrelPath of fileIndex.barrels) {
    const barrelFile = fileIndex.byPath.get(barrelPath);
    if (!barrelFile) continue;

    // Find the barrel's imports — these are what it re-exports
    const barrelImports = resolved.get(barrelPath) || resolved.get(barrelFile.split('/').pop()?.replace(/\.(tsx?|jsx?|mjs|cjs)$/, '')) || new Set();
    if (barrelImports.size > 0) {
      barrelExports.set(barrelPath, barrelImports);
    }
  }

  // Propagate: for each file that imports a barrel, add the barrel's re-exported targets
  for (const [source, targets] of resolved) {
    const newTargets = new Set(targets);
    for (const target of targets) {
      if (barrelExports.has(target)) {
        for (const reExported of barrelExports.get(target)) {
          newTargets.add(reExported);
        }
      }
    }
    resolved.set(source, newTargets);
  }

  return resolved;
}

/**
 * Create a complete module resolver for a repository.
 *
 * @param {string[]} fileTree - Array of file paths
 * @param {string|null} tsconfigContent - Raw tsconfig.json content (null if not available)
 * @returns {{ resolve: (source: string, fromFile: string) => string|null, fileIndex: object, tsConfig: object }}
 */
export function createModuleResolver(fileTree, tsconfigContent) {
  const tsConfig = parseTsConfig(tsconfigContent);
  const fileIndex = buildFileIndex(fileTree);

  return {
    resolve: (source, fromFile) => resolveImport(source, fromFile, tsConfig, fileIndex),
    fileIndex,
    tsConfig,
  };
}
