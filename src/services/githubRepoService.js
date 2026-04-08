/**
 * Service for scanning GitHub repositories and generating Merfolk diagram files
 * Handles GitHub OAuth, repository fetching, file analysis, and Merfolk markdown generation
 */
import { parse } from '@babel/parser';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

// GitHub API base URL
const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Exchange GitHub OAuth code for an access token
 * @param {string} code - The OAuth code from GitHub redirect
 * @returns {Promise<string>} - The access token
 */
export const exchangeGithubCode = async (code) => {
  try {
    const redirectUri = window.location.origin + window.location.pathname;
    const fetchGithubToken = httpsCallable(functions, 'fetchGithubToken');
    const result = await fetchGithubToken({ code, redirect_uri: redirectUri });
    return result.data.access_token;
  } catch (error) {
    console.error('Error exchanging GitHub code:', error);
    throw error;
  }
};

/**
 * Fetch user's repositories from GitHub
 * @param {string} token - GitHub access token
 * @returns {Promise<Array>} - Array of repository objects
 */
export const fetchRepositories = async (token) => {
  if (!token) {
    throw new Error('GitHub token not found');
  }

  try {
    const response = await fetch(`${GITHUB_API_BASE}/user/repos`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch repositories');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching repositories:', error);
    throw error;
  }
};

/**
 * Fetch file content from GitHub API
 * @param {string} owner - Repository owner
 * @param {string} repoName - Repository name
 * @param {string} filePath - Path to the file
 * @param {string} token - GitHub access token
 * @returns {Promise<string|null>} - File content or null if failed
 */
export const fetchFileContent = async (owner, repoName, filePath, token) => {
  try {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repoName}/contents/${filePath}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3.raw', // Get raw content directly
      },
    });

    if (!response.ok) {
      console.warn(`⚠️  GitHub API error for ${filePath}: ${response.status}`);
      return null;
    }

    // Get the raw text content
    return await response.text();
  } catch (error) {
    console.warn(`⚠️  Error fetching ${filePath}:`, error.message);
    return null;
  }
};

/**
 * Fetch the latest commit SHA for the default branch of a repository
 * @param {string} owner - Repository owner
 * @param {string} repoName - Repository name
 * @param {string} token - GitHub access token
 * @returns {Promise<string>} - The latest commit SHA
 */
export const fetchLatestCommitSha = async (owner, repoName, token) => {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repoName}/commits?per_page=1`;
  const response = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub API error fetching latest commit: ${response.status}`);
  }
  const commits = await response.json();
  if (!commits.length) {
    throw new Error('Repository has no commits');
  }
  return commits[0].sha;
};

/**
 * Fetch the list of changed files between two commits using the GitHub Compare API
 * @param {string} owner - Repository owner
 * @param {string} repoName - Repository name
 * @param {string} baseSha - Base commit SHA
 * @param {string} headSha - Head commit SHA
 * @param {string} token - GitHub access token
 * @returns {Promise<Array>} - Array of changed file objects { filename, status, path, name, type }
 */
export const fetchChangedFiles = async (owner, repoName, baseSha, headSha, token) => {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repoName}/compare/${baseSha}...${headSha}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub API error comparing commits: ${response.status}`);
  }
  const comparison = await response.json();
  return (comparison.files || []).map(f => ({
    filename: f.filename,
    status: f.status, // 'added', 'modified', 'removed', 'renamed'
    path: f.filename,
    name: f.filename.split('/').pop(),
  }));
};

/**
 * Determine the file type from a file path based on extension
 * @param {string} filePath - File path
 * @returns {string|null} - 'file' for JS/TS, 'python' for .py, 'vue' for .vue, 'shader' for shader files, or null
 */
const getFileTypeFromPath = (filePath) => {
  const name = filePath.split('/').pop();
  if (/\.(jsx?|tsx?)$/.test(name)) return 'file';
  if (/\.py$/.test(name)) return 'python';
  if (/\.vue$/.test(name)) return 'vue';
  if (/\.(glsl|wgsl|hlsl|vert|frag|comp)$/.test(name)) return 'shader';
  return null;
};

/**
 * Recursively fetch repository structure (JS/TS files only)
 * @param {string} owner - Repository owner
 * @param {string} repoName - Repository name
 * @param {string} token - GitHub access token
 * @param {string} path - Current path in repository
 * @returns {Promise<Array>} - Array of file objects with path, name, type
 */
export const fetchRepositoryStructure = async (owner, repoName, token, path = '') => {
  try {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repoName}/contents/${path}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const items = await response.json();
    const structure = [];

    for (const item of items) {
      if (item.type === 'dir') {
        // Recursively fetch subdirectories
        const subItems = await fetchRepositoryStructure(owner, repoName, token, item.path);
        structure.push(...subItems);
      } else if (item.type === 'file') {
        // Include JavaScript/TypeScript files
        if (
          item.name.endsWith('.js') ||
          item.name.endsWith('.jsx') ||
          item.name.endsWith('.ts') ||
          item.name.endsWith('.tsx')
        ) {
          structure.push({
            path: item.path,
            name: item.name,
            type: 'file',
          });
        }
        // Include Python files
        else if (item.name.endsWith('.py')) {
          structure.push({
            path: item.path,
            name: item.name,
            type: 'python',
          });
        }
        // Include Vue single-file components
        else if (item.name.endsWith('.vue')) {
          structure.push({
            path: item.path,
            name: item.name,
            type: 'vue',
          });
        }
        // Include shader files (GLSL, WGSL, HLSL, etc.)
        else if (
          item.name.endsWith('.glsl') ||
          item.name.endsWith('.wgsl') ||
          item.name.endsWith('.hlsl') ||
          item.name.endsWith('.vert') ||
          item.name.endsWith('.frag') ||
          item.name.endsWith('.comp')
        ) {
          structure.push({
            path: item.path,
            name: item.name,
            type: 'shader',
          });
        }
      }
    }

    return structure;
  } catch (error) {
    console.error(`Error fetching repository structure for ${path}:`, error);
    return [];
  }
};

/**
 * Helper to determine file context based on path
 * @param {string} filePath - Path to the file
 * @returns {Object} - Object with boolean flags for file type
 */
const analyzeFile = (filePath, repoType = 'react') => {
  // Use regex to match folder names at any level, including repo root (no leading slash)
  // e.g. matches both 'utils/foo.js' and 'src/utils/foo.js'
  // NOTE: isComponent is computed last so it can use the other flags for its jsx fallback.
  const isHook    = /(?:^|\/)hooks\//.test(filePath);
  const isService = /(?:^|\/)services\//.test(filePath);
  const isStore   = /(?:^|\/)stores\//.test(filePath) || /(?:^|\/)store\//.test(filePath);
  const isUtil    = /(?:^|\/)utils\//.test(filePath) || /(?:^|\/)helpers\//.test(filePath) ||
    /(?:^|\/)lib\//.test(filePath);
  // Worker folders/files (including /wasm/ which houses WebAssembly compute modules)
  const isWorker  = /(?:^|\/)workers\//.test(filePath) || /[Ww]orker\.(js|ts|jsx|tsx)$/.test(filePath) ||
    /(?:^|\/)wasm\//.test(filePath);
  // Shader folders/files
  const isShader  = /(?:^|\/)shaders\//.test(filePath) ||
    /\.(glsl|wgsl|hlsl|vert|frag|comp)$/.test(filePath);
  // Backend folders: functions (Firebase/cloud functions), api, server, backend, lambda, routes
  // For Next.js repos, `pages/api/` and `app/api/` are API routes (backend).
  const isBackend = /(?:^|\/)functions\//.test(filePath) ||
    /(?:^|\/)api\//.test(filePath) ||
    /(?:^|\/)server\//.test(filePath) ||
    /(?:^|\/)backend\//.test(filePath) ||
    /(?:^|\/)lambda\//.test(filePath) ||
    /(?:^|\/)routes\//.test(filePath);
  // A file is treated as a component if it lives in /components/, is App.jsx, or is any
  // .jsx/.tsx file that does NOT belong to another recognised category (hooks, services,
  // stores, utils, workers, backends, shaders).  This ensures files in non-standard
  // folders (e.g. /landing/, /pages/, /features/) are classified as component files so
  // their internal helper functions and event handlers get proper containment arrows
  // instead of appearing as isolated orphaned nodes in the diagram.
  const isComponent =
    /(?:^|\/)components\//.test(filePath) ||
    filePath.endsWith('/App.jsx') ||
    filePath === 'App.jsx' ||
    (/\.(jsx|tsx)$/.test(filePath) &&
      !isHook && !isService && !isStore && !isUtil &&
      !isWorker && !isBackend && !isShader);

  // Next.js route files: files inside `app/` or `pages/` that are NOT in
  // api/, components/, hooks/, services/, stores/, utils/, lib/, or workers/
  // directories.  These represent pages/layouts in the routing hierarchy.
  const isNextRoute = repoType === 'nextjs' && (
    /(?:^|\/)(?:app|pages)\//.test(filePath)
  ) && !isBackend && !isComponent && !isHook && !isService && !isStore && !isUtil && !isWorker;

  // Python-specific folder patterns
  const isModel = /(?:^|\/)models\//.test(filePath);
  const isView = /(?:^|\/)views\//.test(filePath) || /(?:^|\/)templates\//.test(filePath);
  const isController = /(?:^|\/)controllers\//.test(filePath) || /(?:^|\/)handlers\//.test(filePath);
  const isMiddleware = /(?:^|\/)middleware\//.test(filePath);
  const isConfig = /(?:^|\/)config\//.test(filePath) || /(?:^|\/)settings\//.test(filePath);
  const isMigration = /(?:^|\/)migrations\//.test(filePath) || /(?:^|\/)alembic\//.test(filePath);
  const isCommand = /(?:^|\/)commands\//.test(filePath) || /(?:^|\/)management\//.test(filePath);
  const isSerializer = /(?:^|\/)serializers\//.test(filePath) || /(?:^|\/)schemas\//.test(filePath);
  const isTask = /(?:^|\/)tasks\//.test(filePath) || /(?:^|\/)celery\//.test(filePath);

  // Vue-specific folder patterns
  const isComposable = /(?:^|\/)composables?\//.test(filePath);
  const isPlugin = /(?:^|\/)plugins?\//.test(filePath);
  const isDirective = /(?:^|\/)directives?\//.test(filePath);
  const isMixin = /(?:^|\/)mixins?\//.test(filePath);
  const isLayout = /(?:^|\/)layouts?\//.test(filePath);
  const isPage = /(?:^|\/)pages?\//.test(filePath) || /(?:^|\/)views?\//.test(filePath);
  const isRouter = /(?:^|\/)router\//.test(filePath);

  // Generic fallback: any plain .js/.ts file that doesn't belong to any other recognised
  // category is treated as a utility so its top-level functions get a proper file container
  // (with containment arrows) rather than appearing as orphaned standalone nodes.
  // This mirrors the .jsx/.tsx → isComponent fallback added for Bug 1, ensuring files like
  // /landing/sharedSpacesService.js or /wasm/pkg/hoverchart_wasm.js are never left uncategorised.
  const isUtilFinal = isUtil ||
    (/\.(js|ts)$/.test(filePath) &&
      !isHook && !isService && !isStore && !isWorker && !isBackend && !isShader && !isComponent);

  return { isComponent, isHook, isService, isStore, isUtil: isUtilFinal, isWorker, isShader, isBackend, isNextRoute,
    isModel, isView, isController, isMiddleware, isConfig, isMigration, isCommand, isSerializer, isTask,
    isComposable, isPlugin, isDirective, isMixin, isLayout, isPage, isRouter };
};

/**
 * Check if a node contains JSX elements
 * @param {Object} node - AST node
 * @param {Object} fileContext - File context flags
 * @returns {boolean} - True if node contains JSX
 */
const containsJSX = (node, fileContext = {}) => {
  if (!node) return false;

  // Explicit JSX elements
  if (node.type === 'JSXElement' || node.type === 'JSXFragment') return true;

  // Return statements
  if (node.type === 'ReturnStatement' && node.argument) {
    return containsJSX(node.argument, fileContext);
  }

  // Block statements (function bodies) - check ALL statements
  if (node.type === 'BlockStatement' && node.body) {
    return node.body.some((stmt) => containsJSX(stmt, fileContext));
  }

  // If statements - check both consequent and alternate
  if (node.type === 'IfStatement') {
    return (
      containsJSX(node.consequent, fileContext) ||
      (node.alternate && containsJSX(node.alternate, fileContext))
    );
  }

  // Conditional expressions (ternary)
  if (node.type === 'ConditionalExpression') {
    return containsJSX(node.consequent, fileContext) || containsJSX(node.alternate, fileContext);
  }

  // Logical expressions (&& ||)
  if (node.type === 'LogicalExpression') {
    return containsJSX(node.left, fileContext) || containsJSX(node.right, fileContext);
  }

  // Call expressions - check for common React patterns
  if (node.type === 'CallExpression') {
    // Array methods like .map() that often return JSX
    if (
      node.callee?.property?.name === 'map' ||
      node.callee?.property?.name === 'filter' ||
      node.callee?.property?.name === 'reduce'
    ) {
      if (node.arguments && node.arguments[0]) {
        return containsJSX(node.arguments[0], fileContext);
      }
    }
    // React.createElement or similar
    if (node.callee?.name === 'createElement' || node.callee?.object?.name === 'React') {
      return true;
    }
    // React.memo wrapping
    if (
      node.callee?.object?.name === 'React' &&
      node.callee?.property?.name === 'memo' &&
      node.arguments &&
      node.arguments[0]
    ) {
      return containsJSX(node.arguments[0], fileContext);
    }
    // forwardRef wrapping (both forwardRef() and React.forwardRef())
    if (
      (node.callee?.name === 'forwardRef' ||
        (node.callee?.object?.name === 'React' && node.callee?.property?.name === 'forwardRef')) &&
      node.arguments &&
      node.arguments[0]
    ) {
      return containsJSX(node.arguments[0], fileContext);
    }
    // memo wrapping (standalone memo())
    if (
      node.callee?.name === 'memo' &&
      node.arguments &&
      node.arguments[0]
    ) {
      return containsJSX(node.arguments[0], fileContext);
    }
  }

  // Arrow function expressions
  if (node.type === 'ArrowFunctionExpression') {
    return containsJSX(node.body, fileContext);
  }

  // Function expressions
  if (node.type === 'FunctionExpression') {
    return containsJSX(node.body, fileContext);
  }

  // Identifiers - could be children prop or component variable
  if (fileContext.isComponent && node.type === 'Identifier') {
    if (node.name === 'children') return true;
  }

  // Member expressions - props.children, etc.
  if (fileContext.isComponent && node.type === 'MemberExpression') {
    if (node.property?.name === 'children') return true;
  }

  // Null literal - components can return null
  if (node.type === 'NullLiteral' && fileContext.isComponent) {
    return true;
  }

  return false;
};

/**
 * Detect whether a repository uses React, Next.js, Vue, Python, or plain vanilla JS/TS.
 * Checks for Python files first, then Vue files, then JSX/TSX files, then inspects package.json.
 * @param {string} owner - Repo owner
 * @param {string} repoName - Repo name
 * @param {string} token - GitHub token
 * @param {Array} structure - Array of file objects from fetchRepositoryStructure
 * @returns {Promise<'react'|'nextjs'|'vue'|'python'|'vanilla'>}
 */
const detectRepoType = async (owner, repoName, token, structure) => {
  // Directories that contain example / demo / test code — these shouldn't
  // determine the repo type because library repos often ship a React example
  // even though the library itself is vanilla JS/TS.
  const nonSourceDirPattern = /(?:^|\/)(?:examples?|demos?|samples?|tests?|__tests__|__mocks__|e2e|cypress|fixtures?|stories|storybook)\//i;

  // ── Python detection (check before JS-based detection) ──────────────────
  const pythonFiles = structure.filter(f => f.type === 'python');
  const sourcePythonFiles = pythonFiles.filter(f => !nonSourceDirPattern.test(f.path));
  console.log(`  [detectRepoType] .py files total: ${pythonFiles.length}, in source dirs: ${sourcePythonFiles.length}`);

  if (sourcePythonFiles.length > 0) {
    // Check for JS/TS files too — if both exist, determine which is dominant
    const jsFiles = structure.filter(f => f.type === 'file');
    const sourceJsFiles = jsFiles.filter(f => !nonSourceDirPattern.test(f.path));
    if (sourceJsFiles.length > sourcePythonFiles.length) {
      console.log(`  [detectRepoType] Both Python and JS files found, JS dominant (${sourceJsFiles.length} vs ${sourcePythonFiles.length})`);
      // Fall through to JS-based detection below
    } else {
      // Confirm Python repo via setup.py, pyproject.toml, requirements.txt, or sheer file count
      const hasPythonSignal = structure.some(f =>
        f.name === 'setup.py' || f.name === 'pyproject.toml' ||
        f.name === 'requirements.txt' || f.name === 'Pipfile' ||
        f.name === 'setup.cfg' || f.name === 'manage.py'
      );
      if (hasPythonSignal || sourcePythonFiles.length >= 3) {
        console.log(`  [detectRepoType] → python (${sourcePythonFiles.length} source .py files${hasPythonSignal ? ' + Python project signal' : ''})`);
        return 'python';
      }
    }
  }

  // ── Vue detection (check before JS-based detection) ─────────────────────
  const vueFiles = structure.filter(f => f.type === 'vue');
  const sourceVueFiles = vueFiles.filter(f => !nonSourceDirPattern.test(f.path));
  console.log(`  [detectRepoType] .vue files total: ${vueFiles.length}, in source dirs: ${sourceVueFiles.length}`);

  if (sourceVueFiles.length > 0) {
    console.log(`  [detectRepoType] → vue (${sourceVueFiles.length} source .vue files)`);
    return 'vue';
  }

  // ── Check package.json early so we can detect Next.js before the
  //    generic React check (Next.js repos also have React as a dep).
  let hasReactDep = false;
  let hasNextDep = false;
  let hasVueDep = false;
  let pkgProdDeps = {};
  try {
    const pkgContent = await fetchFileContent(owner, repoName, 'package.json', token);
    if (pkgContent) {
      const pkg = JSON.parse(pkgContent);
      pkgProdDeps = {
        ...(pkg.dependencies || {}),
        ...(pkg.peerDependencies || {}),
      };
      hasReactDep = !!(pkgProdDeps['react'] || pkgProdDeps['react-dom']);
      hasNextDep = !!pkgProdDeps['next'];
      hasVueDep = !!(pkgProdDeps['vue'] || pkgProdDeps['nuxt']);
      console.log(`  [detectRepoType] package.json prod/peer deps keys: ${Object.keys(pkgProdDeps).join(', ')}`);
      console.log(`  [detectRepoType] hasReactDep: ${hasReactDep}, hasNextDep: ${hasNextDep}`);
    } else {
      console.log(`  [detectRepoType] package.json not found or empty`);
    }
  } catch (_e) {
    console.log(`  [detectRepoType] package.json missing or unparseable`);
  }

  // Vue detection via package.json — `vue` or `nuxt` in prod/peer deps.
  if (hasVueDep) {
    console.log(`  [detectRepoType] → vue (vue/nuxt found in prod/peer dependencies)`);
    return 'vue';
  }

  // Next.js detection — `next` in prod/peer deps is the definitive signal.
  // Also look for the conventional `next.config.*` file or `app/`/`pages/` dirs.
  if (hasNextDep) {
    console.log(`  [detectRepoType] → nextjs (next found in prod/peer dependencies)`);
    return 'nextjs';
  }
  const hasNextConfig = structure.some(f => /(?:^|\/)next\.config\.(js|mjs|ts)$/.test(f.path));
  const hasAppOrPagesDir = structure.some(f =>
    /(?:^|\/)(?:app|pages)\//.test(f.path)
  );
  if (hasNextConfig || (hasAppOrPagesDir && hasReactDep)) {
    console.log(`  [detectRepoType] → nextjs (next.config or app/pages dir with React dep)`);
    return 'nextjs';
  }

  // .jsx files are a definitive React indicator — but only in source directories.
  const allJsxFiles = structure.filter(f => f.path.endsWith('.jsx'));
  const sourceJsxFiles = allJsxFiles.filter(f => !nonSourceDirPattern.test(f.path));
  console.log(`  [detectRepoType] .jsx files total: ${allJsxFiles.length}, in source dirs: ${sourceJsxFiles.length}`);
  if (allJsxFiles.length > 0) console.log(`    all: ${allJsxFiles.map(f => f.path).join(', ')}`);
  if (sourceJsxFiles.length > 0) {
    console.log(`  [detectRepoType] → react (source .jsx files found)`);
    return 'react';
  }

  // .tsx files are ambiguous — TS libraries can have .tsx test files without
  // being React apps.  Only count them as React if package.json also lists
  // react as a production or peer dependency (NOT devDependencies — many
  // libraries use React there purely for testing/types).
  const allTsxFiles = structure.filter(f => f.path.endsWith('.tsx'));
  const sourceTsxFiles = allTsxFiles.filter(f => !nonSourceDirPattern.test(f.path));
  const hasTSX = sourceTsxFiles.length > 0;
  console.log(`  [detectRepoType] .tsx files total: ${allTsxFiles.length}, in source dirs: ${sourceTsxFiles.length}`);
  if (allTsxFiles.length > 0) console.log(`    all: ${allTsxFiles.map(f => f.path).join(', ')}`);

  if (hasReactDep) {
    console.log(`  [detectRepoType] → react (React found in prod/peer dependencies)`);
    return 'react';
  }
  // .tsx without react in prod deps → treat as vanilla TS
  if (hasTSX && !hasReactDep) {
    console.log('ℹ️  .tsx files found but no React production dependency — treating as vanilla');
  }

  // Last resort: if only Python files exist with no JS files at all, it's Python
  if (pythonFiles.length > 0 && structure.filter(f => f.type === 'file').length === 0) {
    console.log(`  [detectRepoType] → python (only Python files, no JS/TS)`);
    return 'python';
  }

  console.log(`  [detectRepoType] → vanilla`);
  return 'vanilla';
};

/**
 * Sanitize a string for use as a Merfolk node ID.
 * Replaces characters that conflict with Merfolk/Mermaid syntax (hyphens,
 * dots, spaces) with underscores, and prefixes with `_` if the name starts
 * with a digit.
 * @param {string} name
 * @returns {string}
 */
const sanitizeNodeId = (name) => {
  let safe = name.replace(/[-. ]+/g, '_');
  if (/^\d/.test(safe)) safe = `_${safe}`;
  return safe;
};

/**
 * Traverse a Babel AST for a vanilla JS/TS file.
 * Extracts exported symbols (functions, classes, interfaces, type aliases)
 * and inter-module import relationships.
 *
 * Populates fileFunctions, elements, moduleImportRelationships in-place.
 *
 * @param {Object} ast - Parsed Babel AST
 * @param {string} fileName - Base file name without extension
 * @param {string} filePath - Full relative path in the repo
 * @param {Object} fileContext - Flags from analyzeFile()
 * @param {Object} elements - Shared elements object
 * @param {Object} foundItems - Shared foundItems sets
 * @param {Map} fileFunctions - fileName -> { type, functions: Set }
 * @param {Map} moduleImportRelationships - sourceFile -> Set<importedFileBase>
 * @param {Map} functionCallRelationships - caller -> Set<{target,label,type}>
 */
const traverseVanillaAST = (
  ast,
  fileName,
  filePath,
  fileContext,
  elements,
  foundItems,
  fileFunctions,
  moduleImportRelationships,
  functionCallRelationships
) => {
  // Determine initial container type from folder conventions (same as React rules)
  let containerType = 'utility';
  if (fileContext.isBackend) containerType = 'backend';
  else if (fileContext.isWorker) containerType = 'worker';
  else if (fileContext.isService) containerType = 'service';
  else if (fileContext.isStore) containerType = 'store';
  else if (fileContext.isHook) containerType = 'hook';
  // For unrecognised folders, containerType starts as 'utility' and may upgrade
  // to 'service' if we find class declarations.

  // ── Collect explicitly exported names (first pass) ────────────────────────
  const exportedNames = new Set();

  ast.program.body.forEach((node) => {
    if (node.type === 'ExportNamedDeclaration') {
      if (node.declaration) {
        const d = node.declaration;
        if ((d.type === 'FunctionDeclaration' || d.type === 'ClassDeclaration' ||
             d.type === 'TSInterfaceDeclaration' || d.type === 'TSTypeAliasDeclaration') && d.id) {
          exportedNames.add(d.id.name);
        } else if (d.type === 'VariableDeclaration') {
          d.declarations.forEach((vd) => { if (vd.id?.name) exportedNames.add(vd.id.name); });
        }
      }
      if (node.specifiers) {
        node.specifiers.forEach((s) => { if (s.exported?.name) exportedNames.add(s.exported.name); });
      }
    } else if (node.type === 'ExportDefaultDeclaration') {
      const d = node.declaration;
      if (d?.id?.name) exportedNames.add(d.id.name);
      else if (d?.type === 'Identifier') exportedNames.add(d.name);
      else exportedNames.add(fileName); // anonymous default export
    }
  });

  // If nothing is explicitly exported (e.g. CommonJS / plain script), treat
  // every top-level declaration as public.
  const isExported = exportedNames.size > 0
    ? (name) => exportedNames.has(name)
    : () => true;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const ensureContainer = () => {
    if (!fileFunctions.has(fileName)) {
      fileFunctions.set(fileName, { type: containerType, functions: new Set() });
    }
  };

  const addSymbol = (name, isClass) => {
    if (isClass && containerType === 'utility') {
      // Upgrade the file container type when we encounter a class
      containerType = 'service';
      // Update existing container type if already created
      if (fileFunctions.has(fileName)) fileFunctions.get(fileName).type = containerType;
    }
    ensureContainer();
    fileFunctions.get(fileName).functions.add(name);

    if (isClass) {
      // Emit as [[Class:]] type for proper 3d-ast-generator recognition
      if (!foundItems.classes.has(name)) {
        foundItems.classes.add(name);
        elements.classes.push(name);
      }
    } else {
      if (!foundItems.utilities.has(name)) {
        foundItems.utilities.add(name);
        elements.utilities.push(name);
      }
    }
  };

  // Helper to classify a variable declaration as constant, variable, or function/class.
  // Used by both ExportNamedDeclaration and top-level VariableDeclaration handlers.
  const addVariableDecl = (name, initType, declKind) => {
    if (initType === 'ClassExpression') {
      addSymbol(name, true);
    } else if (initType === 'ArrowFunctionExpression' || initType === 'FunctionExpression') {
      addSymbol(name, false);
    } else if (declKind === 'const') {
      ensureContainer();
      fileFunctions.get(fileName).functions.add(name);
      if (!foundItems.constants.has(name)) {
        foundItems.constants.add(name);
        elements.constants.push(name);
      }
    } else {
      ensureContainer();
      fileFunctions.get(fileName).functions.add(name);
      if (!foundItems.variables.has(name)) {
        foundItems.variables.add(name);
        elements.variables.push(name);
      }
    }
  };

  // ── Helper to track a relative import source as a module relationship ────
  const trackRelativeSource = (source, isReexport = false) => {
    if (!source) return;
    if (!source.startsWith('./') && !source.startsWith('../')) {
      // External (e.g. a library re-exported) — add as library
      if (!elements.imports.libraries.includes(source)) {
        elements.imports.libraries.push(source);
      }
      return;
    }
    const importedBase = sanitizeNodeId(
      source
        .replace(/^(\.\.\/|\.\/)[\/\.]*/, '')
        .replace(/\.(jsx?|tsx?|mjs|cjs)$/, '')
        .split('/')
        .pop()
    );
    if (importedBase && importedBase !== fileName) {
      if (!moduleImportRelationships.has(fileName)) {
        moduleImportRelationships.set(fileName, new Set());
      }
      moduleImportRelationships.get(fileName).add(importedBase);
      // For re-exports (barrel files), ensure the current file gets a
      // container even if it doesn't declare any symbols itself — the
      // container acts as the entry-point module in the diagram.
      if (isReexport) {
        ensureContainer();
      }
    }
  };

  // ── Collect import binding names so we can exclude them from utilities ─────
  // e.g. `import fs from 'fs'` or `const fs = require('fs')` — the local
  // binding `fs` is not a symbol this module exports.
  const importBindings = new Set();
  ast.program.body.forEach((node) => {
    if (node.type === 'ImportDeclaration' && node.specifiers) {
      node.specifiers.forEach((s) => {
        if (s.local?.name) importBindings.add(s.local.name);
      });
    }
    // CommonJS: const x = require('...')
    if (node.type === 'VariableDeclaration') {
      node.declarations.forEach((vd) => {
        if (
          vd.init?.type === 'CallExpression' &&
          vd.init.callee?.name === 'require' &&
          vd.id?.name
        ) {
          importBindings.add(vd.id.name);
        }
      });
    }
  });

  // ── Second pass: process each top-level node ──────────────────────────────
  ast.program.body.forEach((node) => {

    // External / relative imports
    if (node.type === 'ImportDeclaration') {
      trackRelativeSource(node.source.value);
      return;
    }

    // export * from './someModule'  (ExportAllDeclaration)
    // Barrel re-exports — track as module relationships so the diagram
    // shows that this file depends on the re-exported module.
    if (node.type === 'ExportAllDeclaration' && node.source) {
      trackRelativeSource(node.source.value, true);
      return;
    }

    // Top-level function declarations (not wrapped in export)
    if (node.type === 'FunctionDeclaration' && node.id && isExported(node.id.name)) {
      addSymbol(node.id.name, false);
      return;
    }

    // Top-level class declarations (not wrapped in export)
    if (node.type === 'ClassDeclaration' && node.id && isExported(node.id.name)) {
      addSymbol(node.id.name, true);
      return;
    }

    // export { X } from './module' — re-exports with a source but no declaration
    // Track as module relationship + ensure contained file gets a container
    if (node.type === 'ExportNamedDeclaration' && !node.declaration && node.source) {
      trackRelativeSource(node.source.value, true);
      return;
    }

    // export named declaration (with inline declaration)
    if (node.type === 'ExportNamedDeclaration' && node.declaration) {
      const d = node.declaration;
      if (d.type === 'FunctionDeclaration' && d.id) {
        addSymbol(d.id.name, false);
      } else if (d.type === 'ClassDeclaration' && d.id) {
        addSymbol(d.id.name, true);
      } else if (d.type === 'TSInterfaceDeclaration' || d.type === 'TSTypeAliasDeclaration') {
        // Emit TypeScript interfaces/type aliases as [[Interface:]] nodes
        if (d.id && !foundItems.interfaces.has(d.id.name)) {
          foundItems.interfaces.add(d.id.name);
          elements.interfaces.push(d.id.name);
          ensureContainer();
          fileFunctions.get(fileName).functions.add(d.id.name);
        }
      } else if (d.type === 'VariableDeclaration') {
        d.declarations.forEach((vd) => {
          if (!vd.id?.name) return;
          addVariableDecl(vd.id.name, vd.init?.type, d.kind);
        });
      }
      return;
    }

    // export default declaration
    if (node.type === 'ExportDefaultDeclaration') {
      const d = node.declaration;
      if (d?.type === 'FunctionDeclaration' && d.id) addSymbol(d.id.name, false);
      else if (d?.type === 'ClassDeclaration' && d.id) addSymbol(d.id.name, true);
      else if (d?.type === 'ArrowFunctionExpression' || d?.type === 'FunctionExpression') {
        addSymbol(fileName, false); // anonymous default export — use file name
      }
      return;
    }

    // Top-level variable declarations (arrow functions, consts, etc.)
    if (node.type === 'VariableDeclaration') {
      node.declarations.forEach((vd) => {
        if (!vd.id?.name || !isExported(vd.id.name)) return;
        // Skip variables that are just import bindings (require() calls, etc.)
        if (importBindings.has(vd.id.name)) return;
        addVariableDecl(vd.id.name, vd.init?.type, node.kind);
      });
    }
  });
};

/**
 * Traverse a Python source file using regex-based analysis.
 * Extracts classes, top-level functions, and import relationships.
 * Mirrors the output shape of traverseVanillaAST so the same Merfolk
 * markdown generation and layout pipeline can be reused.
 *
 * @param {string} source - Raw Python source code
 * @param {string} fileName - Base file name without extension
 * @param {string} filePath - Full relative path in the repo
 * @param {Object} fileContext - Flags from analyzeFile()
 * @param {Object} elements - Shared elements object
 * @param {Object} foundItems - Shared foundItems sets
 * @param {Map} fileFunctions - fileName -> { type, functions: Set }
 * @param {Map} moduleImportRelationships - sourceFile -> Set<importedFileBase>
 * @param {Map} functionCallRelationships - caller -> Set<{target,label,type}>
 */
const traversePythonSource = (
  source,
  fileName,
  filePath,
  fileContext,
  elements,
  foundItems,
  fileFunctions,
  moduleImportRelationships,
  functionCallRelationships
) => {
  // Determine container type from folder conventions
  let containerType = 'utility';
  if (fileContext.isBackend || fileContext.isController || fileContext.isView) containerType = 'backend';
  else if (fileContext.isService) containerType = 'service';
  else if (fileContext.isModel) containerType = 'service'; // models are service-like (data layer)
  else if (fileContext.isStore) containerType = 'store';
  else if (fileContext.isMiddleware) containerType = 'service';
  else if (fileContext.isSerializer) containerType = 'service';
  else if (fileContext.isTask) containerType = 'worker';
  else if (fileContext.isWorker) containerType = 'worker';
  else if (fileContext.isMigration) containerType = 'utility';
  else if (fileContext.isConfig) containerType = 'utility';
  else if (fileContext.isUtil) containerType = 'utility';

  const ensureContainer = () => {
    if (!fileFunctions.has(fileName)) {
      fileFunctions.set(fileName, { type: containerType, functions: new Set() });
    }
  };

  const addSymbol = (name, isClass) => {
    if (isClass && containerType === 'utility') {
      containerType = 'service';
      if (fileFunctions.has(fileName)) fileFunctions.get(fileName).type = containerType;
    }
    ensureContainer();
    fileFunctions.get(fileName).functions.add(name);

    if (isClass) {
      if (containerType === 'backend' || containerType === 'service') {
        if (!foundItems.services.has(name)) {
          foundItems.services.add(name);
          elements.services.push(name);
        }
      } else {
        if (!foundItems.utilities.has(name)) {
          foundItems.utilities.add(name);
          elements.utilities.push(name);
        }
      }
    } else {
      if (!foundItems.utilities.has(name)) {
        foundItems.utilities.add(name);
        elements.utilities.push(name);
      }
    }
  };

  // Split source into lines for analysis
  const lines = source.split('\n');

  // Track names defined in this file to avoid adding import bindings as symbols
  const localNames = new Set();

  // ── Extract imports ───────────────────────────────────────────────────────
  // Patterns: `import module`, `from module import ...`, `from .relative import ...`
  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (trimmed.startsWith('#') || trimmed === '') continue;

    // `from .relative import Something` or `from ..package.module import Something`
    const relativeFromMatch = trimmed.match(/^from\s+(\.+[\w.]*)(?:\s+import\s+.+)?/);
    if (relativeFromMatch) {
      const relSource = relativeFromMatch[1];
      // Convert Python relative import to a module name
      // `from .models import User` → track 'models' as a module relationship
      const parts = relSource.replace(/^\.+/, '').split('.');
      const importedBase = parts[parts.length - 1];
      if (importedBase && importedBase !== fileName) {
        const sanitized = sanitizeNodeId(importedBase);
        if (!moduleImportRelationships.has(fileName)) {
          moduleImportRelationships.set(fileName, new Set());
        }
        moduleImportRelationships.get(fileName).add(sanitized);
      }
      continue;
    }

    // `from package.module import Something` (absolute import from within the project)
    const absFromMatch = trimmed.match(/^from\s+([\w.]+)\s+import\s+(.+)/);
    if (absFromMatch) {
      const modulePath = absFromMatch[1];
      // Standard library / external packages are typically single words or known prefixes
      // We track multi-part imports as potential internal module relationships
      const parts = modulePath.split('.');
      if (parts.length > 1) {
        // Could be internal (e.g. `from myapp.models import User`)
        const importedBase = sanitizeNodeId(parts[parts.length - 1]);
        if (importedBase && importedBase !== fileName) {
          if (!moduleImportRelationships.has(fileName)) {
            moduleImportRelationships.set(fileName, new Set());
          }
          moduleImportRelationships.get(fileName).add(importedBase);
        }
      } else {
        // Single-word package → treat as external library
        const libName = parts[0];
        if (!elements.imports.libraries.includes(libName)) {
          elements.imports.libraries.push(libName);
        }
      }

      // Track imported names as bindings (not local symbols)
      const importedNames = absFromMatch[2].split(',').map(n => n.trim().split(/\s+as\s+/).pop().trim());
      importedNames.forEach(n => { if (n && n !== '*') localNames.add(n); });
      continue;
    }

    // `import module` or `import module as alias`
    const importMatch = trimmed.match(/^import\s+([\w.]+)(?:\s+as\s+(\w+))?/);
    if (importMatch) {
      const modulePath = importMatch[1];
      const alias = importMatch[2] || modulePath.split('.')[0];
      localNames.add(alias);

      if (!modulePath.includes('.')) {
        // Single-word → external library
        if (!elements.imports.libraries.includes(modulePath)) {
          elements.imports.libraries.push(modulePath);
        }
      } else {
        // Multi-part → potential internal module
        const parts = modulePath.split('.');
        const importedBase = sanitizeNodeId(parts[parts.length - 1]);
        if (importedBase && importedBase !== fileName) {
          if (!moduleImportRelationships.has(fileName)) {
            moduleImportRelationships.set(fileName, new Set());
          }
          moduleImportRelationships.get(fileName).add(importedBase);
        }
      }
      continue;
    }
  }

  // ── Extract top-level classes ─────────────────────────────────────────────
  // Pattern: `class ClassName(Base):` or `class ClassName:` at zero indentation
  const classPattern = /^class\s+(\w+)\s*[\(:]?/gm;
  let classMatch;
  while ((classMatch = classPattern.exec(source)) !== null) {
    // Verify it's at the top level (starts at column 0)
    const lineStart = source.lastIndexOf('\n', classMatch.index) + 1;
    const indent = classMatch.index - lineStart;
    if (indent === 0) {
      const className = classMatch[1];
      // Skip private/internal classes (leading underscore convention)
      if (!className.startsWith('_') || className.startsWith('__')) {
        addSymbol(sanitizeNodeId(className), true);
      }
    }
  }

  // ── Extract top-level functions ───────────────────────────────────────────
  // Pattern: `def function_name(...)` or `async def function_name(...)` at zero indentation
  const funcPattern = /^(?:async\s+)?def\s+(\w+)\s*\(/gm;
  let funcMatch;
  while ((funcMatch = funcPattern.exec(source)) !== null) {
    const lineStart = source.lastIndexOf('\n', funcMatch.index) + 1;
    const indent = funcMatch.index - lineStart;
    if (indent === 0) {
      const funcName = funcMatch[1];
      // Skip private/dunder functions (except __init__.py entry points)
      if (funcName.startsWith('_') && !funcName.startsWith('__')) continue;
      if (funcName.startsWith('__') && funcName.endsWith('__')) continue; // dunder methods shouldn't appear at top level, but skip just in case
      // Skip names that are just import bindings
      if (localNames.has(funcName)) continue;
      addSymbol(sanitizeNodeId(funcName), false);
    }
  }

  // If file is an __init__.py and no symbols were found, still ensure a container
  // exists so the package appears in the diagram
  if (fileName === '__init__' || fileName === 'init') {
    // Skip __init__.py files — they are package markers, not meaningful modules
    return;
  }

  // If the file is manage.py or similar entry-points, ensure it has a container
  if (filePath.endsWith('manage.py') || filePath.endsWith('wsgi.py') || filePath.endsWith('asgi.py')) {
    ensureContainer();
  }
};

/**
 * Traverse a Vue single-file component (.vue) or a plain JS/TS file from a
 * Vue repo.  For .vue files the <script> block is extracted and parsed with
 * Babel; the <template> block is scanned via regex for child component usage.
 * Plain JS/TS files (composables, store modules, utilities) are parsed with
 * Babel using the vanilla-style file-as-module approach.
 *
 * Populates fileFunctions, elements, moduleImportRelationships, and the
 * component relationship maps in-place.
 *
 * @param {string} source        - Raw file content
 * @param {string} fileName      - Base file name without extension
 * @param {string} filePath      - Full relative path in the repo
 * @param {Object} fileContext    - Flags from analyzeFile()
 * @param {boolean} isVueFile    - true when the file has a .vue extension
 * @param {Object} elements      - Shared elements object
 * @param {Object} foundItems    - Shared foundItems sets
 * @param {Map}    fileFunctions  - fileName -> { type, functions: Set }
 * @param {Map}    moduleImportRelationships - sourceFile -> Set<importedFileBase>
 * @param {Map}    functionCallRelationships - caller -> Set<{target,label,type}>
 * @param {Map}    componentRelationships    - component -> Set<usedComponent>
 * @param {Map}    componentDependencies     - component -> { hooks, services, stores, utilities }
 * @param {Function} parseFn     - Babel parse function
 */
const traverseVueSource = (
  source,
  fileName,
  filePath,
  fileContext,
  isVueFile,
  elements,
  foundItems,
  fileFunctions,
  moduleImportRelationships,
  functionCallRelationships,
  componentRelationships,
  componentDependencies,
  parseFn
) => {
  // ── Determine the container type from folder conventions ──────────────
  let containerType = 'utility';
  if (fileContext.isBackend)                          containerType = 'service';
  else if (fileContext.isService || fileContext.isRouter) containerType = 'service';
  else if (fileContext.isStore)                        containerType = 'store';
  else if (fileContext.isHook || fileContext.isComposable) containerType = 'hook';
  else if (fileContext.isUtil)                         containerType = 'utility';
  else if (fileContext.isPlugin || fileContext.isDirective || fileContext.isMixin) containerType = 'utility';
  else if (fileContext.isWorker)                       containerType = 'utility';

  // ── For .vue SFCs, extract blocks ────────────────────────────────────
  let scriptContent = source; // default: treat entire source as script (for .js/.ts files)
  let templateContent = '';
  let isScriptSetup = false;
  const componentName = fileName.replace(/^./, c => c.toUpperCase()); // PascalCase the filename

  if (isVueFile) {
    // Extract <script> or <script setup> block
    const scriptMatch = source.match(/<script\b([^>]*)>([\s\S]*?)<\/script>/i);
    if (scriptMatch) {
      const attrs = scriptMatch[1];
      scriptContent = scriptMatch[2].trim();
      isScriptSetup = /\bsetup\b/.test(attrs);
    } else {
      scriptContent = '';
    }

    // Extract <template> block for component usage scanning
    const templateMatch = source.match(/<template\b[^>]*>([\s\S]*?)<\/template>/i);
    if (templateMatch) {
      templateContent = templateMatch[1];
    }

    // Register this .vue file as a component (dodecahedron)
    if (!foundItems.components.has(componentName)) {
      foundItems.components.add(componentName);
      elements.components.push(componentName);
    }
  }

  // ── Helper: resolve an import source to a sanitised base name ─────────
  const trackRelativeSource = (importSource) => {
    if (!importSource.startsWith('.') && !importSource.startsWith('/')) return;
    const parts = importSource.split('/');
    let base = parts[parts.length - 1];
    if (base === 'index' || base === '') base = parts[parts.length - 2] || base;
    base = base.replace(/\.(vue|jsx?|tsx?)$/, '');
    const sanitised = sanitizeNodeId(base);
    if (!moduleImportRelationships.has(fileName)) {
      moduleImportRelationships.set(fileName, new Set());
    }
    moduleImportRelationships.get(fileName).add(sanitised);
  };

  const ensureContainer = () => {
    if (!fileFunctions.has(fileName)) {
      fileFunctions.set(fileName, { type: containerType, functions: new Set() });
    }
  };

  const addSymbol = (name, isClass) => {
    const safe = sanitizeNodeId(name);
    ensureContainer();
    fileFunctions.get(fileName).functions.add(safe);
    // Determine which element category to put it in
    if (fileContext.isStore) {
      if (!foundItems.stores.has(safe)) { foundItems.stores.add(safe); elements.stores.push(safe); }
    } else if (fileContext.isHook || fileContext.isComposable) {
      if (!foundItems.hooks.has(safe)) { foundItems.hooks.add(safe); elements.hooks.push(safe); }
    } else if (fileContext.isService || fileContext.isBackend || fileContext.isRouter || isClass) {
      if (!foundItems.services.has(safe)) { foundItems.services.add(safe); elements.services.push(safe); }
    } else {
      if (!foundItems.utilities.has(safe)) { foundItems.utilities.add(safe); elements.utilities.push(safe); }
    }
  };

  // ── Parse script content with Babel ──────────────────────────────────
  if (scriptContent) {
    try {
      const ast = parseFn(scriptContent, {
        sourceType: 'module',
        plugins: [
          'typescript',
          'decorators-legacy',
          'classProperties',
          'optionalChaining',
          'nullishCoalescingOperator',
          'dynamicImport',
          'objectRestSpread',
          'topLevelAwait',
        ],
        errorRecovery: true,
        allowImportExportEverywhere: true,
      });

      const importBindings = new Set();

      ast.program.body.forEach((node) => {
        // ── Import declarations ─────────────────────────────────────────
        if (node.type === 'ImportDeclaration') {
          const src = node.source.value;
          trackRelativeSource(src);

          // Track library imports
          if (!src.startsWith('.') && !src.startsWith('/')) {
            if (!elements.imports.libraries.includes(src)) {
              elements.imports.libraries.push(src);
            }
          }

          // Collect import binding names
          (node.specifiers || []).forEach(spec => {
            const localName = spec.local?.name;
            if (localName) importBindings.add(localName);

            // Track dependency type for .vue component files
            if (isVueFile && localName) {
              if (src.includes('/store') || src.includes('pinia') || src.includes('vuex')) {
                if (!componentDependencies.has(componentName)) {
                  componentDependencies.set(componentName, { hooks: [], services: [], stores: [], utilities: [] });
                }
                componentDependencies.get(componentName).stores.push(localName);
              } else if (src.includes('/composable') || /^use[A-Z]/.test(localName)) {
                if (!componentDependencies.has(componentName)) {
                  componentDependencies.set(componentName, { hooks: [], services: [], stores: [], utilities: [] });
                }
                componentDependencies.get(componentName).hooks.push(localName);
              } else if (src.includes('/service') || src.includes('/api')) {
                if (!componentDependencies.has(componentName)) {
                  componentDependencies.set(componentName, { hooks: [], services: [], stores: [], utilities: [] });
                }
                componentDependencies.get(componentName).services.push(localName);
              }
            }
          });
          return;
        }

        // For non-.vue files (composable, store, utility, service), extract exported symbols
        if (!isVueFile) {
          // Named export
          if (node.type === 'ExportNamedDeclaration') {
            if (node.declaration) {
              const decl = node.declaration;
              if (decl.type === 'FunctionDeclaration' && decl.id) {
                addSymbol(decl.id.name, false);
              } else if (decl.type === 'ClassDeclaration' && decl.id) {
                addSymbol(decl.id.name, true);
              } else if (decl.type === 'VariableDeclaration') {
                decl.declarations.forEach(d => {
                  if (d.id?.name && !importBindings.has(d.id.name)) {
                    addSymbol(d.id.name, false);
                  }
                });
              }
            }
            // Re-export: export { x } from './module'
            if (node.source) {
              trackRelativeSource(node.source.value);
            }
            return;
          }
          // Default export
          if (node.type === 'ExportDefaultDeclaration') {
            const decl = node.declaration;
            if (decl.type === 'FunctionDeclaration' && decl.id) {
              addSymbol(decl.id.name, false);
            } else if (decl.type === 'ClassDeclaration' && decl.id) {
              addSymbol(decl.id.name, true);
            } else if (decl.type === 'Identifier' && !importBindings.has(decl.name)) {
              addSymbol(decl.name, false);
            }
            return;
          }
        }

        // For <script setup> files, all top-level declarations are public
        if (isVueFile && isScriptSetup) {
          if (node.type === 'VariableDeclaration') {
            node.declarations.forEach(d => {
              if (d.id?.name && !importBindings.has(d.id.name)) {
                // Track function calls as relationships
                if (d.init?.type === 'CallExpression') {
                  const callee = d.init.callee;
                  const calleeName = callee?.name || callee?.property?.name;
                  if (calleeName && !importBindings.has(d.id.name)) {
                    if (!functionCallRelationships.has(componentName)) {
                      functionCallRelationships.set(componentName, new Set());
                    }
                    functionCallRelationships.get(componentName).add({
                      target: sanitizeNodeId(calleeName),
                      label: d.id.name,
                      type: 'utility',
                    });
                  }
                }
              }
            });
          } else if (node.type === 'FunctionDeclaration' && node.id) {
            // Internal helper function in <script setup> — add to component functions
            // but don't add as a top-level element
          }
        }
      });
    } catch (parseError) {
      console.warn(`\u26A0\uFE0F  Failed to parse script in Vue file ${filePath}:`, parseError?.message || parseError);
    }
  }

  // ── Scan <template> for child component usage ────────────────────────
  if (isVueFile && templateContent) {
    // Match PascalCase tags: <MyComponent ... > or <MyComponent />
    const pascalPattern = /<([A-Z][a-zA-Z0-9]+)[\s/>]/g;
    let tagMatch;
    while ((tagMatch = pascalPattern.exec(templateContent)) !== null) {
      const usedComp = tagMatch[1];
      if (usedComp !== componentName) {
        if (!componentRelationships.has(componentName)) {
          componentRelationships.set(componentName, new Set());
        }
        componentRelationships.get(componentName).add(usedComp);
      }
    }
    // Match kebab-case tags that look like components (contain a hyphen): <my-component>
    const kebabPattern = /<([a-z][a-z0-9]*(?:-[a-z0-9]+)+)[\s/>]/g;
    while ((tagMatch = kebabPattern.exec(templateContent)) !== null) {
      // Convert kebab-case to PascalCase
      const pascal = tagMatch[1].split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
      if (pascal !== componentName) {
        if (!componentRelationships.has(componentName)) {
          componentRelationships.set(componentName, new Set());
        }
        componentRelationships.get(componentName).add(pascal);
      }
    }
  }

  // For non-.vue files, ensure the file container exists if we found nothing
  // (e.g. a utility file with only side effects)
  if (!isVueFile && !fileFunctions.has(fileName)) {
    // Only create a container if the file likely has meaningful exports
    // Skip empty or config-only files
  }
};

/**
 * Generate Merfolk markdown from an entire repository
 * @param {string} owner - Repository owner
 * @param {string} repoName - Repository name
 * @returns {Promise<string>} - Merfolk markdown content
 */
export const generateMerfolkFromRepository = async (owner, repoName, options = {}) => {
  try {
    const token = localStorage.getItem('github_token');
    if (!token) {
      throw new Error('GitHub token not found');
    }

    // When a pre-filtered file list is provided (e.g. from Compare API during
    // rescan), skip the expensive recursive structure fetch entirely.
    let structure;
    if (options.preFilteredFiles) {
      structure = options.preFilteredFiles;
      console.log(`📁 Using pre-filtered file list: ${structure.length} files`);
    } else {
      // Fetch entire repository structure
      structure = await fetchRepositoryStructure(owner, repoName, token);
    }

    // Log structure breakdown
    const shaderFiles = structure.filter(f => f.type === 'shader');
    const jsFiles = structure.filter(f => f.type === 'file');
    const pythonFiles = structure.filter(f => f.type === 'python');
    const vueFiles = structure.filter(f => f.type === 'vue');
    const workerJsFiles = jsFiles.filter(f => /(?:^|\/)workers\//.test(f.path));
    console.log(`📁 Repository structure: ${structure.length} total files`);
    console.log(`   JS/TS files: ${jsFiles.length}, Python files: ${pythonFiles.length}, Vue files: ${vueFiles.length}, Shader files: ${shaderFiles.length}, Worker JS files: ${workerJsFiles.length}`);
    if (shaderFiles.length > 0) console.log(`   Shaders:`, shaderFiles.map(f => f.path));
    if (workerJsFiles.length > 0) console.log(`   Workers:`, workerJsFiles.map(f => f.path));
    if (pythonFiles.length > 0) console.log(`   Python:`, pythonFiles.slice(0, 20).map(f => f.path));
    if (vueFiles.length > 0) console.log(`   Vue:`, vueFiles.slice(0, 20).map(f => f.path));

    // Use caller-provided repo type during rescan (avoids misdetection from a
    // tiny changed-file list). Full scans detect automatically.
    const repoType = options.repoType || await detectRepoType(owner, repoName, token, structure);
    console.log(`🔍 Detected repo type: ${repoType}`);

    // For vanilla/python repos, filter out example/test/debug directories that would
    // pollute the diagram with demo scripts and local variables.  React repos
    // keep these because components in examples can still be meaningful.
    const nonSourceDirPattern = /(?:^|\/)(?:examples?|demos?|samples?|tests?|__tests__|__mocks__|e2e|cypress|fixtures?|stories|storybook|migrations?|alembic|__pycache__)\//i;
    const nonSourceFilePattern = /(?:^|\/)(?:debug[\-_]|test[\-_])/i;
    const filesToProcess = (repoType === 'vanilla' || repoType === 'python' || repoType === 'vue')
      ? structure.filter(f => !nonSourceDirPattern.test(f.path) && !nonSourceFilePattern.test(f.name))
      : structure;
    if (filesToProcess.length !== structure.length) {
      console.log(`   Filtered ${structure.length - filesToProcess.length} non-source files for ${repoType} repo (${filesToProcess.length} remaining)`);
    }

    // Define structure to hold ALL found elements across entire repo
    const elements = {
      components: [],
      functions: [],
      hooks: [],
      services: [],
      stores: [],
      utilities: [],
      classes: [],
      interfaces: [],
      variables: [],
      constants: [],
      imports: {
        libraries: [],
      },
    };

    // Track what we've already found to avoid duplicates
    const foundItems = {
      components: new Set(),
      functions: new Set(),
      hooks: new Set(),
      services: new Set(),
      stores: new Set(),
      utilities: new Set(),
      classes: new Set(),
      interfaces: new Set(),
      variables: new Set(),
      constants: new Set(),
    };

    // Track component-function relationships for "contains" connections
    const componentFunctions = new Map();

    // Track component-to-component relationships (which components use which other components)
    const componentRelationships = new Map();

    // Track component-to-hook/service/store relationships
    const componentDependencies = new Map();

    // Track internal helper components (components defined inside other components)
    // Maps: parentComponentFileName -> { parent: mainComponentName, helpers: Set of internal component names }
    const internalComponents = new Map();

    // Track which components are exported as default from their files
    const exportedComponents = new Map(); // Maps: fileName -> exported component name

    // Track file-function relationships for hooks/services/utilities/stores
    // Maps: fileName -> Set of function/hook/service names in that file
    const fileFunctions = new Map(); // Track which file each function belongs to

    // Track internal hooks (hooks that share the same name as their parent component/hook file)
    // Maps: hookName -> { parent: parentName, parentType: 'component' | 'hook' }
    const internalHooks = new Map();

    // Track which files need _file suffix due to name collision with internal hook
    const filesNeedingSuffix = new Set();

    // NEW: Track detailed function call relationships
    // Maps: componentName -> Set of { target: functionName, label: descriptive label, type: 'service'|'utility'|'hook' }
    const functionCallRelationships = new Map();

    // NEW: Track props being passed between components
    // Maps: componentName -> Map of childComponentName -> Set of prop names
    const componentPropsRelationships = new Map();

    // NEW: Track store state/action usage
    // Maps: componentName -> Set of { store: storeName, properties: Set of property names, actions: Set of action names }
    const storeUsageRelationships = new Map();

    // NEW: Track hook return value destructuring
    // Maps: componentName -> Set of { hook: hookName, returnValues: Set of destructured variable names }
    const hookReturnValueRelationships = new Map();

    // For vanilla JS/TS repos: track inter-module import relationships.
    // Maps: sourceFileName -> Set<importedFileBaseName>
    const moduleImportRelationships = new Map();

    // For Next.js repos: track route files and their hierarchy.
    // Maps: sanitizedFileName -> { segment, routePath, parentRoutePath, isLayout, isPage, isLoading, isError, isApi, filePath }
    const nextjsRouteMap = new Map();

    // NEW: Track API endpoints and their handler chains
    // Maps: endpointKey -> { method, path, handlers: string[], sourceFile: string }
    const apiEndpoints = new Map();

    // NEW: Track database model/collection definitions and relationships
    // Maps: collectionName -> Set<relatedCollectionName>
    const dbModels = new Map();

    // NEW: Track auth guards/middleware
    // Set of guard names found across all files
    const authGuards = new Set();
    // Array of { source, target, label } auth flow relationships
    const authFlows = [];

    // NEW: Track event emitters and listeners
    // Maps: eventName -> Set<sourceFile/component> (emitters)
    const eventEmitters = new Map();
    // Maps: eventName -> Set<sourceFile/component> (listeners)
    const eventListeners = new Map();

    // NEW: Track error boundaries
    // Set of error boundary class/component names
    const errorBoundaries = new Set();
    // Set of Suspense boundary usage locations
    const suspenseBoundaries = new Set();
    // Array of { boundary, wraps, label } containment relationships
    const errorContainment = [];

    // NEW: Track shared TypeScript interfaces and type aliases
    // Maps: interfaceName -> sourceFile
    const sharedInterfaces = new Map();
    // Maps: consumer (component/file) -> Set<interfaceName>
    const interfaceUsages = new Map();

    // Process files in parallel batches for better performance
    const BATCH_SIZE = 10; // Process 10 files at a time
    const batches = [];
    for (let i = 0; i < filesToProcess.length; i += BATCH_SIZE) {
      batches.push(filesToProcess.slice(i, i + BATCH_SIZE));
    }

    for (const batch of batches) {
      // Process all files in this batch in parallel
      await Promise.all(
        batch.map(async (file) => {
          const fileContent = await fetchFileContent(owner, repoName, file.path, token);
          if (!fileContent) {
            return;
          }

          const fileContext = analyzeFile(file.path, repoType);

          // Extract file name without extension for file-level tracking
          // Sanitize to remove hyphens/dots that break Merfolk node-ID syntax
          const fileName = sanitizeNodeId(
            file.path.split('/').pop().replace(/\.(jsx?|tsx?|py|vue|glsl|wgsl|hlsl|vert|frag|comp)$/, '')
          );

          // ── Next.js route tracking ────────────────────────────────────────
          // For Next.js repos, track which files are route files (pages,
          // layouts, loading, error) so we can build a routing hierarchy.
          if (fileContext.isNextRoute) {
            const rawBase = file.path.split('/').pop().replace(/\.(jsx?|tsx?)$/, '');
            const isLayout  = /^layout$/i.test(rawBase);
            const isPage    = /^page$/i.test(rawBase) || /^index$/i.test(rawBase);
            const isLoading = /^loading$/i.test(rawBase);
            const isError   = /^error$/i.test(rawBase);
            const isNotFound = /^not[_-]found$/i.test(rawBase);
            // Next.js special files: _app, _document (Pages Router)
            const isAppShell = /^_app$/i.test(rawBase);
            const isDocument = /^_document$/i.test(rawBase);
            const isMiddleware = /^middleware$/i.test(rawBase);
            // API route files inside app/api/ or pages/api/
            const isApi = /(?:^|\/)api\//.test(file.path);

            // Build the route path: strip the router root (app/ or pages/ or src/app/ etc.)
            // and remove the file name to get the directory-based route.
            const pathWithoutFile = file.path.replace(/\/[^/]+$/, ''); // strip filename
            const routePath = pathWithoutFile
              .replace(/^(?:src\/)?(?:app|pages)\/?/, ''); // strip router root
            // Parent route = one directory up (empty string for root)
            const parentRoutePath = routePath.includes('/')
              ? routePath.substring(0, routePath.lastIndexOf('/'))
              : '';

            // Determine a human-readable segment name for the node label
            let segment = routePath ? routePath.split('/').pop() : '/';
            if (isApi) segment = `api/${segment === '/' ? '' : segment}`;

            nextjsRouteMap.set(fileName, {
              segment,
              routePath,
              parentRoutePath,
              isLayout,
              isPage,
              isLoading,
              isError,
              isNotFound,
              isAppShell,
              isDocument,
              isMiddleware,
              isApi,
              filePath: file.path,
            });
          }

          // Handle shader files — they can't be parsed as JS ASTs,
          // so we add them directly as utility nodes under a shader file container.
          if (file.type === 'shader' || fileContext.isShader) {
            const shaderName = file.path.split('/').pop(); // Keep full filename with extension
            const shaderNodeName = shaderName.replace(/\./g, '_'); // Sanitise dots for node IDs
            if (!foundItems.utilities.has(shaderNodeName)) {
              foundItems.utilities.add(shaderNodeName);
              elements.utilities.push(shaderNodeName);
            }
            // Group under a "shaders" file container
            const shaderContainerName = 'shaders';
            if (!fileFunctions.has(shaderContainerName)) {
              fileFunctions.set(shaderContainerName, { type: 'utility', functions: new Set() });
            }
            fileFunctions.get(shaderContainerName).functions.add(shaderNodeName);
            return; // Skip AST parsing for shader files
          }

          // Handle Python files — use regex-based analysis instead of Babel
          if (file.type === 'python') {
            try {
              traversePythonSource(
                fileContent,
                fileName,
                file.path,
                fileContext,
                elements,
                foundItems,
                fileFunctions,
                moduleImportRelationships,
                functionCallRelationships
              );
            } catch (pyError) {
              console.warn(`⚠️  Failed to parse Python file ${file.path}:`, pyError?.message || pyError);
            }
            return; // Skip Babel AST parsing for Python files
          }

          // Handle Vue repos — .vue SFCs and plain JS/TS companion files
          if (repoType === 'vue') {
            try {
              traverseVueSource(
                fileContent,
                fileName,
                file.path,
                fileContext,
                file.type === 'vue',
                elements,
                foundItems,
                fileFunctions,
                moduleImportRelationships,
                functionCallRelationships,
                componentRelationships,
                componentDependencies,
                parse
              );
            } catch (vueError) {
              console.warn(`⚠️  Failed to parse Vue file ${file.path}:`, vueError?.message || vueError);
            }
            return;
          }

          try {
            // Parse the file content into an AST with lenient settings
            const ast = parse(fileContent, {
              sourceType: 'module',
              plugins: [
                'jsx',
                'typescript',
                'decorators-legacy',
                'classProperties',
                'classPrivateProperties',
                'classPrivateMethods',
                'exportDefaultFrom',
                'exportNamespaceFrom',
                'dynamicImport',
                'nullishCoalescingOperator',
                'optionalChaining',
                'objectRestSpread',
                'asyncGenerators',
                'functionBind',
                'functionSent',
                'numericSeparator',
                'optionalCatchBinding',
                'throwExpressions',
                'topLevelAwait',
              ],
              errorRecovery: true,
              allowImportExportEverywhere: true,
              allowAwaitOutsideFunction: true,
              allowReturnOutsideFunction: true,
              allowSuperOutsideMethod: true,
              allowUndeclaredExports: true,
            });

            // ── Vanilla JS/TS path ────────────────────────────────────────────
            // For vanilla repos, use the file-as-module traversal and skip all
            // the React-specific component / hook / store detection below.
            if (repoType === 'vanilla') {
              traverseVanillaAST(
                ast,
                fileName,
                file.path,
                fileContext,
                elements,
                foundItems,
                fileFunctions,
                moduleImportRelationships,
                functionCallRelationships
              );
              return; // skip React traversal for this file
            }
            // ── React / framework path ────────────────────────────────────────

            let currentComponent = null;
            // Functions encountered in a component file before the first component declaration
            // are deferred here and retroactively assigned to componentFunctions once the
            // component is found, so they receive proper containment arrows.
            const prePendingFunctions = [];
            const fileImports = {
              stores: [],
              services: [],
              hooks: [],
              utilities: [],
            };

            // Track all components found in this file for internal component detection
            const fileComponents = [];

            // Recursive function to traverse the AST
            const traverse = (node, parentIsComponent = false) => {
              if (!node || typeof node !== 'object') return;

              // Track export default declarations to identify the main component
              if (node.type === 'ExportDefaultDeclaration') {
                let exportedName = null;
                if (node.declaration?.type === 'Identifier') {
                  exportedName = node.declaration.name;
                } else if (node.declaration?.type === 'FunctionDeclaration' && node.declaration.id) {
                  exportedName = node.declaration.id.name;
                } else if (node.declaration?.type === 'CallExpression') {
                  // Handle React.memo(Component) or similar
                  if (
                    node.declaration.arguments &&
                    node.declaration.arguments[0]?.type === 'Identifier'
                  ) {
                    exportedName = node.declaration.arguments[0].name;
                  }
                }
                if (exportedName && fileContext.isComponent) {
                  exportedComponents.set(fileName, exportedName);
                }
              }

              // Check for import declarations to find external libraries
              if (node.type === 'ImportDeclaration') {
                const source = node.source.value;
                // Only track external library imports (not relative paths)
                if (!source.startsWith('./') && !source.startsWith('../')) {
                  if (!elements.imports.libraries.includes(source)) {
                    elements.imports.libraries.push(source);
                  }
                }
                // Track imports from stores, services, hooks, utilities, and components for later association
                else if (node.specifiers) {
                  node.specifiers.forEach((spec) => {
                    if (spec.imported || spec.local) {
                      const importedName = spec.imported?.name || spec.local?.name;

                      // Check if it's from stores
                      if (source.includes('/stores/') || source.includes('/stores')) {
                        fileImports.stores.push(importedName);
                      }
                      // Check if it's from services
                      else if (source.includes('/services/') || source.includes('/services')) {
                        fileImports.services.push(importedName);
                      }
                      // Check if it's from hooks
                      else if (source.includes('/hooks/') || source.includes('/hooks')) {
                        fileImports.hooks.push(importedName);
                      }
                      // Check if it's from utils/helpers
                      else if (source.includes('/utils/') || source.includes('/utils') || 
                               source.includes('/helpers/') || source.includes('/helpers')) {
                        if (!fileImports.utilities) {
                          fileImports.utilities = [];
                        }
                        fileImports.utilities.push(importedName);
                      }
                      // Track component imports (from components folder or uppercase name)
                      else if (source.includes('/components/') || source.includes('/components') ||
                               /^[A-Z]/.test(importedName)) {
                        if (!fileImports.components) {
                          fileImports.components = [];
                        }
                        fileImports.components.push(importedName);
                      }
                    }
                  });
                }
              }

              // Check for function declarations
              if (node.type === 'FunctionDeclaration' && node.id) {
                const funcName = node.id.name;

                // Check if this looks like a React component (uppercase first letter)
                const looksLikeComponent = /^[A-Z]/.test(funcName);

                // Categorize based on file context, naming, AND JSX usage
                if (
                  looksLikeComponent &&
                  !funcName.startsWith('use') &&
                  fileContext.isComponent &&
                  containsJSX(node.body, fileContext)
                ) {
                  // Only treat as component if it's in a component file AND returns JSX
                  if (!foundItems.components.has(funcName)) {
                    foundItems.components.add(funcName);
                    elements.components.push(funcName);

                    // Track all components found in this file
                    fileComponents.push(funcName);

                    // Set current component if not set
                    if (!currentComponent) {
                      currentComponent = funcName;
                    }
                    componentFunctions.set(funcName, new Set());
                    // Retroactively assign any module-level helpers encountered before
                    // this component declaration so they get containment arrows
                    if (prePendingFunctions.length > 0) {
                      prePendingFunctions.forEach((fn) => componentFunctions.get(funcName).add(fn));
                      prePendingFunctions.length = 0;
                    }

                    // Associate file imports with this component
                    if (!componentDependencies.has(funcName)) {
                      componentDependencies.set(funcName, new Set());
                    }
                    fileImports.stores.forEach((store) =>
                      componentDependencies.get(funcName).add({ name: store, type: 'store' })
                    );
                    fileImports.services.forEach((service) =>
                      componentDependencies.get(funcName).add({ name: service, type: 'service' })
                    );
                    fileImports.hooks.forEach((hook) =>
                      componentDependencies.get(funcName).add({ name: hook, type: 'hook' })
                    );
                    fileImports.utilities.forEach((utility) =>
                      componentDependencies.get(funcName).add({ name: utility, type: 'utility' })
                    );
                  }
                  // Traverse function body with component context
                  if (node.body) {
                    traverse(node.body, true);
                  }
                } else if (funcName.startsWith('use') && !fileContext.isStore) {
                  // Hooks: must start with 'use' (React convention)
                  // Functions in /hooks/ folder that don't start with 'use' are utilities, not hooks
                  // Exception: hooks in store files should be utilities inside the store container
                  if (!foundItems.hooks.has(funcName)) {
                    foundItems.hooks.add(funcName);
                    elements.hooks.push(funcName);
                    
                    // Check if this hook has the same name as the current component (internal hook)
                    if (fileContext.isComponent && currentComponent && funcName === currentComponent) {
                      // This hook shares the name with the component - mark for internal nesting
                      internalHooks.set(funcName, { parent: currentComponent, parentType: 'component' });
                      filesNeedingSuffix.add(currentComponent);
                    }
                    // Only track file→function relationships for hooks in actual hook files
                    // (not for hooks defined inside component files)
                    else if (fileContext.isHook) {
                      // Check if this hook has the same name as the hook file (hook inside hook)
                      if (funcName === fileName) {
                        // Hook shares name with its file - will be handled as internal
                        filesNeedingSuffix.add(fileName);
                      }
                      // Track file→function relationship
                      if (!fileFunctions.has(fileName)) {
                        fileFunctions.set(fileName, { type: 'hook', functions: new Set() });
                      }
                      fileFunctions.get(fileName).functions.add(funcName);
                    }
                    // Hooks in component files are standalone - don't create file containers for them
                  }
                } else if (fileContext.isBackend) {
                  // Backend functions - tracked under backend_${fileName} container
                  elements.services.push(funcName);
                  if (!fileFunctions.has(fileName)) {
                    fileFunctions.set(fileName, { type: 'backend', functions: new Set() });
                  }
                  fileFunctions.get(fileName).functions.add(funcName);
                } else if (fileContext.isService) {
                  // Use simple name - allow duplicates for child nodes
                  elements.services.push(funcName);
                  // Track file→function relationship
                  if (!fileFunctions.has(fileName)) {
                    fileFunctions.set(fileName, { type: 'service', functions: new Set() });
                  }
                  fileFunctions.get(fileName).functions.add(funcName);
                } else if (fileContext.isStore) {
                  // Functions in store files (including hooks) should be utilities inside the store container
                  // Only actual store creations (via create()) are stores - detected separately
                  // Use simple name - allow duplicates for child nodes
                  elements.utilities.push(funcName);
                  // Track file→function relationship for nesting inside store file
                  if (!fileFunctions.has(fileName)) {
                    fileFunctions.set(fileName, { type: 'store', functions: new Set() });
                  }
                  fileFunctions.get(fileName).functions.add(funcName);
                } else if (fileContext.isHook) {
                  // Non-hook functions in hook files should be treated as utilities inside the hook file
                  // Use simple name - allow duplicates for child nodes
                  elements.utilities.push(funcName);
                  // Track file→function relationship for nesting inside hook file
                  if (!fileFunctions.has(fileName)) {
                    fileFunctions.set(fileName, { type: 'hook', functions: new Set() });
                  }
                  fileFunctions.get(fileName).functions.add(funcName);
                } else if (fileContext.isUtil) {
                  // Use simple name - allow duplicates for child nodes
                  elements.utilities.push(funcName);
                  // Track file→function relationship
                  if (!fileFunctions.has(fileName)) {
                    fileFunctions.set(fileName, { type: 'utility', functions: new Set() });
                  }
                  fileFunctions.get(fileName).functions.add(funcName);
                } else if (fileContext.isWorker) {
                  // Worker functions - grouped under worker file container
                  elements.utilities.push(funcName);
                  // Track file→function relationship
                  if (!fileFunctions.has(fileName)) {
                    fileFunctions.set(fileName, { type: 'worker', functions: new Set() });
                  }
                  fileFunctions.get(fileName).functions.add(funcName);
                } else {
                  // Default: treat as function
                  // If we're inside a component OR in a component file, track this function as belonging to it
                  if ((parentIsComponent || fileContext.isComponent) && currentComponent) {
                    // Skip trivial single/double-letter names
                    const isTrivial = funcName.length <= 2;

                    if (!isTrivial) {
                      // Prefix the function name with the component name
                      const prefixedFuncName =
                        currentComponent.toLowerCase() +
                        funcName.charAt(0).toUpperCase() +
                        funcName.slice(1);

                      // Check if this PREFIXED function already exists
                      if (!foundItems.functions.has(prefixedFuncName)) {
                        foundItems.functions.add(prefixedFuncName);
                        componentFunctions.get(currentComponent).add(prefixedFuncName);
                      }
                    }
                  } else if (fileContext.isUtil) {
                    // Functions in utility files should be utilities, not general functions
                    if (!foundItems.utilities.has(funcName)) {
                      foundItems.utilities.add(funcName);
                      elements.utilities.push(funcName);
                      // Track file→function relationship so the file container is always created
                      if (!fileFunctions.has(fileName)) {
                        fileFunctions.set(fileName, { type: 'utility', functions: new Set() });
                      }
                      fileFunctions.get(fileName).functions.add(funcName);
                    }
                  } else if (fileContext.isWorker) {
                    // Functions in worker files should be utilities under a worker container
                    if (!foundItems.utilities.has(funcName)) {
                      foundItems.utilities.add(funcName);
                      elements.utilities.push(funcName);
                      // Track file→function relationship
                      if (!fileFunctions.has(fileName)) {
                        fileFunctions.set(fileName, { type: 'worker', functions: new Set() });
                      }
                      fileFunctions.get(fileName).functions.add(funcName);
                    }
                  } else {
                    // Only add to general functions if NOT in a component or utility file
                    if (!foundItems.functions.has(funcName)) {
                      foundItems.functions.add(funcName);
                      elements.functions.push(funcName);
                      // If we're in a component file but haven't found the component yet,
                      // defer this function so it will be assigned once the component is found
                      if (fileContext.isComponent && !currentComponent) {
                        prePendingFunctions.push(funcName);
                      }
                    }
                  }
                }
              }

              // Check for variable declarations (arrow functions, etc.)
              if (node.type === 'VariableDeclaration') {
                node.declarations.forEach((decl) => {
                  // NEW: Track hook return value destructuring
                  // e.g., const { objects, setObjects } = useObjectsStore()
                  // e.g., const [state, setState] = useState()
                  if (decl.init && decl.init.type === 'CallExpression' && currentComponent) {
                    const calleeName = decl.init.callee?.name;
                    
                    // Check if it's a hook call (starts with 'use')
                    if (calleeName && calleeName.startsWith('use')) {
                      const destructuredValues = [];
                      
                      // Handle object destructuring: const { a, b } = useHook()
                      if (decl.id && decl.id.type === 'ObjectPattern') {
                        decl.id.properties.forEach((prop) => {
                          if (prop.key && prop.key.name) {
                            destructuredValues.push(prop.key.name);
                          }
                        });
                      }
                      // Handle array destructuring: const [a, b] = useState()
                      else if (decl.id && decl.id.type === 'ArrayPattern') {
                        decl.id.elements.forEach((elem) => {
                          if (elem && elem.type === 'Identifier') {
                            destructuredValues.push(elem.name);
                          }
                        });
                      }
                      
                      if (destructuredValues.length > 0) {
                        if (!hookReturnValueRelationships.has(currentComponent)) {
                          hookReturnValueRelationships.set(currentComponent, new Set());
                        }
                        hookReturnValueRelationships.get(currentComponent).add({
                          hook: calleeName,
                          returnValues: destructuredValues
                        });
                      }
                    }
                    
                    // NEW: Track store getState() calls
                    // e.g., const { objects } = useObjectsStore.getState()
                    if (decl.init.callee?.type === 'MemberExpression') {
                      const objectName = decl.init.callee.object?.name;
                      const methodName = decl.init.callee.property?.name;
                      
                      if (objectName && methodName === 'getState' && 
                          (fileImports.stores.includes(objectName) || objectName.includes('Store'))) {
                        const storeProperties = [];
                        
                        if (decl.id && decl.id.type === 'ObjectPattern') {
                          decl.id.properties.forEach((prop) => {
                            if (prop.key && prop.key.name) {
                              storeProperties.push(prop.key.name);
                            }
                          });
                        }
                        
                        if (storeProperties.length > 0) {
                          if (!storeUsageRelationships.has(currentComponent)) {
                            storeUsageRelationships.set(currentComponent, new Map());
                          }
                          const storeMap = storeUsageRelationships.get(currentComponent);
                          if (!storeMap.has(objectName)) {
                            storeMap.set(objectName, { properties: new Set(), actions: new Set() });
                          }
                          storeProperties.forEach((prop) => {
                            // Actions typically start with 'set', 'add', 'remove', 'update', etc.
                            if (/^(set|add|remove|update|delete|clear|reset|toggle)/.test(prop)) {
                              storeMap.get(objectName).actions.add(prop);
                            } else {
                              storeMap.get(objectName).properties.add(prop);
                            }
                          });
                        }
                      }
                    }
                  }

                  if (decl.id && decl.id.name) {
                    const varName = decl.id.name;

                    // Check if it's a function (arrow function, function expression, or wrapped in useCallback/useMemo)
                    let isFunction = false;
                    let actualInit = decl.init; // The actual function to check

                    if (decl.init) {
                      // Direct arrow/function expression
                      if (
                        decl.init.type === 'ArrowFunctionExpression' ||
                        decl.init.type === 'FunctionExpression'
                      ) {
                        isFunction = true;
                      }
                      // Wrapped in useCallback, useMemo, forwardRef, memo, etc.
                      else if (
                        decl.init.type === 'CallExpression' &&
                        decl.init.callee &&
                        decl.init.callee.type === 'Identifier' &&
                        (decl.init.callee.name === 'useCallback' ||
                          decl.init.callee.name === 'useMemo' ||
                          decl.init.callee.name === 'forwardRef' ||
                          decl.init.callee.name === 'memo') &&
                        decl.init.arguments &&
                        decl.init.arguments.length > 0 &&
                        (decl.init.arguments[0].type === 'ArrowFunctionExpression' ||
                          decl.init.arguments[0].type === 'FunctionExpression')
                      ) {
                        isFunction = true;
                        actualInit = decl.init.arguments[0]; // Get the inner function
                      }
                      // Wrapped in React.memo or React.forwardRef
                      else if (
                        decl.init.type === 'CallExpression' &&
                        decl.init.callee &&
                        decl.init.callee.type === 'MemberExpression' &&
                        decl.init.callee.object?.name === 'React' &&
                        (decl.init.callee.property?.name === 'memo' ||
                          decl.init.callee.property?.name === 'forwardRef') &&
                        decl.init.arguments &&
                        decl.init.arguments.length > 0
                      ) {
                        isFunction = true;
                        actualInit = decl.init.arguments[0]; // Get the inner function
                      }
                    }

                    if (isFunction) {
                      // Check if this looks like a React component
                      const looksLikeComponent = /^[A-Z]/.test(varName);

                      // Categorize based on file context, naming, AND JSX usage
                      // Check the actualInit (unwrapped function) for JSX
                      if (
                        looksLikeComponent &&
                        !varName.startsWith('use') &&
                        fileContext.isComponent &&
                        containsJSX(actualInit.body || actualInit, fileContext)
                      ) {
                        // Only treat as component if it's in a component file AND returns JSX
                        if (!foundItems.components.has(varName)) {
                          foundItems.components.add(varName);
                          elements.components.push(varName);

                          // Track all components found in this file
                          fileComponents.push(varName);

                          // Set current component if not set (for function containment tracking)
                          if (!currentComponent) {
                            currentComponent = varName;
                          }

                          componentFunctions.set(varName, new Set());
                          // Retroactively assign any module-level helpers encountered before
                          // this component declaration so they get containment arrows
                          if (prePendingFunctions.length > 0) {
                            prePendingFunctions.forEach((fn) => componentFunctions.get(varName).add(fn));
                            prePendingFunctions.length = 0;
                          }

                          // Associate file imports with this component
                          if (!componentDependencies.has(varName)) {
                            componentDependencies.set(varName, new Set());
                          }
                          fileImports.stores.forEach((store) =>
                            componentDependencies.get(varName).add({ name: store, type: 'store' })
                          );
                          fileImports.services.forEach((service) =>
                            componentDependencies
                              .get(varName)
                              .add({ name: service, type: 'service' })
                          );
                          fileImports.hooks.forEach((hook) =>
                            componentDependencies.get(varName).add({ name: hook, type: 'hook' })
                          );
                          fileImports.utilities.forEach((utility) =>
                            componentDependencies
                              .get(varName)
                              .add({ name: utility, type: 'utility' })
                          );
                        }
                        // Traverse function body with component context
                        if (decl.init.body) {
                          traverse(decl.init.body, true);
                        }
                      } else if (varName.startsWith('use') && !fileContext.isStore) {
                        // Hooks: must start with 'use' (React convention)
                        // Functions in /hooks/ folder that don't start with 'use' are utilities, not hooks
                        // Exception: hooks in store files should be utilities inside the store container
                        if (!foundItems.hooks.has(varName)) {
                          foundItems.hooks.add(varName);
                          elements.hooks.push(varName);
                          
                          // Check if this hook has the same name as the current component (internal hook)
                          if (fileContext.isComponent && currentComponent && varName === currentComponent) {
                            // This hook shares the name with the component - mark for internal nesting
                            internalHooks.set(varName, { parent: currentComponent, parentType: 'component' });
                            filesNeedingSuffix.add(currentComponent);
                          }
                          // Only track file→function relationships for hooks in actual hook files
                          // (not for hooks defined inside component files)
                          else if (fileContext.isHook) {
                            // Check if this hook has the same name as the hook file (hook inside hook)
                            if (varName === fileName) {
                              // Hook shares name with its file - will be handled as internal
                              filesNeedingSuffix.add(fileName);
                            }
                            // Track file→function relationship
                            if (!fileFunctions.has(fileName)) {
                              fileFunctions.set(fileName, { type: 'hook', functions: new Set() });
                            }
                            fileFunctions.get(fileName).functions.add(varName);
                          }
                          // Hooks in component files are standalone - don't create file containers for them
                        }
                      } else if (fileContext.isBackend) {
                        // Backend functions - tracked under backend_${fileName} container
                        elements.services.push(varName);
                        if (!fileFunctions.has(fileName)) {
                          fileFunctions.set(fileName, { type: 'backend', functions: new Set() });
                        }
                        fileFunctions.get(fileName).functions.add(varName);
                      } else if (fileContext.isService) {
                        // Use simple name - allow duplicates for child nodes
                        elements.services.push(varName);
                        // Track file→function relationship
                        if (!fileFunctions.has(fileName)) {
                          fileFunctions.set(fileName, { type: 'service', functions: new Set() });
                        }
                        fileFunctions.get(fileName).functions.add(varName);
                      } else if (fileContext.isStore) {
                        // Functions in store files (including hooks) should be utilities inside the store container
                        // Only actual store creations (via create()) are stores - detected separately
                        // Use simple name - allow duplicates for child nodes
                        elements.utilities.push(varName);
                        // Track file→function relationship for nesting inside store file
                        if (!fileFunctions.has(fileName)) {
                          fileFunctions.set(fileName, { type: 'store', functions: new Set() });
                        }
                        fileFunctions.get(fileName).functions.add(varName);
                      } else if (fileContext.isHook) {
                        // Non-hook functions in hook files should be utilities inside the hook file
                        // Use simple name - allow duplicates for child nodes
                        elements.utilities.push(varName);
                        // Track file→function relationship for nesting inside hook file
                        if (!fileFunctions.has(fileName)) {
                          fileFunctions.set(fileName, { type: 'hook', functions: new Set() });
                        }
                        fileFunctions.get(fileName).functions.add(varName);
                      } else if (fileContext.isUtil) {
                        // Use simple name - allow duplicates for child nodes
                        elements.utilities.push(varName);
                        // Track file→function relationship
                        if (!fileFunctions.has(fileName)) {
                          fileFunctions.set(fileName, { type: 'utility', functions: new Set() });
                        }
                        fileFunctions.get(fileName).functions.add(varName);
                      } else if (fileContext.isWorker) {
                        // Worker functions - grouped under worker file container
                        elements.utilities.push(varName);
                        // Track file→function relationship
                        if (!fileFunctions.has(fileName)) {
                          fileFunctions.set(fileName, { type: 'worker', functions: new Set() });
                        }
                        fileFunctions.get(fileName).functions.add(varName);
                      } else {
                        // Default: treat as function
                        // If we're inside a component OR in a component file, track this function as belonging to it
                        if ((parentIsComponent || fileContext.isComponent) && currentComponent) {
                          // Skip trivial single/double-letter names
                          const isTrivial = varName.length <= 2;

                          if (!isTrivial && isFunction) {
                            // Prefix the function name with the component name
                            const prefixedVarName =
                              currentComponent.toLowerCase() +
                              varName.charAt(0).toUpperCase() +
                              varName.slice(1);

                            // Check if this PREFIXED function already exists
                            if (!foundItems.functions.has(prefixedVarName)) {
                              foundItems.functions.add(prefixedVarName);
                              componentFunctions.get(currentComponent).add(prefixedVarName);
                            }
                          }
                        } else if (fileContext.isUtil && isFunction) {
                          // Functions in utility files should be utilities, not general functions
                          if (!foundItems.utilities.has(varName)) {
                            foundItems.utilities.add(varName);
                            elements.utilities.push(varName);
                            // Track file→function relationship
                            if (!fileFunctions.has(fileName)) {
                              fileFunctions.set(fileName, {
                                type: 'utility',
                                functions: new Set(),
                              });
                            }
                            fileFunctions.get(fileName).functions.add(varName);
                          }
                        } else if (fileContext.isWorker && isFunction) {
                          // Functions in worker files should be utilities under a worker container
                          if (!foundItems.utilities.has(varName)) {
                            foundItems.utilities.add(varName);
                            elements.utilities.push(varName);
                            // Track file→function relationship
                            if (!fileFunctions.has(fileName)) {
                              fileFunctions.set(fileName, {
                                type: 'worker',
                                functions: new Set(),
                              });
                            }
                            fileFunctions.get(fileName).functions.add(varName);
                          }
                        } else if (isFunction) {
                          // Only add to general functions if NOT in a component or utility file
                          // and it's actually a function
                          if (!foundItems.functions.has(varName)) {
                            foundItems.functions.add(varName);
                            elements.functions.push(varName);
                            // If we're in a component file but haven't found the component yet,
                            // defer this function so it will be assigned once the component is found
                            if (fileContext.isComponent && !currentComponent) {
                              prePendingFunctions.push(varName);
                            }
                          }
                        }
                      }

                      // Don't recursively traverse if already traversed as component
                      // For wrapped functions (useCallback/useMemo), traverse the inner function body
                      if (!looksLikeComponent) {
                        if (
                          decl.init.type === 'CallExpression' &&
                          decl.init.arguments &&
                          decl.init.arguments[0]
                        ) {
                          // Wrapped in useCallback/useMemo - traverse the first argument's body
                          const innerFunc = decl.init.arguments[0];
                          if (innerFunc.body) {
                            traverse(innerFunc.body, parentIsComponent);
                          }
                        } else if (decl.init.body) {
                          // Direct arrow/function expression - traverse body directly
                          traverse(decl.init.body, parentIsComponent);
                        }
                      }
                    }
                    // Check for store definitions (e.g., create, createWithEqualityFn, createStore with zustand)
                    // Only detect actual store creation calls, not all CallExpressions
                    else if (
                      fileContext.isStore &&
                      decl.init &&
                      decl.init.type === 'CallExpression' &&
                      decl.init.callee &&
                      decl.init.callee.type === 'Identifier' &&
                      ['create', 'createWithEqualityFn', 'createStore'].includes(decl.init.callee.name)
                    ) {
                      if (!foundItems.stores.has(varName)) {
                        foundItems.stores.add(varName);
                        elements.stores.push(varName);
                      }
                    }
                    // Check for singleton instance exports (e.g., export const instance = new ClassName())
                    // These are commonly used for services and utilities
                    else if (
                      decl.init &&
                      decl.init.type === 'NewExpression' &&
                      decl.init.callee &&
                      decl.init.callee.type === 'Identifier'
                    ) {
                      // Treat as service/utility based on file context
                      if (fileContext.isBackend) {
                        if (!foundItems.services.has(varName)) {
                          foundItems.services.add(varName);
                          elements.services.push(varName);
                        }
                        if (!fileFunctions.has(fileName)) {
                          fileFunctions.set(fileName, { type: 'backend', functions: new Set() });
                        }
                        fileFunctions.get(fileName).functions.add(varName);
                      } else if (fileContext.isService) {
                        elements.services.push(varName);
                        if (!fileFunctions.has(fileName)) {
                          fileFunctions.set(fileName, { type: 'service', functions: new Set() });
                        }
                        fileFunctions.get(fileName).functions.add(varName);
                      } else if (fileContext.isUtil) {
                        elements.utilities.push(varName);
                        if (!fileFunctions.has(fileName)) {
                          fileFunctions.set(fileName, { type: 'utility', functions: new Set() });
                        }
                        fileFunctions.get(fileName).functions.add(varName);
                      }
                    }
                  }
                });
              }

              // Check for class declarations (React components or standalone classes)
              if (node.type === 'ClassDeclaration' && node.id) {
                const className = node.id.name;

                // Check if class extends React.Component or Component
                const extendsReactComponent =
                  node.superClass &&
                  ((node.superClass.type === 'Identifier' &&
                    node.superClass.name === 'Component') ||
                    (node.superClass.type === 'MemberExpression' &&
                      node.superClass.object.name === 'React' &&
                      node.superClass.property.name === 'Component'));

                // Only treat as component if it extends React.Component/Component
                if (
                  fileContext.isComponent &&
                  extendsReactComponent &&
                  !foundItems.components.has(className)
                ) {
                  foundItems.components.add(className);
                  elements.components.push(className);
                  currentComponent = className;
                  componentFunctions.set(className, new Set());

                  // Associate file imports with this component
                  if (!componentDependencies.has(className)) {
                    componentDependencies.set(className, new Set());
                  }
                  fileImports.stores.forEach((store) =>
                    componentDependencies.get(className).add({ name: store, type: 'store' })
                  );
                  fileImports.services.forEach((service) =>
                    componentDependencies.get(className).add({ name: service, type: 'service' })
                  );
                  fileImports.hooks.forEach((hook) =>
                    componentDependencies.get(className).add({ name: hook, type: 'hook' })
                  );
                  fileImports.utilities.forEach((utility) =>
                    componentDependencies.get(className).add({ name: utility, type: 'utility' })
                  );
                } else if (!foundItems.classes.has(className)) {
                  // Non-React classes: emit as [[Class:]] type
                  foundItems.classes.add(className);
                  elements.classes.push(className);
                  // Track file→function relationship
                  const containerType = fileContext.isBackend ? 'backend'
                    : fileContext.isService ? 'service'
                    : fileContext.isWorker ? 'worker'
                    : fileContext.isUtil ? 'utility'
                    : 'utility';
                  if (!fileFunctions.has(fileName)) {
                    fileFunctions.set(fileName, { type: containerType, functions: new Set() });
                  }
                  fileFunctions.get(fileName).functions.add(className);
                }
              }

              // Track JSX elements to find component relationships
              if (node.type === 'JSXElement' && currentComponent) {
                const openingElement = node.openingElement;
                if (openingElement && openingElement.name) {
                  let jsxName = null;

                  // Handle JSXIdentifier (e.g., <CustomCamera />)
                  if (openingElement.name.type === 'JSXIdentifier') {
                    jsxName = openingElement.name.name;
                  }
                  // Handle JSXMemberExpression (e.g., <Three.Mesh />)
                  else if (openingElement.name.type === 'JSXMemberExpression') {
                    jsxName = openingElement.name.property.name;
                  }

                  // Track all custom components (starts with uppercase) - we'll filter later
                  if (jsxName && jsxName[0] === jsxName[0].toUpperCase()) {
                    if (!componentRelationships.has(currentComponent)) {
                      componentRelationships.set(currentComponent, new Set());
                    }
                    componentRelationships.get(currentComponent).add(jsxName);

                    // NEW: Track props being passed to child components
                    if (openingElement.attributes && openingElement.attributes.length > 0) {
                      const propNames = [];
                      openingElement.attributes.forEach((attr) => {
                        if (attr.type === 'JSXAttribute' && attr.name) {
                          const propName = attr.name.name;
                          // Skip common React-specific props
                          if (propName && !['key', 'ref', 'className', 'style', 'id'].includes(propName)) {
                            propNames.push(propName);
                          }
                        }
                        // Track spread props
                        else if (attr.type === 'JSXSpreadAttribute' && attr.argument) {
                          if (attr.argument.type === 'Identifier') {
                            propNames.push(`...${attr.argument.name}`);
                          }
                        }
                      });

                      if (propNames.length > 0) {
                        if (!componentPropsRelationships.has(currentComponent)) {
                          componentPropsRelationships.set(currentComponent, new Map());
                        }
                        const propsMap = componentPropsRelationships.get(currentComponent);
                        if (!propsMap.has(jsxName)) {
                          propsMap.set(jsxName, new Set());
                        }
                        propNames.forEach((prop) => propsMap.get(jsxName).add(prop));
                      }
                    }
                  }
                }
              }

              // Track hook usage (e.g., const data = useObjects())
              if (node.type === 'CallExpression' && currentComponent) {
                if (node.callee && node.callee.type === 'Identifier') {
                  const calleeName = node.callee.name;
                  // Track all hook usage - we'll filter later
                  if (calleeName.startsWith('use')) {
                    if (!componentDependencies.has(currentComponent)) {
                      componentDependencies.set(currentComponent, new Set());
                    }
                    componentDependencies.get(currentComponent).add({ name: calleeName, type: 'hook' });
                  }
                  // NEW: Track service/utility function calls
                  else if (fileImports.services.includes(calleeName) || 
                           fileImports.utilities.includes(calleeName)) {
                    const type = fileImports.services.includes(calleeName) ? 'service' : 'utility';
                    if (!functionCallRelationships.has(currentComponent)) {
                      functionCallRelationships.set(currentComponent, new Set());
                    }
                    functionCallRelationships.get(currentComponent).add({
                      target: calleeName,
                      label: `calls ${calleeName}`,
                      type: type
                    });
                  }
                }
                // NEW: Track member expression calls (e.g., someService.someMethod())
                else if (node.callee && node.callee.type === 'MemberExpression') {
                  const objectName = node.callee.object?.name;
                  const methodName = node.callee.property?.name;
                  if (objectName && methodName) {
                    // Check if object is an imported service/utility/store
                    if (fileImports.services.includes(objectName) ||
                        fileImports.utilities.includes(objectName) ||
                        fileImports.stores.includes(objectName)) {
                      if (!functionCallRelationships.has(currentComponent)) {
                        functionCallRelationships.set(currentComponent, new Set());
                      }
                      functionCallRelationships.get(currentComponent).add({
                        target: objectName,
                        label: `.${methodName}()`,
                        type: fileImports.stores.includes(objectName) ? 'store' : 
                              fileImports.services.includes(objectName) ? 'service' : 'utility'
                      });
                    }
                  }
                }
              }

              // NEW: Detect API endpoint definitions (Express/Fastify/Next.js)
              if (node.type === 'CallExpression') {
                const callee = node.callee;
                // Express/Fastify style: app.get('/path', handler1, handler2)
                if (callee?.type === 'MemberExpression') {
                  const methodName = callee.property?.name;
                  const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options', 'use'];
                  if (httpMethods.includes(methodName) && node.arguments?.length >= 1) {
                    const firstArg = node.arguments[0];
                    const routePath = firstArg?.type === 'StringLiteral' ? firstArg.value :
                                      firstArg?.type === 'TemplateLiteral' ? '(dynamic)' : null;
                    if (routePath && (routePath.startsWith('/') || routePath.startsWith('.'))) {
                      const method = methodName === 'use' ? 'USE' : methodName.toUpperCase();
                      const endpointKey = sanitizeNodeId(`${method}_${routePath}`);
                      if (!apiEndpoints.has(endpointKey)) {
                        apiEndpoints.set(endpointKey, { method, path: routePath, handlers: [], sourceFile: fileName });
                      }
                      // Collect handler names (remaining arguments that are identifiers)
                      const handlers = node.arguments.slice(1)
                        .filter(a => a.type === 'Identifier')
                        .map(a => a.name);
                      const ep = apiEndpoints.get(endpointKey);
                      handlers.forEach(h => { if (!ep.handlers.includes(h)) ep.handlers.push(h); });
                    }
                  }
                  // Fastify: fastify.route({ method, url, handler })
                  if (methodName === 'route' && node.arguments?.[0]?.type === 'ObjectExpression') {
                    const props = node.arguments[0].properties || [];
                    let routeMethod = null;
                    let routeUrl = null;
                    let routeHandler = null;
                    props.forEach(p => {
                      if (p.key?.name === 'method' && p.value?.type === 'StringLiteral') {
                        routeMethod = p.value.value.toUpperCase();
                      }
                      if (p.key?.name === 'url' && p.value?.type === 'StringLiteral') {
                        routeUrl = p.value.value;
                      }
                      if (p.key?.name === 'handler' && p.value?.type === 'Identifier') {
                        routeHandler = p.value.name;
                      }
                    });
                    if (routeMethod && routeUrl) {
                      const epKey = sanitizeNodeId(`${routeMethod}_${routeUrl}`);
                      if (!apiEndpoints.has(epKey)) {
                        apiEndpoints.set(epKey, { method: routeMethod, path: routeUrl, handlers: [], sourceFile: fileName });
                      }
                      if (routeHandler) {
                        const ep = apiEndpoints.get(epKey);
                        if (!ep.handlers.includes(routeHandler)) ep.handlers.push(routeHandler);
                      }
                    }
                  }
                }
              }

              // NEW: Detect Next.js route handler exports (export async function GET/POST... or export const GET = ...)
              if (node.type === 'ExportNamedDeclaration' && node.declaration) {
                const decl = node.declaration;
                const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
                let exportedMethodName = null;

                if ((decl.type === 'FunctionDeclaration' || decl.type === 'TSDeclareFunction') && decl.id) {
                  exportedMethodName = decl.id.name;
                } else if (decl.type === 'VariableDeclaration') {
                  decl.declarations?.forEach(varDecl => {
                    if (varDecl.id?.type === 'Identifier' &&
                        (varDecl.init?.type === 'ArrowFunctionExpression' || varDecl.init?.type === 'FunctionExpression')) {
                      exportedMethodName = varDecl.id.name;
                    }
                  });
                }

                if (exportedMethodName && httpMethods.includes(exportedMethodName)) {
                  const method = exportedMethodName;
                  const routePath = file.path.replace(/\.(jsx?|tsx?)$/, '').replace(/(?:^|\/)(?:src\/)?(?:app|pages)\//, '/').replace(/\/route$/, '').replace(/\/page$/, '') || '/';
                  const epKey = sanitizeNodeId(`${method}_${routePath}`);
                  if (!apiEndpoints.has(epKey)) {
                    apiEndpoints.set(epKey, { method, path: routePath, handlers: [method], sourceFile: fileName });
                  }
                }
              }

              // NEW: Detect Firestore collection/model usages
              if (node.type === 'CallExpression') {
                const callee = node.callee;
                const funcName = callee?.type === 'Identifier' ? callee.name :
                                 callee?.type === 'MemberExpression' ? callee.property?.name : null;
                // Firestore: collection(db, 'name'), doc(db, 'name', id)
                if ((funcName === 'collection' || funcName === 'doc') && node.arguments?.length >= 2) {
                  const collArg = node.arguments[1];
                  if (collArg?.type === 'StringLiteral') {
                    const collName = sanitizeNodeId(collArg.value);
                    if (!dbModels.has(collName)) dbModels.set(collName, new Set());
                  }
                }
                // Mongoose: mongoose.model('Name', schema)
                if (funcName === 'model' && node.arguments?.length >= 1) {
                  const nameArg = node.arguments[0];
                  if (nameArg?.type === 'StringLiteral') {
                    const modelName = sanitizeNodeId(nameArg.value.toLowerCase());
                    if (!dbModels.has(modelName)) dbModels.set(modelName, new Set());
                  }
                }
                // Prisma: prisma.collectionName.method()
                if (callee?.type === 'MemberExpression' &&
                    callee.object?.type === 'MemberExpression' &&
                    callee.object.object?.name === 'prisma') {
                  const modelName = sanitizeNodeId(callee.object.property?.name || '');
                  if (modelName && !dbModels.has(modelName)) dbModels.set(modelName, new Set());
                }
                // Sequelize: User.hasMany(Post), Post.belongsTo(User)
                const relationMethods = ['hasMany', 'hasOne', 'belongsTo', 'belongsToMany'];
                if (callee?.type === 'MemberExpression' && relationMethods.includes(callee.property?.name)) {
                  const parentModel = sanitizeNodeId(callee.object?.name || '');
                  const childArg = node.arguments?.[0];
                  const childModel = sanitizeNodeId(childArg?.type === 'Identifier' ? childArg.name.toLowerCase() : '');
                  if (parentModel && childModel) {
                    const parentKey = parentModel.toLowerCase();
                    if (!dbModels.has(parentKey)) dbModels.set(parentKey, new Set());
                    dbModels.get(parentKey).add(childModel);
                  }
                }
              }

              // Helper: check if params look like (req, res, next) middleware params
              const isMiddlewareParams = (params) => {
                if (!params || params.length !== 3) return false;
                const names = params.map(p => (p.name || p.left?.name || '').toLowerCase());
                return (names[0].startsWith('req') || names[0] === 'request' || names[0] === 'ctx') &&
                       (names[1].startsWith('res') || names[1] === 'response' || names[1] === 'context') &&
                       (names[2] === 'next' || names[2] === 'done');
              };

              // NEW: Detect auth middleware/guard patterns
              if (node.type === 'FunctionDeclaration' && node.id) {
                const name = node.id.name;
                const params = node.params || [];
                if (isMiddlewareParams(params) &&
                    (name.toLowerCase().includes('auth') || name.toLowerCase().includes('guard') ||
                     name.toLowerCase().includes('require') || name.toLowerCase().includes('protect'))) {
                  authGuards.add(name);
                  if (currentComponent) {
                    authFlows.push({ source: currentComponent, target: name, label: 'uses guard' });
                  }
                }
              }
              // Auth guard as variable: const requireAuth = (req, res, next) => { ... }
              if (node.type === 'VariableDeclaration') {
                node.declarations?.forEach(decl => {
                  if (decl.id?.type === 'Identifier' && decl.init) {
                    const name = decl.id.name;
                    const isArrow = decl.init.type === 'ArrowFunctionExpression' || decl.init.type === 'FunctionExpression';
                    const params = isArrow ? (decl.init.params || []) : [];
                    if (isArrow && isMiddlewareParams(params) &&
                        (name.toLowerCase().includes('auth') || name.toLowerCase().includes('guard') ||
                         name.toLowerCase().includes('require') || name.toLowerCase().includes('protect') ||
                         name.toLowerCase().includes('middleware'))) {
                      authGuards.add(name);
                    }
                    // HOF: export function withAuth(handler) { ... }
                    if (name.startsWith('with') && name.toLowerCase().includes('auth') && isArrow) {
                      authGuards.add(name);
                    }
                  }
                });
              }
              // Firebase auth calls: onAuthStateChanged, signInWithPopup
              if (node.type === 'CallExpression') {
                const callee = node.callee;
                const funcName = callee?.type === 'Identifier' ? callee.name : null;
                if (funcName === 'onAuthStateChanged' || funcName === 'signInWithPopup' || funcName === 'signOut') {
                  const guardKey = funcName;
                  authGuards.add(guardKey);
                  if (currentComponent) {
                    authFlows.push({ source: currentComponent, target: guardKey, label: 'auth check' });
                  }
                }
              }

              // NEW: Detect event emitter/listener patterns
              if (node.type === 'CallExpression') {
                const callee = node.callee;
                // emitter.emit / dispatchEvent / postMessage
                if (callee?.type === 'MemberExpression') {
                  const methodName = callee.property?.name;
                  if (methodName === 'emit' && node.arguments?.[0]?.type === 'StringLiteral') {
                    const evtName = sanitizeNodeId(node.arguments[0].value);
                    if (!eventEmitters.has(evtName)) eventEmitters.set(evtName, new Set());
                    eventEmitters.get(evtName).add(currentComponent || fileName);
                  }
                  if ((methodName === 'on' || methodName === 'addEventListener') && node.arguments?.[0]?.type === 'StringLiteral') {
                    const evtName = sanitizeNodeId(node.arguments[0].value);
                    if (!eventListeners.has(evtName)) eventListeners.set(evtName, new Set());
                    eventListeners.get(evtName).add(currentComponent || fileName);
                  }
                  if (methodName === 'postMessage' && node.arguments?.[0]?.type === 'ObjectExpression') {
                    const typeProp = node.arguments[0].properties?.find(p => p.key?.name === 'type');
                    if (typeProp?.value?.type === 'StringLiteral') {
                      const evtName = sanitizeNodeId(typeProp.value.value);
                      if (!eventEmitters.has(evtName)) eventEmitters.set(evtName, new Set());
                      eventEmitters.get(evtName).add(currentComponent || fileName);
                    }
                  }
                }
                // dispatchEvent(new CustomEvent('name'))
                if (callee?.type === 'Identifier' && callee.name === 'dispatchEvent') {
                  const arg = node.arguments?.[0];
                  if (arg?.type === 'NewExpression' && arg.callee?.name === 'CustomEvent' && arg.arguments?.[0]?.type === 'StringLiteral') {
                    const evtName = sanitizeNodeId(arg.arguments[0].value);
                    if (!eventEmitters.has(evtName)) eventEmitters.set(evtName, new Set());
                    eventEmitters.get(evtName).add(currentComponent || fileName);
                  }
                }
                // onSnapshot / onValue (Firebase realtime listeners)
                if (callee?.type === 'Identifier' && (callee.name === 'onSnapshot' || callee.name === 'onValue')) {
                  // Use the function name as a stable event key so multiple files listening
                  // to the same Firebase API can be correlated.
                  const evtName = sanitizeNodeId(callee.name);
                  if (!eventListeners.has(evtName)) eventListeners.set(evtName, new Set());
                  eventListeners.get(evtName).add(currentComponent || fileName);
                }
              }

              // NEW: Detect error boundaries
              // Class-based: class Foo extends React.Component with componentDidCatch
              if (node.type === 'ClassDeclaration' && node.id && node.body) {
                const methods = node.body.body || [];
                const hasComponentDidCatch = methods.some(m => m.key?.name === 'componentDidCatch');
                const hasGetDerivedState = methods.some(m => m.key?.name === 'getDerivedStateFromError');
                if (hasComponentDidCatch || hasGetDerivedState) {
                  errorBoundaries.add(sanitizeNodeId(node.id.name));
                  if (currentComponent && currentComponent !== node.id.name) {
                    errorContainment.push({ boundary: sanitizeNodeId(node.id.name), wraps: currentComponent, label: 'catches errors from' });
                  }
                }
              }
              // Suspense usage: <Suspense fallback=...>
              if (node.type === 'JSXElement') {
                const openingName = node.openingElement?.name;
                const compName = openingName?.type === 'JSXIdentifier' ? openingName.name :
                                 openingName?.type === 'JSXMemberExpression' ? openingName.property?.name : null;
                if (compName === 'Suspense') {
                  const location = sanitizeNodeId(`Suspense_${currentComponent || fileName}`);
                  suspenseBoundaries.add(location);
                  if (currentComponent) {
                    errorContainment.push({ boundary: location, wraps: currentComponent, label: 'suspends' });
                  }
                }
                // ErrorBoundary component usage: <ErrorBoundary ...>
                if (compName && compName.toLowerCase().includes('errorboundary')) {
                  errorBoundaries.add(sanitizeNodeId(compName));
                }
              }

              // NEW: Detect shared TypeScript interfaces and type aliases
              if (node.type === 'TSInterfaceDeclaration' && node.id) {
                const ifaceName = node.id.name;
                sharedInterfaces.set(sanitizeNodeId(ifaceName), fileName);
                if (currentComponent) {
                  if (!interfaceUsages.has(currentComponent)) interfaceUsages.set(currentComponent, new Set());
                  interfaceUsages.get(currentComponent).add(sanitizeNodeId(ifaceName));
                }
              }
              if (node.type === 'TSTypeAliasDeclaration' && node.id) {
                const typeName = node.id.name;
                sharedInterfaces.set(sanitizeNodeId(typeName), fileName);
              }
              // Import type { Name } - detect usage (type-only imports are most reliable,
              // but also check value imports for cases where types are re-exported without `type` keyword)
              if (node.type === 'ImportDeclaration') {
                node.specifiers?.forEach(spec => {
                  const importedName = spec.imported?.name || spec.local?.name;
                  if (importedName && sharedInterfaces.has(sanitizeNodeId(importedName))) {
                    if (currentComponent) {
                      if (!interfaceUsages.has(currentComponent)) interfaceUsages.set(currentComponent, new Set());
                      interfaceUsages.get(currentComponent).add(sanitizeNodeId(importedName));
                    }
                  }
                });
              }

              // Recursively traverse child nodes
              Object.keys(node).forEach((key) => {
                const child = node[key];
                if (Array.isArray(child)) {
                  child.forEach((c) => traverse(c, parentIsComponent));
                } else if (child && typeof child === 'object' && child.type) {
                  traverse(child, parentIsComponent);
                }
              });
            };

            traverse(ast, false);

            // After traversing the file, determine internal components based on exports
            if (fileContext.isComponent && fileComponents.length > 1) {
              const exportedComponent = exportedComponents.get(fileName);

              if (exportedComponent && fileComponents.includes(exportedComponent)) {
                // The exported component is the parent
                const helperComponents = fileComponents.filter((comp) => comp !== exportedComponent);

                if (helperComponents.length > 0) {
                  internalComponents.set(fileName, {
                    parent: exportedComponent,
                    helpers: new Set(helperComponents),
                  });
                }
              } else {
                // No export found, use last component as parent (likely the main one)
                const parentComponent = fileComponents[fileComponents.length - 1];
                const helperComponents = fileComponents.slice(0, -1);

                if (helperComponents.length > 0) {
                  internalComponents.set(fileName, {
                    parent: parentComponent,
                    helpers: new Set(helperComponents),
                  });
                }
              }
            }
          } catch (parseError) {
            // Log which files can't be parsed (helps debug missing nodes)
            console.warn(`⚠️  Failed to parse ${file.path}:`, parseError?.message || parseError);
            return;
          }
        })
      );
    }

    // ── Vanilla / Python / Vue post-processing: convert inter-module imports to connections ──
    // Each file container that imports another known file container gets a
    // directed 'imports' connection so the 3D diagram shows module dependencies.
    if (repoType === 'vanilla' || repoType === 'python' || repoType === 'vue') {
      const knownContainers = new Set(fileFunctions.keys());
      moduleImportRelationships.forEach((importedFiles, sourceFile) => {
        if (!knownContainers.has(sourceFile)) return;
        importedFiles.forEach((targetFile) => {
          if (!knownContainers.has(targetFile)) return;
          if (!functionCallRelationships.has(sourceFile)) {
            functionCallRelationships.set(sourceFile, new Set());
          }
          functionCallRelationships.get(sourceFile).add({
            target: targetFile,
            label: 'imports',
            type: 'utility',
          });
        });
      });
    }

    // Log diagnostic summary for file containers
    const fileContainerSummary = [];
    fileFunctions.forEach((info, name) => {
      fileContainerSummary.push(`  ${name} (${info.type}): ${[...info.functions].join(', ')}`);
    });
    console.log(`📊 GitHub Repo Scan Summary for ${repoName}:`);
    console.log(`  Files scanned: ${structure.length}`);
    console.log(`  Components: ${elements.components.length}`);
    console.log(`  Hooks: ${elements.hooks.length}`);
    console.log(`  Services: ${elements.services.length}`);
    console.log(`  Stores: ${elements.stores.length}`);
    console.log(`  Utilities: ${elements.utilities.length}`);
    console.log(`  Functions: ${elements.functions.length}`);
    console.log(`  Libraries: ${elements.imports.libraries.length}`);
    console.log(`  File containers (${fileFunctions.size}):`);
    if (fileContainerSummary.length > 0) {
      fileContainerSummary.forEach(line => console.log(line));
    }
    if (repoType === 'nextjs') {
      console.log(`  Next.js route files (${nextjsRouteMap.size}):`);
      nextjsRouteMap.forEach((info, name) => {
        console.log(`    ${name}: route=${info.routePath || '/'}, layout=${info.isLayout}, page=${info.isPage}, api=${info.isApi}`);
      });
    }

    // Generate Merfolk markdown
    const merfolkResult = generateMerfolkMarkdown(
      repoName,
      elements,
      foundItems,
      componentFunctions,
      componentRelationships,
      componentDependencies,
      internalComponents,
      fileFunctions,
      internalHooks,
      filesNeedingSuffix,
      functionCallRelationships,
      componentPropsRelationships,
      storeUsageRelationships,
      hookReturnValueRelationships,
      repoType,
      moduleImportRelationships,
      nextjsRouteMap,
      apiEndpoints,
      dbModels,
      authGuards,
      authFlows,
      eventEmitters,
      eventListeners,
      errorBoundaries,
      suspenseBoundaries,
      errorContainment,
      sharedInterfaces,
      interfaceUsages
    );

    // Debug: log the generated Merfolk markdown so we can diagnose parse issues
    console.log(`📝 Generated Merfolk markdown (${merfolkResult.length} chars):\n${merfolkResult.substring(0, 3000)}`);
    if (merfolkResult.length > 3000) console.log(`   ... (${merfolkResult.length - 3000} more chars)`);

    return merfolkResult;
  } catch (error) {
    console.error('Error generating Merfolk from repository:', error);
    return `%% ${repoName} Repository Analysis\n\n%% Error: Unable to analyze repository\n`;
  }
};

/**
 * Generate Merfolk markdown from parsed elements
 * @param {string} repoName - Repository name
 * @param {Object} elements - Parsed elements
 * @param {Object} foundItems - Sets of found items
 * @param {Map} componentFunctions - Component to function relationships
 * @param {Map} componentRelationships - Component to component relationships
 * @param {Map} componentDependencies - Component dependencies
 * @param {Map} internalComponents - Internal component mappings
 * @param {Map} fileFunctions - File to function mappings
 * @param {Map} internalHooks - Internal hooks that share names with parent
 * @param {Set} filesNeedingSuffix - Files that need _file suffix
 * @param {Map} functionCallRelationships - Component to function call relationships
 * @param {Map} componentPropsRelationships - Component to child props relationships
 * @param {Map} storeUsageRelationships - Component to store usage relationships
 * @param {Map} hookReturnValueRelationships - Component to hook return value relationships
 * @param {'react'|'nextjs'|'vanilla'|'python'|'vue'} repoType - Detected repository type
 * @param {Map} moduleImportRelationships - sourceFile -> Set<importedFileBase>
 * @param {Map} nextjsRouteMap - filePath -> { segment, parentPath, isLayout, isPage, isApi }
 * @returns {string} - Merfolk markdown content
 */
const generateMerfolkMarkdown = (
  repoName,
  elements,
  foundItems,
  componentFunctions,
  componentRelationships,
  componentDependencies,
  internalComponents,
  fileFunctions,
  internalHooks = new Map(),
  filesNeedingSuffix = new Set(),
  functionCallRelationships = new Map(),
  componentPropsRelationships = new Map(),
  storeUsageRelationships = new Map(),
  hookReturnValueRelationships = new Map(),
  repoType = 'react',
  moduleImportRelationships = new Map(),
  nextjsRouteMap = new Map(),
  apiEndpoints = new Map(),
  dbModels = new Map(),
  authGuards = new Set(),
  authFlows = [],
  eventEmitters = new Map(),
  eventListeners = new Map(),
  errorBoundaries = new Set(),
  suspenseBoundaries = new Set(),
  errorContainment = [],
  sharedInterfaces = new Map(),
  interfaceUsages = new Map()
) => {
  const isVanilla = repoType === 'vanilla' || repoType === 'python' || repoType === 'vue';
  const isNextjs = repoType === 'nextjs';
  let markdown = `%% ${repoName} Repository Analysis\n\n`;

  // Remove duplicates from all arrays (use Sets to ensure uniqueness)
  elements.components = [...new Set(elements.components)];
  elements.functions = [...new Set(elements.functions)];
  elements.hooks = [...new Set(elements.hooks)];
  elements.services = [...new Set(elements.services)];
  elements.stores = [...new Set(elements.stores)];
  elements.utilities = [...new Set(elements.utilities)];
  elements.classes = [...new Set(elements.classes)];
  elements.interfaces = [...new Set(elements.interfaces)];
  elements.variables = [...new Set(elements.variables)];
  elements.constants = [...new Set(elements.constants)];
  elements.imports.libraries = [...new Set(elements.imports.libraries)];

  // Debug: Log all detected components with first character check
  elements.components.forEach((comp) => {
    const startsWithUppercase = /^[A-Z]/.test(comp);
    if (!startsWithUppercase) {
      console.warn(`⚠️ INVALID COMPONENT (not uppercase): "${comp}" - first char: "${comp[0]}"`);
    }
  });

  // SAFETY FILTER: Remove any components that don't start with uppercase letter
  const validComponents = elements.components.filter((comp) => /^[A-Z]/.test(comp));
  const invalidComponents = elements.components.filter((comp) => !/^[A-Z]/.test(comp));

  if (invalidComponents.length > 0) {
    console.warn(`🚫 FILTERED OUT ${invalidComponents.length} invalid components:`, invalidComponents);
  }

  elements.components = validComponents;

  // Remove cross-category duplicates (prioritize more specific categories)
  // Remove services/utilities that are in stores
  const storesSet = new Set(elements.stores);
  elements.services = elements.services.filter((item) => !storesSet.has(item));
  elements.utilities = elements.utilities.filter((item) => !storesSet.has(item));

  // Remove utilities that are in services
  const servicesSet = new Set(elements.services);
  elements.utilities = elements.utilities.filter((item) => !servicesSet.has(item));

  // Remove utilities/services that are also in classes, constants, or variables
  const classesSet = new Set(elements.classes);
  const constantsSet = new Set(elements.constants);
  const variablesSet = new Set(elements.variables);
  elements.utilities = elements.utilities.filter(
    (item) => !classesSet.has(item) && !constantsSet.has(item) && !variablesSet.has(item)
  );
  elements.services = elements.services.filter((item) => !classesSet.has(item));

  // Remove component-internal functions from the general functions list
  // These will be handled via componentFunctions relationships
  const componentInternalFunctions = new Set();
  componentFunctions.forEach((functions) => {
    functions.forEach((func) => componentInternalFunctions.add(func));
  });
  elements.functions = elements.functions.filter((func) => !componentInternalFunctions.has(func));

  // Filter component relationships to only include components that exist in our codebase
  const componentsSet = new Set(elements.components);

  componentRelationships.forEach((usedComponents, component) => {
    const filtered = new Set([...usedComponents].filter((comp) => componentsSet.has(comp)));
    componentRelationships.set(component, filtered);
  });
  // Remove entries with no valid relationships
  for (const [component, usedComponents] of componentRelationships.entries()) {
    if (usedComponents.size === 0) {
      componentRelationships.delete(component);
    }
  }

  // Filter component dependencies to only include hooks/services/stores/utilities that exist in our codebase
  const hooksSet = new Set(elements.hooks);
  const servicesSetForFilter = new Set(elements.services);
  const storesSetForFilter = new Set(elements.stores);
  const utilitiesSetForFilter = new Set(elements.utilities);

  componentDependencies.forEach((deps, component) => {
    const filtered = new Set(
      [...deps].filter((dep) => {
        if (dep.type === 'hook') return hooksSet.has(dep.name);
        if (dep.type === 'service') return servicesSetForFilter.has(dep.name);
        if (dep.type === 'store') return storesSetForFilter.has(dep.name);
        if (dep.type === 'utility') return utilitiesSetForFilter.has(dep.name);
        return false;
      })
    );
    componentDependencies.set(component, filtered);
  });
  // Remove entries with no valid dependencies
  for (const [component, deps] of componentDependencies.entries()) {
    if (deps.size === 0) {
      componentDependencies.delete(component);
    }
  }

  // Track all node IDs to detect duplicates
  const nodeIds = new Set();
  const duplicates = [];

  // Build a reverse lookup: function/utility/hook name -> parent container node ID
  // This is used to route connections through parent containers
  const childToParentMap = new Map();
  
  // Map component internal functions to their parent component
  componentFunctions.forEach((functions, componentName) => {
    const parentNeedsSuffix = filesNeedingSuffix.has(componentName);
    const parentNodeId = parentNeedsSuffix ? `${componentName}_file` : componentName;
    functions.forEach((funcName) => {
      childToParentMap.set(funcName, { parentId: parentNodeId, parentName: componentName, type: 'component' });
    });
  });
  
  // Build a set of all emitted symbol names to detect when a file container
  // name collides with a previously-emitted node (e.g. utility `graph` vs
  // file container `graph.ts`).
  const allSymbolNames = new Set([
    ...elements.components,
    ...elements.functions,
    ...elements.hooks,
    ...elements.services,
    ...elements.stores,
    ...elements.utilities,
  ]);

  // Map file container children to their parent file container
  // Every file in fileFunctions now gets a container, so always map all children.
  fileFunctions.forEach((fileInfo, fileName) => {
    const needsSuffix = filesNeedingSuffix.has(fileName);
    // Backend/worker/shader files get a prefix on their container node ID
    // so markdownDiagramService can detect and group them separately.
    let fileNodeId;
    if (fileInfo.type === 'backend') {
      fileNodeId = `backend_${fileName}`;
    } else if (fileInfo.type === 'worker') {
      fileNodeId = `worker_${fileName}`;
    } else if (fileInfo.type === 'utility' && fileName === 'shaders') {
      fileNodeId = `shader_${fileName}`;
    } else {
      fileNodeId = (fileInfo.functions.has(fileName) || needsSuffix || allSymbolNames.has(fileName))
        ? `${fileName}_file`
        : fileName;
    }
    fileInfo.functions.forEach((funcName) => {
      childToParentMap.set(funcName, { parentId: fileNodeId, parentName: fileName, type: fileInfo.type });
    });
  });
  
  // Map internal helper components to their parent
  internalComponents.forEach((data, fileName) => {
    const parentNeedsSuffix = filesNeedingSuffix.has(data.parent);
    const parentNodeId = parentNeedsSuffix ? `${data.parent}_file` : data.parent;
    data.helpers.forEach((helperComp) => {
      childToParentMap.set(helperComp, { parentId: parentNodeId, parentName: data.parent, type: 'component' });
    });
  });
  
  // Map internal hooks to their parent
  internalHooks.forEach((data, hookName) => {
    const parentNodeId = `${data.parent}_file`;
    childToParentMap.set(hookName, { parentId: parentNodeId, parentName: data.parent, type: data.parentType });
  });

  // Helper function to generate routed connections through parent containers
  // Returns an array of connection strings.
  // Validates that every referenced node ID actually exists in nodeIds so
  // the Merfolk output never contains dangling connection targets (which
  // would cause the 3d-ast-generator validator to reject the entire diagram).
  const generateRoutedConnection = (sourceNode, targetNode, label) => {
    // Quick existence check — sourceNode or targetNode (or their _file
    // variants) must have been emitted as Merfolk node definitions.
    const resolveId = (name) => {
      if (filesNeedingSuffix.has(name)) return `${name}_file`;
      return name;
    };
    const srcId = resolveId(sourceNode);
    const tgtId = resolveId(targetNode);
    if (!nodeIds.has(srcId) && !childToParentMap.has(sourceNode)) {
      // Source is completely unknown — skip silently
      return [];
    }
    if (!nodeIds.has(tgtId) && !childToParentMap.has(targetNode)) {
      // Target is completely unknown — skip silently
      return [];
    }

    const connections = [];
    const sourceParent = childToParentMap.get(sourceNode);
    const targetParent = childToParentMap.get(targetNode);
    
    // Determine source node ID (might need _file suffix)
    let sourceNodeId = sourceNode;
    if (filesNeedingSuffix.has(sourceNode)) {
      sourceNodeId = `${sourceNode}_file`;
    }
    
    // Determine target node ID (might need _file suffix)  
    let targetNodeId = targetNode;
    if (filesNeedingSuffix.has(targetNode)) {
      targetNodeId = `${targetNode}_file`;
    }
    
    if (sourceParent && targetParent) {
      // Both have parents - route through both parent containers
      if (sourceParent.parentId === targetParent.parentId) {
        // Same parent - direct connection within container
        connections.push(`${sourceNodeId} --> ${targetNodeId} : "${label}"`);
      } else {
        // Different parents - route: child -> source parent -> target parent -> target child
        connections.push(`${sourceNodeId} --> ${sourceParent.parentId} : "calls out"`);
        connections.push(`${sourceParent.parentId} --> ${targetParent.parentId} : "${label}"`);
        connections.push(`${targetParent.parentId} --> ${targetNodeId} : "receives"`);
      }
    } else if (sourceParent && !targetParent) {
      // Source has parent, target is standalone - route through source parent
      connections.push(`${sourceNodeId} --> ${sourceParent.parentId} : "calls out"`);
      connections.push(`${sourceParent.parentId} --> ${targetNodeId} : "${label}"`);
    } else if (!sourceParent && targetParent) {
      // Source is standalone, target has parent - route to target parent first
      connections.push(`${sourceNodeId} --> ${targetParent.parentId} : "${label}"`);
      connections.push(`${targetParent.parentId} --> ${targetNodeId} : "receives"`);
    } else {
      // Neither has parent - direct connection
      connections.push(`${sourceNodeId} --> ${targetNodeId} : "${label}"`);
    }
    
    return connections;
  };

  // Add components (no internal functions nested - they'll be connected via arrows)
  // Components that have internal hooks with the same name get _file suffix
  if (elements.components.length > 0) {
    markdown += `%% Components\n`;
    elements.components.forEach((comp) => {
      // Check if this component needs _file suffix due to internal hook with same name
      const needsSuffix = filesNeedingSuffix.has(comp);
      const nodeId = needsSuffix ? `${comp}_file` : comp;
      
      if (nodeIds.has(nodeId)) {
        duplicates.push({ id: nodeId, type: 'Component', section: 'Components' });
        console.warn(`⚠️ DUPLICATE NODE ID: ${nodeId} (Component)`);
        return;
      }
      nodeIds.add(nodeId);
      markdown += `${nodeId}{Component: ${comp}}\n`;
    });
  }

  // Add internal helper components with parent-child relationships
  if (internalComponents.size > 0) {
    markdown += '\n%% Internal Helper Components\n';
    internalComponents.forEach((data, fileName) => {
      // Use the actual parent component (first component found in file)
      const parentComponent = data.parent;
      // Check if parent needs _file suffix
      const parentNeedsSuffix = filesNeedingSuffix.has(parentComponent);
      const parentNodeId = parentNeedsSuffix ? `${parentComponent}_file` : parentComponent;

      data.helpers.forEach((helperComp) => {
        // Prevent self-references
        if (parentComponent === helperComp) {
          console.warn(`⚠️  Skipping self-reference: ${parentComponent} -.-> ${helperComp}`);
          return;
        }
        // Create dashed arrow connection: parent -.-> helper : "internal"
        // This will make markdownDiagramService position the helper inside the parent
        markdown += `${parentNodeId} -.-> ${helperComp} : "internal"\n`;
      });
    });
  }

  // Add functions
  if (elements.functions.length > 0) {
    markdown += `\n%% Functions\n`;
    elements.functions.forEach((func) => {
      if (nodeIds.has(func)) {
        duplicates.push({ id: func, type: 'Function', section: 'Functions' });
        console.warn(`⚠️ DUPLICATE NODE ID: ${func} (Function)`);
        return;
      }
      nodeIds.add(func);
      markdown += `${func}[Function: ${func}]\n`;
    });
  }

  // Add hooks
  if (elements.hooks.length > 0) {
    markdown += `\n%% Hooks\n`;
    elements.hooks.forEach((hook) => {
      if (nodeIds.has(hook)) {
        duplicates.push({ id: hook, type: 'Hook', section: 'Hooks' });
        console.warn(`⚠️ DUPLICATE NODE ID: ${hook} (Hook)`);
        return;
      }
      nodeIds.add(hook);
      // Hook functions are cubes with [Function: name]
      // Only hook FILE CONTAINERS (created later) use [Hook: fileName]
      markdown += `${hook}[Function: ${hook}]\n`;
    });
  }

  // Add internal hooks relationships (hooks inside components/hooks with same name)
  if (internalHooks.size > 0) {
    markdown += '\n%% Internal Hooks (same name as parent)\n';
    internalHooks.forEach((data, hookName) => {
      // The parent needs _file suffix since hook has same name
      const parentNodeId = `${data.parent}_file`;
      // Create dashed arrow for containment
      markdown += `${parentNodeId} -.-> ${hookName} : "internal hook"\n`;
    });
  }

  // Add services
  if (elements.services.length > 0) {
    markdown += `\n%% Services\n`;
    elements.services.forEach((service) => {
      if (nodeIds.has(service)) {
        // Skip duplicate - node already defined, this is just a reference
        return;
      }
      nodeIds.add(service);
      // Service functions are cubes, not tetrahedrons
      // Only service FILE CONTAINERS (created later) are tetrahedrons
      markdown += `${service}[Function: ${service}]\n`;
    });
  }

  // Add stores
  if (elements.stores.length > 0) {
    markdown += `\n%% Stores\n`;
    elements.stores.forEach((store) => {
      if (nodeIds.has(store)) {
        duplicates.push({ id: store, type: 'Store', section: 'Stores' });
        console.warn(`⚠️ DUPLICATE NODE ID: ${store} (Store)`);
        return;
      }
      nodeIds.add(store);
      markdown += `${store}[[Store: ${store}]]\n`;
    });
  }

  // Add utilities (utilities are just top-level functions that get grouped separately)
  if (elements.utilities.length > 0) {
    markdown += `\n%% Utilities\n`;
    elements.utilities.forEach((util) => {
      if (nodeIds.has(util)) {
        // Skip duplicate - node already defined, this is just a reference
        // This is expected when multiple files contain functions with the same name
        return;
      }
      nodeIds.add(util);
      markdown += `${util}[Function: ${util}]\n`;
    });
  }

  // Add classes (non-React classes emitted as [[Class:]] with red color from 3d-ast-generator)
  if (elements.classes.length > 0) {
    markdown += `\n%% Classes\n`;
    elements.classes.forEach((cls) => {
      if (nodeIds.has(cls)) {
        return;
      }
      nodeIds.add(cls);
      markdown += `${cls}[[Class: ${cls}]]\n`;
    });
  }

  // Add exported constants
  if (elements.constants.length > 0) {
    markdown += `\n%% Constants\n`;
    elements.constants.forEach((cnst) => {
      if (nodeIds.has(cnst)) {
        return;
      }
      nodeIds.add(cnst);
      markdown += `${cnst}[Constant: ${cnst}]\n`;
    });
  }

  // Add exported variables
  if (elements.variables.length > 0) {
    markdown += `\n%% Variables\n`;
    elements.variables.forEach((v) => {
      if (nodeIds.has(v)) {
        return;
      }
      nodeIds.add(v);
      markdown += `${v}[Variable: ${v}]\n`;
    });
  }

  // Add interfaces from elements (vanilla/Python repos)
  // React repos emit interfaces via sharedInterfaces later, but elements.interfaces
  // captures those detected in the vanilla AST traversal.
  if (elements.interfaces.length > 0) {
    markdown += `\n%% Interfaces\n`;
    elements.interfaces.forEach((iface) => {
      if (nodeIds.has(iface)) {
        return;
      }
      nodeIds.add(iface);
      markdown += `${iface}[[Interface: ${iface}]]\n`;
    });
  }

  // Add library imports — skip any whose name collides with an already-emitted
  // node (e.g. `fs` might already be declared as a utility from a require binding).
  if (elements.imports.libraries.length > 0) {
    markdown += `\n%% External Libraries\n`;
    elements.imports.libraries.forEach((lib) => {
      if (nodeIds.has(lib)) {
        // Already declared as a different node type — skip to avoid duplicate
        return;
      }
      nodeIds.add(lib);
      markdown += `${lib}<Library: ${lib}>\n`;
    });
  }

  // Add component-function relationships using arrows (for nesting)
  if (componentFunctions.size > 0) {
    markdown += '\n%% Component Internal Functions\n';
    // First declare all component-internal functions as nodes
    const allComponentFunctions = new Set();
    componentFunctions.forEach((functions) => {
      functions.forEach((func) => allComponentFunctions.add(func));
    });
    allComponentFunctions.forEach((func) => {
      if (nodeIds.has(func)) {
        duplicates.push({ id: func, type: 'Function', section: 'Component Internal Functions' });
        console.warn(`⚠️ DUPLICATE NODE ID: ${func} (Component Internal Function)`);
        return;
      }
      nodeIds.add(func);
      markdown += `${func}[Function: ${func}]\n`;
    });

    // Then add arrow relationships with descriptive labels
    markdown += '\n%% Component-Function Relationships\n';
    componentFunctions.forEach((functions, component) => {
      // Check if component needs _file suffix
      const componentNeedsSuffix = filesNeedingSuffix.has(component);
      const componentNodeId = componentNeedsSuffix ? `${component}_file` : component;
      
      functions.forEach((func) => {
        // Generate descriptive relationship label based on function name patterns
        let label = 'internal function';

        // Handle common patterns
        if (func.toLowerCase().includes('handle')) {
          label = 'event handler';
        } else if (func.toLowerCase().includes('render')) {
          label = 'render helper';
        } else if (func.toLowerCase().includes('update')) {
          label = 'update helper';
        } else if (func.toLowerCase().includes('get')) {
          label = 'getter function';
        } else if (func.toLowerCase().includes('set')) {
          label = 'setter function';
        } else if (func.toLowerCase().includes('calculate') || func.toLowerCase().includes('compute')) {
          label = 'calculation helper';
        } else if (func.toLowerCase().includes('should') || func.toLowerCase().includes('is')) {
          label = 'boolean check';
        } else if (func.toLowerCase().includes('debounced')) {
          label = 'debounced helper';
        }

        markdown += `${componentNodeId} -.-> ${func} : "${label}"\n`;
      });
    });
  }

  // Add file-function relationships for hooks/services/utilities/stores
  // Always create a container node for every file (even single-function utility files)
  // so each .js utility file appears as a parent cube with its functions as children.
  // ── Vanilla root entry-point ──────────────────────────────────────────────────
  // For vanilla repos, emit a root Component (dodecahedron) that represents
  // the package entry-point.  All file containers become child Components
  // inside it so the hierarchy builder creates a proper tree.
  let vanillaRootId = null;
  if (isVanilla && fileFunctions.size > 0) {
    vanillaRootId = `${sanitizeNodeId(repoName)}_root`;
    markdown += `\n%% Entry-point root\n`;
    markdown += `${vanillaRootId}{Component: ${repoName}}\n`;
    nodeIds.add(vanillaRootId);
  }

  if (fileFunctions.size > 0) {
    markdown += '\n%% File Container Nodes\n';
    fileFunctions.forEach((fileInfo, fileName) => {
      const needsSuffix = filesNeedingSuffix.has(fileName);
      // Always create a container — use _file suffix when file name matches one of its contained
      // functions (to avoid duplicate node IDs) or when a suffix is otherwise required.
      // Use _file suffix when file name matches one of its contained functions,
      // OR when the ID already exists in nodeIds (e.g. a utility `graph` was
      // emitted earlier and now the `graph.ts` file container would collide).
      const fileNodeId = (fileInfo.functions.has(fileName) || needsSuffix || nodeIds.has(fileName))
        ? `${fileName}_file`
        : fileName;

      // ── Vanilla repos: emit ALL file containers as Components (dodecahedrons)
      // so `positionNodeHierarchy` includes them in the hierarchy tree.
      // React repos keep the original type-specific shapes.
      if (isVanilla) {
        if (nodeIds.has(fileNodeId)) {
          duplicates.push({ id: fileNodeId, type: 'Vanilla File', section: 'File Container Nodes' });
          console.warn(`⚠️ DUPLICATE NODE ID: ${fileNodeId} (Vanilla File)`);
          fileInfo.nodeId = fileNodeId;
        } else {
          nodeIds.add(fileNodeId);
          markdown += `${fileNodeId}{Component: ${fileName}}\n`;
          fileInfo.nodeId = fileNodeId;
        }
      } else if (fileInfo.type === 'backend') {
        // ── React paths (unchanged) ──
        const backendNodeId = `backend_${fileName}`;
        if (nodeIds.has(backendNodeId)) {
          duplicates.push({ id: backendNodeId, type: 'Backend File', section: 'File Container Nodes' });
          console.warn(`⚠️ DUPLICATE NODE ID: ${backendNodeId} (Backend File)`);
          fileInfo.nodeId = backendNodeId;
        } else {
          nodeIds.add(backendNodeId);
          markdown += `${backendNodeId}((Service: ${fileName}))\n`;
          fileInfo.nodeId = backendNodeId;
        }
      } else if (fileInfo.type === 'service') {
        if (nodeIds.has(fileNodeId)) {
          duplicates.push({ id: fileNodeId, type: 'Service File', section: 'File Container Nodes' });
          console.warn(`⚠️ DUPLICATE NODE ID: ${fileNodeId} (Service File)`);
          fileInfo.nodeId = fileNodeId;
        } else {
          nodeIds.add(fileNodeId);
          markdown += `${fileNodeId}((Service: ${fileName}))\n`;
          fileInfo.nodeId = fileNodeId;
        }
      } else if (fileInfo.type === 'hook') {
        if (nodeIds.has(fileNodeId)) {
          duplicates.push({ id: fileNodeId, type: 'Hook File', section: 'File Container Nodes' });
          console.warn(`⚠️ DUPLICATE NODE ID: ${fileNodeId} (Hook File)`);
          fileInfo.nodeId = fileNodeId;
        } else {
          nodeIds.add(fileNodeId);
          markdown += `${fileNodeId}[Hook: ${fileName}]\n`;
          fileInfo.nodeId = fileNodeId;
        }
      } else if (fileInfo.type === 'store') {
        if (nodeIds.has(fileNodeId)) {
          duplicates.push({ id: fileNodeId, type: 'Store File', section: 'File Container Nodes' });
          console.warn(`⚠️ DUPLICATE NODE ID: ${fileNodeId} (Store File)`);
          fileInfo.nodeId = fileNodeId;
        } else {
          nodeIds.add(fileNodeId);
          markdown += `${fileNodeId}[[Store: ${fileName}]]\n`;
          fileInfo.nodeId = fileNodeId;
        }
      } else if (fileInfo.type === 'worker') {
        // Worker files get a worker_ prefix so they are grouped separately
        const workerNodeId = `worker_${fileName}`;
        if (nodeIds.has(workerNodeId)) {
          duplicates.push({ id: workerNodeId, type: 'Worker File', section: 'File Container Nodes' });
          console.warn(`⚠️ DUPLICATE NODE ID: ${workerNodeId} (Worker File)`);
          fileInfo.nodeId = workerNodeId;
        } else {
          nodeIds.add(workerNodeId);
          markdown += `${workerNodeId}[Function: ${fileName}]\n`;
          fileInfo.nodeId = workerNodeId;
        }
      } else {
        // utility (and shaders container)
        // Shader containers get a shader_ prefix for separate grouping
        const utilNodeId = (fileName === 'shaders') ? `shader_${fileName}` : fileNodeId;
        if (nodeIds.has(utilNodeId)) {
          duplicates.push({ id: utilNodeId, type: 'Utility File', section: 'File Container Nodes' });
          console.warn(`⚠️ DUPLICATE NODE ID: ${utilNodeId} (Utility File)`);
          fileInfo.nodeId = utilNodeId;
        } else {
          nodeIds.add(utilNodeId);
          markdown += `${utilNodeId}[Function: ${fileName}]\n`;
          fileInfo.nodeId = utilNodeId;
        }
      }
    });

    // Add file→function connections with dashed arrows (containment)
    markdown += '\n%% File-Function Relationships\n';
    fileFunctions.forEach((fileInfo, fileName) => {
      // Use the stored file node ID (which may have __file suffix)
      const fileNodeId = fileInfo.nodeId;

      fileInfo.functions.forEach((funcName) => {
        // Create connection from file container to each function it contains
        if (fileNodeId) {
          // If the function was never declared as a node (e.g. Firebase onCall wrappers
          // whose CallExpression init is not recognised as a function), declare it now
          // so the connection target is always valid.
          if (!nodeIds.has(funcName)) {
            nodeIds.add(funcName);
            markdown += `${funcName}[Function: ${funcName}]\n`;
          }
          markdown += `${fileNodeId} -.-> ${funcName} : "contains"\n`;
        }
      });
    });

    // Vanilla: nest every file container inside the root entry-point
    // Use SOLID arrows (-->) so the hierarchy builder creates parent-child
    // WITHOUT adding them to internalComponentChildren.  This routes the
    // file-container nodes through the descending-hierarchy positioning
    // branch (depthOffset + grid) instead of the tight 3D-grid branch
    // that clusters internal components at the parent's position.
    if (vanillaRootId) {
      markdown += '\n%% Vanilla hierarchy (root → file containers)\n';
      fileFunctions.forEach((fileInfo) => {
        const fileNodeId = fileInfo.nodeId;
        if (fileNodeId) {
          markdown += `${vanillaRootId} --> ${fileNodeId} : "module"\n`;
        }
      });
    }
  }

  // ── Next.js route hierarchy ──────────────────────────────────────────────
  // Creates a root Component (dodecahedron) representing the Next.js app,
  // then route-segment Components nested in a descending hierarchy that
  // mirrors the file-system routing (app/ or pages/ directory structure).
  // Non-route components/hooks/services/stores keep their normal React
  // shapes and are positioned by the circular group layout as usual.
  if (isNextjs && nextjsRouteMap.size > 0) {
    const nextRootId = `${sanitizeNodeId(repoName)}_root`;
    markdown += `\n%% Next.js Route Hierarchy\n`;

    // Emit root entry-point node
    if (!nodeIds.has(nextRootId)) {
      markdown += `${nextRootId}{Component: ${repoName}}\n`;
      nodeIds.add(nextRootId);
    }

    // Helper: resolve a route fileName to its actual Merfolk node ID.
    // Route files processed via the React AST path are emitted earlier as
    // {Component: name} and may have _file suffixes or be in nodeIds under
    // their plain name.  API routes get a backend_ prefix.
    const resolveRouteNodeId = (fileName) => {
      const info = nextjsRouteMap.get(fileName);
      if (info && info.isApi) {
        const apiId = `backend_${fileName}`;
        if (nodeIds.has(apiId)) return apiId;
      }
      const suffixed = `${fileName}_file`;
      if (nodeIds.has(suffixed)) return suffixed;
      if (nodeIds.has(fileName)) return fileName;
      return null;
    };

    // Group route files by their routePath so we can find layouts & pages
    // that live at the same route level.
    const routeGroups = new Map();
    nextjsRouteMap.forEach((info, fileName) => {
      const rp = info.routePath;
      if (!routeGroups.has(rp)) {
        routeGroups.set(rp, { layouts: [], pages: [], others: [] });
      }
      const group = routeGroups.get(rp);
      if (info.isLayout || info.isAppShell) group.layouts.push(fileName);
      else if (info.isPage) group.pages.push(fileName);
      else group.others.push(fileName);
    });

    // For each route group, the "representative" node is the layout if one
    // exists, otherwise the page.  This is the node that participates in
    // the parent→child hierarchy chain.
    const routeRepresentative = new Map();
    routeGroups.forEach((group, routePath) => {
      const rep = group.layouts[0] || group.pages[0] || group.others[0];
      if (rep) routeRepresentative.set(routePath, rep);
    });

    // Emit route-segment Component nodes for any route file that is NOT
    // already emitted.  Route files processed through the React AST path
    // are already in elements.components and nodeIds.
    nextjsRouteMap.forEach((info, fileName) => {
      const existingId = resolveRouteNodeId(fileName);
      if (existingId) return; // already emitted

      let label = info.segment;
      if (info.isLayout) label = `${info.segment} layout`;
      else if (info.isPage) label = `${info.segment} page`;
      else if (info.isLoading) label = `${info.segment} loading`;
      else if (info.isError) label = `${info.segment} error`;
      else if (info.isNotFound) label = `${info.segment} not-found`;
      else if (info.isMiddleware) label = 'middleware';

      if (info.isApi) {
        const apiId = `backend_${fileName}`;
        if (!nodeIds.has(apiId)) {
          markdown += `${apiId}((Service: ${label}))\n`;
          nodeIds.add(apiId);
        }
      } else {
        markdown += `${fileName}{Component: ${label}}\n`;
        nodeIds.add(fileName);
      }
    });

    // Build hierarchy connections with SOLID arrows (-->) for descending
    // hierarchy positioning (not internalComponentChildren clustering).
    markdown += '\n%% Next.js Route Nesting\n';

    // Connect root to top-level route representative
    const rootRep = routeRepresentative.get('');
    if (rootRep) {
      const rootRepId = resolveRouteNodeId(rootRep);
      if (rootRepId) {
        markdown += `${nextRootId} --> ${rootRepId} : "root layout"\n`;
      }
    }

    // Connect parent routes to child routes
    routeRepresentative.forEach((repFileName, routePath) => {
      if (routePath === '') return;
      const info = nextjsRouteMap.get(repFileName);
      if (!info) return;

      const parentRep = routeRepresentative.get(info.parentRoutePath);
      const childId = resolveRouteNodeId(repFileName);
      if (!childId) return;

      if (parentRep) {
        const parentId = resolveRouteNodeId(parentRep);
        if (parentId) {
          markdown += `${parentId} --> ${childId} : "route"\n`;
        }
      } else {
        // No parent representative found — connect directly to root
        markdown += `${nextRootId} --> ${childId} : "route"\n`;
      }
    });

    // Connect non-representative route files (pages, loading, error) to
    // their route group's representative via dashed containment arrows.
    routeGroups.forEach((group, routePath) => {
      const rep = routeRepresentative.get(routePath);
      if (!rep) return;
      const repId = resolveRouteNodeId(rep);
      if (!repId) return;

      const siblings = [...group.pages, ...group.others].filter(f => f !== rep);
      siblings.forEach((fileName) => {
        const sibId = resolveRouteNodeId(fileName);
        if (sibId && sibId !== repId) {
          markdown += `${repId} -.-> ${sibId} : "contains"\n`;
        }
      });
    });

    console.log(`📁 Next.js route hierarchy: ${nextjsRouteMap.size} route files, ${routeGroups.size} route groups`);
  }

  // Add component-to-component relationships
  if (componentRelationships.size > 0) {
    markdown += '\n%% Component Relationships\n';
    componentRelationships.forEach((usedComponents, component) => {
      usedComponents.forEach((usedComp) => {
        // Check if we have props being passed to this child component
        const propsMap = componentPropsRelationships.get(component);
        let label = 'uses';
        
        if (propsMap && propsMap.has(usedComp)) {
          const props = Array.from(propsMap.get(usedComp));
          // Limit to first 3 props to keep label readable
          const displayProps = props.slice(0, 3);
          if (props.length > 3) {
            label = `${displayProps.join(', ')}...`;
          } else {
            label = displayProps.join(', ');
          }
        } else {
          // Fallback to name-based labels
          if (usedComp.toLowerCase().includes('renderer')) {
            label = 'renders';
          } else if (
            usedComp.toLowerCase().includes('ui') ||
            usedComp.toLowerCase().includes('input') ||
            usedComp.toLowerCase().includes('picker')
          ) {
            label = 'displays UI';
          } else if (usedComp.toLowerCase().includes('camera')) {
            label = 'camera';
          } else if (usedComp.toLowerCase().includes('connection')) {
            label = 'connections';
          }
        }

        // Use routed connections through parent containers
        const routedConnections = generateRoutedConnection(component, usedComp, label);
        routedConnections.forEach(conn => {
          markdown += `${conn}\n`;
        });
      });
    });
  }

  // Add component-to-hook/service/store relationships with detailed labels
  if (componentDependencies.size > 0) {
    markdown += '\n%% Component Dependencies\n';
    componentDependencies.forEach((deps, component) => {
      deps.forEach((dep) => {
        // Check for detailed hook return values
        let label = `uses ${dep.type}`;
        
        if (dep.type === 'hook') {
          const hookReturns = hookReturnValueRelationships.get(component);
          if (hookReturns) {
            for (const hookInfo of hookReturns) {
              if (hookInfo.hook === dep.name && hookInfo.returnValues.length > 0) {
                // Limit to first 3 values for readability
                const displayValues = hookInfo.returnValues.slice(0, 3);
                if (hookInfo.returnValues.length > 3) {
                  label = `{${displayValues.join(', ')}...}`;
                } else {
                  label = `{${displayValues.join(', ')}}`;
                }
                break;
              }
            }
          }
        }
        
        // Use routed connections through parent containers
        const routedConnections = generateRoutedConnection(component, dep.name, label);
        routedConnections.forEach(conn => {
          markdown += `${conn}\n`;
        });
      });
    });
  }

  // Add function call relationships (service/utility calls)
  if (functionCallRelationships.size > 0) {
    markdown += '\n%% Function Call Relationships\n';
    functionCallRelationships.forEach((calls, component) => {
      calls.forEach((callInfo) => {
        // Use routed connections through parent containers
        const routedConnections = generateRoutedConnection(component, callInfo.target, callInfo.label);
        routedConnections.forEach(conn => {
          markdown += `${conn}\n`;
        });
      });
    });
  }

  // Add store usage relationships with state/action details
  if (storeUsageRelationships.size > 0) {
    markdown += '\n%% Store Usage Details\n';
    storeUsageRelationships.forEach((storeMap, component) => {
      storeMap.forEach((usage, storeName) => {
        const allItems = [];
        
        // Add properties (state reads)
        if (usage.properties.size > 0) {
          allItems.push(...Array.from(usage.properties));
        }
        
        // Add actions
        if (usage.actions.size > 0) {
          allItems.push(...Array.from(usage.actions).map(a => `${a}()`));
        }
        
        if (allItems.length > 0) {
          // Limit to first 4 items for readability
          const displayItems = allItems.slice(0, 4);
          let label = displayItems.join(', ');
          if (allItems.length > 4) {
            label += '...';
          }
          // Use routed connections through parent containers
          const routedConnections = generateRoutedConnection(component, storeName, label);
          routedConnections.forEach(conn => {
            markdown += `${conn}\n`;
          });
        }
      });
    });
  }

  // ── API Endpoints ─────────────────────────────────────────────────────────
  if (apiEndpoints.size > 0) {
    markdown += '\n%% API Endpoints\n';
    apiEndpoints.forEach((ep, epKey) => {
      if (!nodeIds.has(epKey)) {
        nodeIds.add(epKey);
        markdown += `${epKey}[Endpoint: ${ep.method} ${ep.path}]\n`;
      }
    });

    markdown += '\n%% API Handler Chains\n';
    apiEndpoints.forEach((ep, epKey) => {
      ep.handlers.forEach((handler) => {
        markdown += `${epKey} --> ${handler} : "handler"\n`;
      });
    });
  }

  // ── Database Models ───────────────────────────────────────────────────────
  if (dbModels.size > 0) {
    markdown += '\n%% Database Models\n';
    dbModels.forEach((_rels, modelName) => {
      const nodeId = `${modelName}_model`;
      if (!nodeIds.has(nodeId)) {
        nodeIds.add(nodeId);
        markdown += `${nodeId}[[Store: ${modelName}]]\n`;
      }
    });

    const hasRelationships = [...dbModels.values()].some(s => s.size > 0);
    if (hasRelationships) {
      markdown += '\n%% Model Relationships\n';
      dbModels.forEach((related, modelName) => {
        const srcId = `${modelName}_model`;
        related.forEach(relName => {
          const tgtId = `${relName}_model`;
          if (nodeIds.has(srcId) && nodeIds.has(tgtId)) {
            markdown += `${srcId} --> ${tgtId} : "references"\n`;
          }
        });
      });
    }
  }

  // ── Auth Guards ───────────────────────────────────────────────────────────
  if (authGuards.size > 0) {
    markdown += '\n%% Auth Guards\n';
    authGuards.forEach(guardName => {
      const nodeId = sanitizeNodeId(guardName);
      if (!nodeIds.has(nodeId)) {
        nodeIds.add(nodeId);
        markdown += `${nodeId}[Guard: ${guardName}]\n`;
      }
    });

    if (authFlows.length > 0) {
      markdown += '\n%% Auth Flows\n';
      authFlows.forEach(({ source, target, label }) => {
        const srcId = sanitizeNodeId(source);
        const tgtId = sanitizeNodeId(target);
        if (nodeIds.has(srcId) || childToParentMap.has(source)) {
          markdown += `${srcId} --> ${tgtId} : "${label}"\n`;
        }
      });
    }
  }

  // ── Events ────────────────────────────────────────────────────────────────
  const allEventNames = new Set([...eventEmitters.keys(), ...eventListeners.keys()]);
  if (allEventNames.size > 0) {
    markdown += '\n%% Events\n';
    allEventNames.forEach(evtName => {
      const nodeId = `${evtName}_event`;
      if (!nodeIds.has(nodeId)) {
        nodeIds.add(nodeId);
        markdown += `${nodeId}((Service: ${evtName}))\n`;
      }
    });

    markdown += '\n%% Event Flows\n';
    eventEmitters.forEach((sources, evtName) => {
      const tgtId = `${evtName}_event`;
      if (!nodeIds.has(tgtId)) return;
      sources.forEach(src => {
        const srcId = sanitizeNodeId(src);
        if (nodeIds.has(srcId) || childToParentMap.has(src)) {
          markdown += `${srcId} --> ${tgtId} : "emits"\n`;
        }
      });
    });
    eventListeners.forEach((sources, evtName) => {
      const evtNodeId = `${evtName}_event`;
      if (!nodeIds.has(evtNodeId)) return;
      sources.forEach(listener => {
        const listId = sanitizeNodeId(listener);
        if (nodeIds.has(listId) || childToParentMap.has(listener)) {
          markdown += `${evtNodeId} --> ${listId} : "listened by"\n`;
        }
      });
    });
  }

  // ── Error Boundaries ──────────────────────────────────────────────────────
  if (errorBoundaries.size > 0 || suspenseBoundaries.size > 0) {
    markdown += '\n%% Error Boundaries\n';
    errorBoundaries.forEach(boundaryName => {
      if (!nodeIds.has(boundaryName)) {
        nodeIds.add(boundaryName);
        markdown += `${boundaryName}[Boundary: ${boundaryName}]\n`;
      }
    });
    suspenseBoundaries.forEach(boundaryId => {
      if (!nodeIds.has(boundaryId)) {
        nodeIds.add(boundaryId);
        markdown += `${boundaryId}[Boundary: Suspense]\n`;
      }
    });

    if (errorContainment.length > 0) {
      markdown += '\n%% Error Containment\n';
      errorContainment.forEach(({ boundary, wraps, label }) => {
        const srcId = sanitizeNodeId(boundary);
        const tgtId = sanitizeNodeId(wraps);
        if ((nodeIds.has(srcId) || childToParentMap.has(boundary)) &&
            (nodeIds.has(tgtId) || childToParentMap.has(wraps))) {
          markdown += `${srcId} -.-> ${tgtId} : "${label}"\n`;
        }
      });
    }
  }

  // ── Shared Interfaces ─────────────────────────────────────────────────────
  if (sharedInterfaces.size > 0) {
    markdown += '\n%% Shared Interfaces\n';
    sharedInterfaces.forEach((sourceFile, ifaceName) => {
      if (!nodeIds.has(ifaceName)) {
        nodeIds.add(ifaceName);
        markdown += `${ifaceName}[[Interface: ${ifaceName}]]\n`;
      }
    });

    if (interfaceUsages.size > 0) {
      markdown += '\n%% Interface Dependencies\n';
      interfaceUsages.forEach((ifaces, consumer) => {
        const srcId = sanitizeNodeId(consumer);
        if (!nodeIds.has(srcId) && !childToParentMap.has(consumer)) return;
        ifaces.forEach(ifaceName => {
          if (nodeIds.has(ifaceName)) {
            markdown += `${srcId} --> ${ifaceName} : "uses type"\n`;
          }
        });
      });
    }
  }

  // Wrap the entire diagram in Merfolk code blocks
  return `\`\`\`merfolk\n${markdown}\`\`\`\n`;
};

/**
 * Get GitHub token from localStorage
 * @returns {string|null} - GitHub access token or null
 */
export const getGithubToken = () => {
  return localStorage.getItem('github_token');
};

/**
 * Set GitHub token in localStorage
 * @param {string} token - GitHub access token
 */
export const setGithubToken = (token) => {
  localStorage.setItem('github_token', token);
};

/**
 * Check if user is authenticated with GitHub
 * @returns {boolean} - True if authenticated
 */
export const isGithubAuthenticated = () => {
  return !!getGithubToken();
};

/**
 * Get GitHub OAuth URL for login
 * Preserves the current page's query parameters (e.g. spaceId) via the
 * OAuth `state` parameter so the user is returned to the same context.
 * @returns {string} - GitHub OAuth URL
 */
export const getGithubOAuthUrl = () => {
  const clientId = 'Ov23liLYzf9WoYPLBNat';
  const redirectUri = window.location.origin + window.location.pathname;

  // Encode current query params (minus any leftover OAuth params) into `state`
  // so we can restore them after the redirect.
  // Include a _source=github marker so handleGithubCallback can distinguish
  // GitHub OAuth redirects from the login app's auth redirects.
  const currentParams = new URLSearchParams(window.location.search);
  currentParams.delete('code');
  currentParams.delete('state');
  currentParams.set('_source', 'github');
  const statePayload = currentParams.toString();

  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(statePayload)}`;
  return url;
};

/**
 * Handle GitHub OAuth callback
 * Exchanges code for token and returns the token
 * @returns {Promise<string|null>} - Access token or null
 */
export const handleGithubCallback = async () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');

  if (!code) {
    return null;
  }

  // Only process if this redirect came from GitHub OAuth (has state with _source=github).
  // Without this check we'd consume ?code= params from the login app's auth redirect.
  const state = params.get('state');
  if (!state || !new URLSearchParams(state).has('_source')) {
    return null;
  }

  // Restore original query params from the OAuth `state` parameter
  const restoredParams = new URLSearchParams(state);
  restoredParams.delete('_source'); // Remove internal marker
  for (const [key, value] of restoredParams) {
    if (!params.has(key)) {
      params.set(key, value);
    }
  }

  try {
    const token = await exchangeGithubCode(code);
    setGithubToken(token);

    // Clean up OAuth params but keep restored params (e.g. spaceId)
    const newUrl = new URL(window.location);
    newUrl.searchParams.delete('code');
    newUrl.searchParams.delete('state');
    // Restore params from state into the URL
    const successParams = new URLSearchParams(state);
    successParams.delete('_source');
    for (const [key, value] of successParams) {
      newUrl.searchParams.set(key, value);
    }
    window.history.replaceState({}, '', newUrl);

    return token;
  } catch (error) {
    console.error('GitHub OAuth flow failed:', error);
    // Clean up the URL even on failure, but keep original params
    const newUrl = new URL(window.location);
    newUrl.searchParams.delete('code');
    newUrl.searchParams.delete('state');
    const failParams = new URLSearchParams(state);
    failParams.delete('_source');
    for (const [key, value] of failParams) {
      newUrl.searchParams.set(key, value);
    }
    window.history.replaceState({}, '', newUrl);
    return null;
  }
};

/**
 * Scan a repository and generate a Merfolk diagram
 * @param {Object} repo - Repository object from GitHub API
 * @param {Function} onCreateObject - Callback to create 3D objects
 * @param {Object} user - User object
 * @param {string} currentSpaceId - Current space ID
 * @param {Function} uploadMarkdownToStorage - Function to upload markdown
 * @param {Object} markdownDiagramService - Markdown diagram service instance
 * @param {Function} onProgress - Optional callback for progress updates (progress: 0-100, stage: string)
 * @returns {Promise<Object>} - Result object with success, objectsCreated, connectionsCreated
 */
export const scanRepositoryAndGenerateDiagram = async (
  repo,
  onCreateObject,
  user,
  currentSpaceId,
  uploadMarkdownToStorage,
  markdownDiagramService,
  onProgress = null
) => {
  const token = getGithubToken();
  if (!token) {
    throw new Error('No GitHub token found');
  }

  try {
    // Capture the commit SHA before scanning so rescans can compare later
    if (onProgress) onProgress(5, 'Recording commit...');
    const commitSha = await fetchLatestCommitSha(repo.owner.login, repo.name, token);

    // Report progress: Fetching repository structure
    if (onProgress) onProgress(10, 'Fetching repository structure...');
    
    // Generate Merfolk markdown from entire repository
    const merfolkMarkdown = await generateMerfolkFromRepository(repo.owner.login, repo.name);
    
    if (onProgress) onProgress(40, 'Analyzing code and generating diagram...');

    // Upload the generated markdown to Firebase Storage
    let storageUrl = null;
    if (user?.uid && currentSpaceId) {
      if (onProgress) onProgress(50, 'Uploading diagram to storage...');
      try {
        storageUrl = await uploadMarkdownToStorage(
          merfolkMarkdown,
          user.uid,
          currentSpaceId,
          `${repo.name}-diagram.md`
        );
      } catch (uploadError) {
        console.error('Failed to upload markdown to storage:', uploadError);
        // Continue with processing even if upload fails
      }
    }
    
    if (onProgress) onProgress(60, 'Processing markdown...');

    // Create a File from the markdown for processing
    const markdownBlob = new Blob([merfolkMarkdown], {
      type: 'text/markdown',
    });
    const markdownFile = new File([markdownBlob], `${repo.name}-diagram.md`, {
      type: 'text/markdown',
    });
    
    if (onProgress) onProgress(70, 'Creating 3D objects...');

    // Use the markdown processing service to handle the upload and creation
    const result = await markdownDiagramService.processMarkdownFile(
      markdownFile,
      onCreateObject,
      currentSpaceId,
      user
    );
    
    if (onProgress) onProgress(90, 'Finalizing diagram...');

    if (!result.success) {
      throw new Error('Diagram generated but no 3D objects were created. Check Merfolk syntax.');
    }
    
    if (onProgress) onProgress(100, 'Complete!');

    // Return the result instead of showing alert
    return {
      success: true,
      objectsCreated: result.objectsCreated,
      connectionsCreated: result.connectionsCreated,
      storageUrl,
      markdown: merfolkMarkdown,
      commitSha,
    };
  } catch (error) {
    console.error('Error generating diagram from repository:', error);
    throw error;
  }
};

// ─── Rescan / Incremental Update Helpers ───────────────────────────────────

/**
 * Extract node IDs from a merfolk markdown string.
 * Matches node declarations like  ID{Component: ...}, ID[Function: ...], etc.
 * @param {string} markdown - Merfolk markdown (may include code fences)
 * @returns {Set<string>} - Set of node ID strings
 */
const extractMerfolkNodeIds = (markdown) => {
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
const filterNewMerfolkNodes = (newContent, existingIds) => {
  const lines = newContent.split('\n');
  const kept = [];
  const nodePattern = /^(\w+)(?:\{|\[\[|\[|\(\(|<)/;
  for (const line of lines) {
    const m = line.match(nodePattern);
    if (m && existingIds.has(m[1])) {
      // Skip duplicate node declaration
      continue;
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

  const existingIds = extractMerfolkNodeIds(existingMarkdown);
  const filteredNew = filterNewMerfolkNodes(newRawContent, existingIds);

  // Only append if there is actual new content after filtering
  const trimmed = filteredNew.replace(/^[\s%]*$/gm, '').trim();
  if (!trimmed) {
    return existingMarkdown; // nothing new to add
  }

  return `\`\`\`merfolk\n${existingContent}\n\n%% === Rescan Additions ===\n${filteredNew}\n\`\`\`\n`;
};

/**
 * Rescan a repository for changes since the last known commit.
 * Uses the GitHub Compare API to fetch only changed files, generates merfolk
 * entries for them, and merges the result into the existing diagram markdown.
 *
 * @param {Object} repo - Repository object (must have repo.owner.login and repo.name)
 * @param {string} lastCommitSha - The commit SHA recorded during the previous scan
 * @param {string|null} existingMarkdown - The existing merfolk markdown (if available)
 * @param {Function} onProgress - Progress callback (progress: 0-100, stage: string)
 * @returns {Promise<Object>} - { noChanges, commitSha, mergedMarkdown, newMarkdown, changedFileCount, addedFiles, modifiedFiles, removedFiles }
 */
export const rescanRepositoryForChanges = async (
  repo,
  lastCommitSha,
  existingMarkdown,
  onProgress = null,
) => {
  const token = getGithubToken();
  if (!token) throw new Error('No GitHub token found');

  const owner = repo.owner.login;
  const repoName = repo.name;

  // 1. Fetch the latest commit SHA
  if (onProgress) onProgress(5, 'Checking for new commits...');
  const currentSha = await fetchLatestCommitSha(owner, repoName, token);

  if (currentSha === lastCommitSha) {
    return { noChanges: true, commitSha: currentSha };
  }

  // 2. Get the list of changed files via Compare API
  if (onProgress) onProgress(15, 'Fetching changes...');
  const changedFiles = await fetchChangedFiles(owner, repoName, lastCommitSha, currentSha, token);

  // Categorise
  const addedFiles = changedFiles.filter(f => f.status === 'added');
  const modifiedFiles = changedFiles.filter(f => f.status === 'modified' || f.status === 'renamed');
  const removedFiles = changedFiles.filter(f => f.status === 'removed');

  // 3. Keep only supported source files (added + modified)
  const sourceFiles = [...addedFiles, ...modifiedFiles]
    .map(f => {
      const type = getFileTypeFromPath(f.filename);
      return type ? { path: f.filename, name: f.name, type } : null;
    })
    .filter(Boolean);

  if (sourceFiles.length === 0) {
    return {
      noChanges: true,
      commitSha: currentSha,
      message: `No supported source files changed (${changedFiles.length} file(s) changed total)`,
    };
  }

  // 4. Detect repo type from the FULL file list in the existing markdown to
  //    avoid misdetection from only a handful of changed files.  We fetch
  //    package.json once (a single lightweight API call) rather than the
  //    entire repo structure.
  if (onProgress) onProgress(20, 'Detecting project type...');
  const detectedRepoType = await detectRepoType(owner, repoName, token, sourceFiles);

  // 5. Generate merfolk from only the changed files
  if (onProgress) onProgress(25, `Analyzing ${sourceFiles.length} changed file(s)...`);
  const newMerfolk = await generateMerfolkFromRepository(owner, repoName, {
    preFilteredFiles: sourceFiles,
    repoType: detectedRepoType,
  });

  // 6. Merge into existing markdown (or use the new markdown as-is)
  let mergedMarkdown;
  if (existingMarkdown) {
    mergedMarkdown = mergeMerfolkMarkdown(existingMarkdown, newMerfolk);
  } else {
    mergedMarkdown = newMerfolk;
  }

  return {
    noChanges: false,
    commitSha: currentSha,
    mergedMarkdown,
    newMerfolk,
    changedFileCount: sourceFiles.length,
    addedFiles: addedFiles.length,
    modifiedFiles: modifiedFiles.length,
    removedFiles: removedFiles.length,
  };
};
