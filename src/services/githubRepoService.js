/**
 * Service for scanning GitHub repositories and generating Merfolk diagram files
 * Handles GitHub OAuth, repository fetching, file analysis, and Merfolk markdown generation
 */
import { parse } from '@babel/parser';

// GitHub OAuth endpoint for token exchange
const GITHUB_TOKEN_EXCHANGE_URL = 'https://fetchgithubtoken-qtk2xsi74a-uc.a.run.app';

// GitHub API base URL
const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Exchange GitHub OAuth code for an access token
 * @param {string} code - The OAuth code from GitHub redirect
 * @returns {Promise<string>} - The access token
 */
export const exchangeGithubCode = async (code) => {
  try {
    // GitHub requires the same redirect_uri used in the authorization request
    const redirectUri = window.location.origin + window.location.pathname;
    const response = await fetch(GITHUB_TOKEN_EXCHANGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirect_uri: redirectUri }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch GitHub token');
    }

    const data = await response.json();
    return data.access_token;
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
const analyzeFile = (filePath) => {
  // Use regex to match folder names at any level, including repo root (no leading slash)
  // e.g. matches both 'utils/foo.js' and 'src/utils/foo.js'
  const isComponent =
    /(?:^|\/)components\//.test(filePath) ||
    filePath.endsWith('/App.jsx') ||
    filePath === 'App.jsx';
  const isHook    = /(?:^|\/)hooks\//.test(filePath);
  const isService = /(?:^|\/)services\//.test(filePath);
  const isStore   = /(?:^|\/)stores\//.test(filePath);
  const isUtil    = /(?:^|\/)utils\//.test(filePath) || /(?:^|\/)helpers\//.test(filePath);
  // Worker folders/files
  const isWorker  = /(?:^|\/)workers\//.test(filePath) || /[Ww]orker\.(js|ts|jsx|tsx)$/.test(filePath);
  // Shader folders/files
  const isShader  = /(?:^|\/)shaders\//.test(filePath) ||
    /\.(glsl|wgsl|hlsl|vert|frag|comp)$/.test(filePath);
  // Backend folders: functions (Firebase/cloud functions), api, server, backend, lambda, routes
  const isBackend = /(?:^|\/)functions\//.test(filePath) ||
    /(?:^|\/)api\//.test(filePath) ||
    /(?:^|\/)server\//.test(filePath) ||
    /(?:^|\/)backend\//.test(filePath) ||
    /(?:^|\/)lambda\//.test(filePath) ||
    /(?:^|\/)routes\//.test(filePath);

  return { isComponent, isHook, isService, isStore, isUtil, isWorker, isShader, isBackend };
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
 * Detect whether a repository uses React or is plain vanilla JS/TS.
 * Checks for JSX/TSX files first (fast path), then inspects package.json.
 * @param {string} owner - Repo owner
 * @param {string} repoName - Repo name
 * @param {string} token - GitHub token
 * @param {Array} structure - Array of file objects from fetchRepositoryStructure
 * @returns {Promise<'react'|'vanilla'>}
 */
const detectRepoType = async (owner, repoName, token, structure) => {
  // Directories that contain example / demo / test code — these shouldn't
  // determine the repo type because library repos often ship a React example
  // even though the library itself is vanilla JS/TS.
  const nonSourceDirPattern = /(?:^|\/)(?:examples?|demos?|samples?|tests?|__tests__|__mocks__|e2e|cypress|fixtures?|stories|storybook)\//i;

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

  // Check package.json for React as a production / peer dependency
  let hasReactDep = false;
  try {
    const pkgContent = await fetchFileContent(owner, repoName, 'package.json', token);
    if (pkgContent) {
      const pkg = JSON.parse(pkgContent);
      const prodDeps = {
        ...(pkg.dependencies || {}),
        ...(pkg.peerDependencies || {}),
      };
      hasReactDep = !!(prodDeps['react'] || prodDeps['react-dom']);
      console.log(`  [detectRepoType] package.json prod/peer deps keys: ${Object.keys(prodDeps).join(', ')}`);
      console.log(`  [detectRepoType] hasReactDep: ${hasReactDep}`);
    } else {
      console.log(`  [detectRepoType] package.json not found or empty`);
    }
  } catch (_e) {
    console.log(`  [detectRepoType] package.json missing or unparseable`);
  }

  if (hasReactDep) {
    console.log(`  [detectRepoType] → react (React found in prod/peer dependencies)`);
    return 'react';
  }
  // .tsx without react in prod deps → treat as vanilla TS
  if (hasTSX && !hasReactDep) {
    console.log('ℹ️  .tsx files found but no React production dependency — treating as vanilla');
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
        // TypeScript-only declarations — skip.
        // Interfaces and type aliases have no runtime representation and
        // would clutter the diagram with non-functional nodes.
      } else if (d.type === 'VariableDeclaration') {
        d.declarations.forEach((vd) => {
          if (!vd.id?.name) return;
          addSymbol(vd.id.name, false);
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
        addSymbol(vd.id.name, false);
      });
    }
  });
};

/**
 * Generate Merfolk markdown from an entire repository
 * @param {string} owner - Repository owner
 * @param {string} repoName - Repository name
 * @returns {Promise<string>} - Merfolk markdown content
 */
export const generateMerfolkFromRepository = async (owner, repoName) => {
  try {
    const token = localStorage.getItem('github_token');
    if (!token) {
      throw new Error('GitHub token not found');
    }

    // Fetch entire repository structure
    const structure = await fetchRepositoryStructure(owner, repoName, token);

    // Log structure breakdown
    const shaderFiles = structure.filter(f => f.type === 'shader');
    const jsFiles = structure.filter(f => f.type === 'file');
    const workerJsFiles = jsFiles.filter(f => /(?:^|\/)workers\//.test(f.path));
    console.log(`📁 Repository structure: ${structure.length} total files`);
    console.log(`   JS/TS files: ${jsFiles.length}, Shader files: ${shaderFiles.length}, Worker JS files: ${workerJsFiles.length}`);
    if (shaderFiles.length > 0) console.log(`   Shaders:`, shaderFiles.map(f => f.path));
    if (workerJsFiles.length > 0) console.log(`   Workers:`, workerJsFiles.map(f => f.path));

    // Detect repo type: 'react' uses the React-specific AST traversal;
    // 'vanilla' uses the file-as-module traversal for plain JS/TS projects.
    const repoType = await detectRepoType(owner, repoName, token, structure);
    console.log(`🔍 Detected repo type: ${repoType}`);

    // For vanilla repos, filter out example/test/debug directories that would
    // pollute the diagram with demo scripts and local variables.  React repos
    // keep these because components in examples can still be meaningful.
    const nonSourceDirPattern = /(?:^|\/)(?:examples?|demos?|samples?|tests?|__tests__|__mocks__|e2e|cypress|fixtures?|stories|storybook)\//i;
    const nonSourceFilePattern = /(?:^|\/)(?:debug[\-_]|test[\-_])/i;
    const filesToProcess = repoType === 'vanilla'
      ? structure.filter(f => !nonSourceDirPattern.test(f.path) && !nonSourceFilePattern.test(f.name))
      : structure;
    if (filesToProcess.length !== structure.length) {
      console.log(`   Filtered ${structure.length - filesToProcess.length} non-source files for vanilla repo (${filesToProcess.length} remaining)`);
    }

    // Define structure to hold ALL found elements across entire repo
    const elements = {
      components: [],
      functions: [],
      hooks: [],
      services: [],
      stores: [],
      utilities: [],
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

          const fileContext = analyzeFile(file.path);

          // Extract file name without extension for file-level tracking
          // Sanitize to remove hyphens/dots that break Merfolk node-ID syntax
          const fileName = sanitizeNodeId(
            file.path.split('/').pop().replace(/\.(jsx?|tsx?|glsl|wgsl|hlsl|vert|frag|comp)$/, '')
          );

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
                    // Skip event handlers (handleX, onX) and trivial names
                    const isEventHandler = /^(handle|on)[A-Z]/.test(funcName);
                    const isTrivial = funcName.length <= 2;

                    if (!isEventHandler && !isTrivial) {
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
                          // Only track functions that look meaningful (not event handlers or callbacks)
                          // Skip functions starting with 'handle', 'on', or single-letter names
                          const isEventHandler = /^(handle|on)[A-Z]/.test(varName);
                          const isTrivial = varName.length <= 2;

                          if (!isEventHandler && !isTrivial && isFunction) {
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

              // Check for class declarations (React components)
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
                } else if (fileContext.isUtil && !foundItems.utilities.has(className)) {
                  // Classes in util files are utilities
                  foundItems.utilities.add(className);
                  elements.utilities.push(className);
                  // Track file→function relationship
                  if (!fileFunctions.has(fileName)) {
                    fileFunctions.set(fileName, { type: 'utility', functions: new Set() });
                  }
                  fileFunctions.get(fileName).functions.add(className);
                } else if (fileContext.isBackend) {
                  // Classes in backend files are tracked under backend_ container
                  if (!foundItems.services.has(className)) {
                    foundItems.services.add(className);
                    elements.services.push(className);
                  }
                  if (!fileFunctions.has(fileName)) {
                    fileFunctions.set(fileName, { type: 'backend', functions: new Set() });
                  }
                  fileFunctions.get(fileName).functions.add(className);
                } else if (fileContext.isService && !foundItems.services.has(className)) {
                  // Classes in service files are services
                  foundItems.services.add(className);
                  elements.services.push(className);
                  // Track file→function relationship
                  if (!fileFunctions.has(fileName)) {
                    fileFunctions.set(fileName, { type: 'service', functions: new Set() });
                  }
                  fileFunctions.get(fileName).functions.add(className);
                } else if (fileContext.isWorker && !foundItems.utilities.has(className)) {
                  // Classes in worker files are utilities under a worker container
                  foundItems.utilities.add(className);
                  elements.utilities.push(className);
                  // Track file→function relationship
                  if (!fileFunctions.has(fileName)) {
                    fileFunctions.set(fileName, { type: 'worker', functions: new Set() });
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

    // ── Vanilla post-processing: convert inter-module imports to connections ──
    // Each file container that imports another known file container gets a
    // directed 'imports' connection so the 3D diagram shows module dependencies.
    if (repoType === 'vanilla') {
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
      moduleImportRelationships
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
 * @param {'react'|'vanilla'} repoType - Detected repository type
 * @param {Map} moduleImportRelationships - sourceFile -> Set<importedFileBase>
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
  moduleImportRelationships = new Map()
) => {
  const isVanilla = repoType === 'vanilla';
  let markdown = `%% ${repoName} Repository Analysis\n\n`;

  // Remove duplicates from all arrays (use Sets to ensure uniqueness)
  elements.components = [...new Set(elements.components)];
  elements.functions = [...new Set(elements.functions)];
  elements.hooks = [...new Set(elements.hooks)];
  elements.services = [...new Set(elements.services)];
  elements.stores = [...new Set(elements.stores)];
  elements.utilities = [...new Set(elements.utilities)];
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
        }
        nodeIds.add(fileNodeId);
        markdown += `${fileNodeId}{Component: ${fileName}}\n`;
        fileInfo.nodeId = fileNodeId;
      } else if (fileInfo.type === 'backend') {
        // ── React paths (unchanged) ──
        const backendNodeId = `backend_${fileName}`;
        if (nodeIds.has(backendNodeId)) {
          duplicates.push({ id: backendNodeId, type: 'Backend File', section: 'File Container Nodes' });
          console.warn(`⚠️ DUPLICATE NODE ID: ${backendNodeId} (Backend File)`);
        }
        nodeIds.add(backendNodeId);
        markdown += `${backendNodeId}((Service: ${fileName}))\n`;
        fileInfo.nodeId = backendNodeId;
      } else if (fileInfo.type === 'service') {
        if (nodeIds.has(fileNodeId)) {
          duplicates.push({ id: fileNodeId, type: 'Service File', section: 'File Container Nodes' });
          console.warn(`⚠️ DUPLICATE NODE ID: ${fileNodeId} (Service File)`);
        }
        nodeIds.add(fileNodeId);
        markdown += `${fileNodeId}((Service: ${fileName}))\n`;
        fileInfo.nodeId = fileNodeId;
      } else if (fileInfo.type === 'hook') {
        if (nodeIds.has(fileNodeId)) {
          duplicates.push({ id: fileNodeId, type: 'Hook File', section: 'File Container Nodes' });
          console.warn(`⚠️ DUPLICATE NODE ID: ${fileNodeId} (Hook File)`);
        }
        nodeIds.add(fileNodeId);
        markdown += `${fileNodeId}[Hook: ${fileName}]\n`;
        fileInfo.nodeId = fileNodeId;
      } else if (fileInfo.type === 'store') {
        if (nodeIds.has(fileNodeId)) {
          duplicates.push({ id: fileNodeId, type: 'Store File', section: 'File Container Nodes' });
          console.warn(`⚠️ DUPLICATE NODE ID: ${fileNodeId} (Store File)`);
        }
        nodeIds.add(fileNodeId);
        markdown += `${fileNodeId}[[Store: ${fileName}]]\n`;
        fileInfo.nodeId = fileNodeId;
      } else if (fileInfo.type === 'worker') {
        // Worker files get a worker_ prefix so they are grouped separately
        const workerNodeId = `worker_${fileName}`;
        if (nodeIds.has(workerNodeId)) {
          duplicates.push({ id: workerNodeId, type: 'Worker File', section: 'File Container Nodes' });
          console.warn(`⚠️ DUPLICATE NODE ID: ${workerNodeId} (Worker File)`);
        }
        nodeIds.add(workerNodeId);
        markdown += `${workerNodeId}[Function: ${fileName}]\n`;
        fileInfo.nodeId = workerNodeId;
      } else {
        // utility (and shaders container)
        // Shader containers get a shader_ prefix for separate grouping
        const utilNodeId = (fileName === 'shaders') ? `shader_${fileName}` : fileNodeId;
        if (nodeIds.has(utilNodeId)) {
          duplicates.push({ id: utilNodeId, type: 'Utility File', section: 'File Container Nodes' });
          console.warn(`⚠️ DUPLICATE NODE ID: ${utilNodeId} (Utility File)`);
        }
        nodeIds.add(utilNodeId);
        markdown += `${utilNodeId}[Function: ${fileName}]\n`;
        fileInfo.nodeId = utilNodeId;
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
  const currentParams = new URLSearchParams(window.location.search);
  currentParams.delete('code');
  currentParams.delete('state');
  const statePayload = currentParams.toString();

  let url = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo&redirect_uri=${encodeURIComponent(redirectUri)}`;
  if (statePayload) {
    url += `&state=${encodeURIComponent(statePayload)}`;
  }
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

  // Restore original query params from the OAuth `state` parameter
  const state = params.get('state');
  if (state) {
    const restoredParams = new URLSearchParams(state);
    for (const [key, value] of restoredParams) {
      if (!params.has(key)) {
        params.set(key, value);
      }
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
    if (state) {
      const restoredParams = new URLSearchParams(state);
      for (const [key, value] of restoredParams) {
        newUrl.searchParams.set(key, value);
      }
    }
    window.history.replaceState({}, '', newUrl);

    return token;
  } catch (error) {
    console.error('GitHub OAuth flow failed:', error);
    // Clean up the URL even on failure, but keep original params
    const newUrl = new URL(window.location);
    newUrl.searchParams.delete('code');
    newUrl.searchParams.delete('state');
    if (state) {
      const restoredParams = new URLSearchParams(state);
      for (const [key, value] of restoredParams) {
        newUrl.searchParams.set(key, value);
      }
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
      markdown: merfolkMarkdown
    };
  } catch (error) {
    console.error('Error generating diagram from repository:', error);
    throw error;
  }
};
