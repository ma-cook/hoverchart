import { useUIOverlayStore } from '../stores';
import useConnectionStore from '../stores/connectionStore';
import { useRef, useCallback, useEffect, useState } from 'react';
import {
  uploadModelToStorage,
  uploadMarkdownToStorage,
} from '../services/storageService';
import { screenRecorder } from '../services/screenRecordingService';
import { markdownDiagramService } from '../services/markdownDiagramService';
import { setCellBoundariesVisible } from '../stores/uiOverlayStore';
import * as THREE from 'three';
import { parse } from '@babel/parser';

const UIOverlay = ({
  onCreateObject,

  user,
  onLogin,
  isAuthReady,
  isLoading,
  showLoginButton,
  isConnectMode,
  currentCell, // Add currentCell prop
  currentSpaceId, // Add currentSpaceId prop for model uploads
}) => {
  // Use UI overlay store
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [showRepos, setShowRepos] = useState(false);
  const [isGithubAuthenticated, setIsGithubAuthenticated] = useState(false);
  const toggleMenu = useUIOverlayStore((state) => state.toggleMenu);
  const toggleTemplate = useUIOverlayStore((state) => state.toggleTemplate);
  const updateTemplateConfig = useUIOverlayStore(
    (state) => state.updateTemplateConfig
  );

  // Operation states from store
  const isUploadingModel = useUIOverlayStore(
    (state) => state.getUIOverlay('main').isUploadingModel
  );
  const isProcessingMarkdown = useUIOverlayStore(
    (state) => state.getUIOverlay('main').isProcessingMarkdown
  );
  const isRecording = useUIOverlayStore(
    (state) => state.getUIOverlay('main').isRecording
  );
  const setIsUploadingModel = useUIOverlayStore(
    (state) => state.setIsUploadingModel
  );
  const setIsProcessingMarkdown = useUIOverlayStore(
    (state) => state.setIsProcessingMarkdown
  );
  const setIsRecording = useUIOverlayStore((state) => state.setIsRecording);

  // Connection store for toggling connection visibility
  const connectionsVisible = useConnectionStore(
    (state) => state.connectionsVisible
  );
  const toggleConnectionsVisible = useConnectionStore(
    (state) => state.toggleConnectionsVisible
  );

  // Model upload functionality
  const modelFileInputRef = useRef(null);

  // Markdown upload functionality
  const markdownFileInputRef = useRef(null);

  const cellBoundariesVisible = useUIOverlayStore((state) => {
    const overlay = state.overlays['main'];
    return overlay ? overlay.cellBoundariesVisible : false;
  });

  // Add this handler function
  const handleCellBoundariesToggle = useCallback(() => {
    setCellBoundariesVisible('main', !cellBoundariesVisible);
  }, [cellBoundariesVisible]);

  const exchangeGithubCode = async (code) => {
    try {
      const response = await fetch(
        'https://fetchgithubtoken-qtk2xsi74a-uc.a.run.app',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        }
      );

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

  // Function to fetch repositories
  const fetchRepositories = async () => {
    const token = localStorage.getItem('github_token');
    if (!token) {
      alert('Please log in to GitHub first.');
      return;
    }

    try {
      const response = await fetch('https://api.github.com/user/repos', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch repositories');
      }

      const repos = await response.json();
      setRepositories(repos);
    } catch (error) {
      console.error('Error fetching repositories:', error);
    }
  };

  // Helper function to fetch file content from GitHub API
  const fetchFileContent = async (owner, repoName, filePath, token) => {
    try {
      const url = `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3.raw', // Get raw content directly
        },
      });

      if (!response.ok) {
        console.warn(
          `⚠️  GitHub API error for ${filePath}: ${response.status}`
        );
        return null;
      }

      // Get the raw text content
      const fileText = await response.text();

      // Return the text content
      return fileText;
    } catch (error) {
      console.warn(`⚠️  Error fetching ${filePath}:`, error.message);
      return null;
    }
  };

  // Helper function to recursively fetch repository structure
  const fetchRepositoryStructure = async (
    owner,
    repoName,
    token,
    path = ''
  ) => {
    try {
      const url = `https://api.github.com/repos/${owner}/${repoName}/contents/${path}`;
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
          const subItems = await fetchRepositoryStructure(
            owner,
            repoName,
            token,
            item.path
          );
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
        }
      }

      return structure;
    } catch (error) {
      console.error(`Error fetching repository structure for ${path}:`, error);
      return [];
    }
  };

  // Function to generate Merfolk markdown from entire repository
  const generateMerfolkFromJsx = async (owner, repoName) => {
    try {
      const token = localStorage.getItem('github_token');
      if (!token) {
        throw new Error('GitHub token not found');
      }

      // Fetch entire repository structure
      const structure = await fetchRepositoryStructure(owner, repoName, token);

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

      // Helper to determine file context
      const analyzeFile = (filePath) => {
        // Only treat files in /components/ or App.jsx as component files
        const isComponent =
          filePath.includes('/components/') ||
          filePath.endsWith('/App.jsx') ||
          filePath === 'App.jsx';
        const isHook = filePath.includes('/hooks/');
        const isService = filePath.includes('/services/');
        const isStore = filePath.includes('/stores/');
        const isUtil =
          filePath.includes('/utils/') || filePath.includes('/helpers/');

        return { isComponent, isHook, isService, isStore, isUtil };
      };

      // Process files in parallel batches for better performance
      const BATCH_SIZE = 10; // Process 10 files at a time
      const batches = [];
      for (let i = 0; i < structure.length; i += BATCH_SIZE) {
        batches.push(structure.slice(i, i + BATCH_SIZE));
      }

    

      for (const batch of batches) {
        // Process all files in this batch in parallel
        await Promise.all(
          batch.map(async (file) => {
            const fileContent = await fetchFileContent(
              owner,
              repoName,
              file.path,
              token
            );
            if (!fileContent) {
              return; // Changed from 'continue' to 'return' for Promise.all
            }

            const fileContext = analyzeFile(file.path);

            // Extract file name without extension for file-level tracking
            const fileName = file.path.split('/').pop().replace(/\.(jsx?|tsx?)$/, '');

            try {
              // Parse the file content into an AST with more lenient settings
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

              let currentComponent = null;
              const fileImports = {
                stores: [],
                services: [],
                hooks: [],
                utilities: [],
              }; // Track imports per file
              
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
                    if (node.declaration.arguments && node.declaration.arguments[0]?.type === 'Identifier') {
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
                  // Track imports from stores, services, hooks, and utilities for later association
                  else if (node.specifiers) {
                    node.specifiers.forEach((spec) => {
                      if (spec.imported || spec.local) {
                        const importedName =
                          spec.imported?.name || spec.local?.name;

                        // Check if it's from stores
                        if (source.includes('/stores/')) {
                          fileImports.stores.push(importedName);
                        }
                        // Check if it's from services
                        else if (source.includes('/services/')) {
                          fileImports.services.push(importedName);
                        }
                        // Check if it's from hooks
                        else if (source.includes('/hooks/')) {
                          fileImports.hooks.push(importedName);
                        }
                        // Check if it's from utils/helpers - NEW
                        else if (
                          source.includes('/utils/') ||
                          source.includes('/helpers/')
                        ) {
                          if (!fileImports.utilities) {
                            fileImports.utilities = [];
                          }
                          fileImports.utilities.push(importedName);
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

                  // Check if function contains JSX (returns JSX elements)
                  const containsJSX = (node) => {
                    if (!node) return false;

                    // Explicit JSX elements
                    if (
                      node.type === 'JSXElement' ||
                      node.type === 'JSXFragment'
                    )
                      return true;

                    // Return statements
                    if (node.type === 'ReturnStatement' && node.argument) {
                      return containsJSX(node.argument);
                    }

                    // Block statements (function bodies) - check ALL statements, not just some
                    if (node.type === 'BlockStatement' && node.body) {
                      return node.body.some((stmt) => containsJSX(stmt));
                    }

                    // If statements - check both consequent and alternate
                    if (node.type === 'IfStatement') {
                      return (
                        containsJSX(node.consequent) ||
                        (node.alternate && containsJSX(node.alternate))
                      );
                    }

                    // Conditional expressions (ternary)
                    if (node.type === 'ConditionalExpression') {
                      return (
                        containsJSX(node.consequent) ||
                        containsJSX(node.alternate)
                      );
                    }

                    // Logical expressions (&& ||)
                    if (node.type === 'LogicalExpression') {
                      return containsJSX(node.left) || containsJSX(node.right);
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
                          return containsJSX(node.arguments[0]);
                        }
                      }
                      // React.createElement or similar
                      if (
                        node.callee?.name === 'createElement' ||
                        node.callee?.object?.name === 'React'
                      ) {
                        return true;
                      }
                      // React.memo wrapping
                      if (
                        node.callee?.object?.name === 'React' &&
                        node.callee?.property?.name === 'memo' &&
                        node.arguments &&
                        node.arguments[0]
                      ) {
                        return containsJSX(node.arguments[0]);
                      }
                    }

                    // Arrow function expressions
                    if (node.type === 'ArrowFunctionExpression') {
                      return containsJSX(node.body);
                    }

                    // Function expressions
                    if (node.type === 'FunctionExpression') {
                      return containsJSX(node.body);
                    }

                    return false;
                  }; // Categorize based on file context, naming, AND JSX usage
                  if (
                    looksLikeComponent &&
                    !funcName.startsWith('use') &&
                    fileContext.isComponent &&
                    containsJSX(node.body)
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
                        componentDependencies
                          .get(funcName)
                          .add({ name: store, type: 'store' })
                      );
                      fileImports.services.forEach((service) =>
                        componentDependencies
                          .get(funcName)
                          .add({ name: service, type: 'service' })
                      );
                      fileImports.hooks.forEach((hook) =>
                        componentDependencies
                          .get(funcName)
                          .add({ name: hook, type: 'hook' })
                      );
                      fileImports.utilities.forEach((utility) =>
                        componentDependencies
                          .get(funcName)
                          .add({ name: utility, type: 'utility' })
                      );
                    }
                    // Traverse function body with component context
                    if (node.body) {
                      traverse(node.body, true);
                    }
                  } else if (funcName.startsWith('use') || fileContext.isHook) {
                    // Hooks: either start with 'use' OR are in /hooks/ folder
                    if (!foundItems.hooks.has(funcName)) {
                      foundItems.hooks.add(funcName);
                      elements.hooks.push(funcName);
                      // Track file→function relationship
                      if (!fileFunctions.has(fileName)) {
                        fileFunctions.set(fileName, { type: 'hook', functions: new Set() });
                      }
                      fileFunctions.get(fileName).functions.add(funcName);
                    }
                  } else if (fileContext.isService) {
                    if (!foundItems.services.has(funcName)) {
                      foundItems.services.add(funcName);
                      elements.services.push(funcName);
                      // Track file→function relationship
                      if (!fileFunctions.has(fileName)) {
                        fileFunctions.set(fileName, { type: 'service', functions: new Set() });
                      }
                      fileFunctions.get(fileName).functions.add(funcName);
                    }
                  } else if (fileContext.isUtil) {
                    if (!foundItems.utilities.has(funcName)) {
                      foundItems.utilities.add(funcName);
                      elements.utilities.push(funcName);
                      // Track file→function relationship
                      if (!fileFunctions.has(fileName)) {
                        fileFunctions.set(fileName, { type: 'utility', functions: new Set() });
                      }
                      fileFunctions.get(fileName).functions.add(funcName);
                    }
                  } else {
                    // Default: treat as function
                    // If we're inside a component OR in a component file, track this function as belonging to it
                    if (
                      (parentIsComponent || fileContext.isComponent) &&
                      currentComponent
                    ) {
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
                          componentFunctions
                            .get(currentComponent)
                            .add(prefixedFuncName);
                        }
                      }
                    } else if (fileContext.isUtil) {
                      // Functions in utility files should be utilities, not general functions
                      if (!foundItems.utilities.has(funcName)) {
                        foundItems.utilities.add(funcName);
                        elements.utilities.push(funcName);
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
                        // Wrapped in useCallback, useMemo, etc.
                        else if (
                          decl.init.type === 'CallExpression' &&
                          decl.init.callee &&
                          decl.init.callee.type === 'Identifier' &&
                          (decl.init.callee.name === 'useCallback' ||
                            decl.init.callee.name === 'useMemo') &&
                          decl.init.arguments &&
                          decl.init.arguments.length > 0 &&
                          (decl.init.arguments[0].type ===
                            'ArrowFunctionExpression' ||
                            decl.init.arguments[0].type ===
                              'FunctionExpression')
                        ) {
                          isFunction = true;
                          actualInit = decl.init.arguments[0]; // Get the inner function
                        }
                        // Wrapped in React.memo
                        else if (
                          decl.init.type === 'CallExpression' &&
                          decl.init.callee &&
                          decl.init.callee.type === 'MemberExpression' &&
                          decl.init.callee.object?.name === 'React' &&
                          decl.init.callee.property?.name === 'memo' &&
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

                        // Check if function contains JSX (same check as above)
                        const containsJSX = (node) => {
                          if (!node) return false;

                          // Explicit JSX elements
                          if (
                            node.type === 'JSXElement' ||
                            node.type === 'JSXFragment'
                          )
                            return true;

                          // Return statements
                          if (
                            node.type === 'ReturnStatement' &&
                            node.argument
                          ) {
                            return containsJSX(node.argument);
                          }

                          // Block statements - check ALL statements
                          if (node.type === 'BlockStatement' && node.body) {
                            return node.body.some((stmt) => containsJSX(stmt));
                          }

                          // If statements - check both branches
                          if (node.type === 'IfStatement') {
                            return (
                              containsJSX(node.consequent) ||
                              (node.alternate && containsJSX(node.alternate))
                            );
                          }

                          // Conditional expressions
                          if (node.type === 'ConditionalExpression') {
                            return (
                              containsJSX(node.consequent) ||
                              containsJSX(node.alternate)
                            );
                          }

                          // Logical expressions
                          if (node.type === 'LogicalExpression') {
                            return (
                              containsJSX(node.left) || containsJSX(node.right)
                            );
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
                                return containsJSX(node.arguments[0]);
                              }
                            }
                            // React.createElement or similar
                            if (
                              node.callee?.name === 'createElement' ||
                              node.callee?.object?.name === 'React'
                            ) {
                              return true;
                            }
                            // React.memo wrapping
                            if (
                              node.callee?.object?.name === 'React' &&
                              node.callee?.property?.name === 'memo' &&
                              node.arguments &&
                              node.arguments[0]
                            ) {
                              return containsJSX(node.arguments[0]);
                            }
                          }

                          // Arrow function expressions
                          if (node.type === 'ArrowFunctionExpression') {
                            return containsJSX(node.body);
                          }

                          // Function expressions
                          if (node.type === 'FunctionExpression') {
                            return containsJSX(node.body);
                          }

                          // Identifiers - could be children prop or component variable
                          if (
                            fileContext.isComponent &&
                            node.type === 'Identifier'
                          ) {
                            if (node.name === 'children') return true;
                          }

                          // Member expressions - props.children, etc.
                          if (
                            fileContext.isComponent &&
                            node.type === 'MemberExpression'
                          ) {
                            if (node.property?.name === 'children') return true;
                          }

                          // Null literal - components can return null
                          if (
                            node.type === 'NullLiteral' &&
                            fileContext.isComponent
                          ) {
                            return true;
                          }

                          return false;
                        };

                        // Categorize based on file context, naming, AND JSX usage
                        // Check the actualInit (unwrapped function) for JSX
                        if (
                          looksLikeComponent &&
                          !varName.startsWith('use') &&
                          fileContext.isComponent &&
                          containsJSX(actualInit.body || actualInit)
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
                              componentDependencies
                                .get(varName)
                                .add({ name: store, type: 'store' })
                            );
                            fileImports.services.forEach((service) =>
                              componentDependencies
                                .get(varName)
                                .add({ name: service, type: 'service' })
                            );
                            fileImports.hooks.forEach((hook) =>
                              componentDependencies
                                .get(varName)
                                .add({ name: hook, type: 'hook' })
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
                        } else if (
                          varName.startsWith('use') ||
                          fileContext.isHook
                        ) {
                          // Hooks: either start with 'use' OR are in /hooks/ folder
                          if (!foundItems.hooks.has(varName)) {
                            foundItems.hooks.add(varName);
                            elements.hooks.push(varName);
                            // Track file→function relationship
                            if (!fileFunctions.has(fileName)) {
                              fileFunctions.set(fileName, { type: 'hook', functions: new Set() });
                            }
                            fileFunctions.get(fileName).functions.add(varName);
                          }
                        } else if (fileContext.isService) {
                          if (!foundItems.services.has(varName)) {
                            foundItems.services.add(varName);
                            elements.services.push(varName);
                            // Track file→function relationship
                            if (!fileFunctions.has(fileName)) {
                              fileFunctions.set(fileName, { type: 'service', functions: new Set() });
                            }
                            fileFunctions.get(fileName).functions.add(varName);
                          }
                        } else if (fileContext.isStore) {
                          if (!foundItems.stores.has(varName)) {
                            foundItems.stores.add(varName);
                            elements.stores.push(varName);
                            // Track file→function relationship
                            if (!fileFunctions.has(fileName)) {
                              fileFunctions.set(fileName, { type: 'store', functions: new Set() });
                            }
                            fileFunctions.get(fileName).functions.add(varName);
                          }
                        } else if (fileContext.isUtil) {
                          if (!foundItems.utilities.has(varName)) {
                            foundItems.utilities.add(varName);
                            elements.utilities.push(varName);
                            // Track file→function relationship
                            if (!fileFunctions.has(fileName)) {
                              fileFunctions.set(fileName, { type: 'utility', functions: new Set() });
                            }
                            fileFunctions.get(fileName).functions.add(varName);
                          }
                        } else {
                          // Default: treat as function
                          // If we're inside a component OR in a component file, track this function as belonging to it
                          if (
                            (parentIsComponent || fileContext.isComponent) &&
                            currentComponent
                          ) {
                            // Only track functions that look meaningful (not event handlers or callbacks)
                            // Skip functions starting with 'handle', 'on', or single-letter names
                            const isEventHandler = /^(handle|on)[A-Z]/.test(
                              varName
                            );
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
                                componentFunctions
                                  .get(currentComponent)
                                  .add(prefixedVarName);
                              }
                            }
                          } else if (fileContext.isUtil && isFunction) {
                            // Functions in utility files should be utilities, not general functions
                            if (!foundItems.utilities.has(varName)) {
                              foundItems.utilities.add(varName);
                              elements.utilities.push(varName);
                              // Track file→function relationship
                              if (!fileFunctions.has(fileName)) {
                                fileFunctions.set(fileName, { type: 'utility', functions: new Set() });
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
                      // Check for store definitions (e.g., create with zustand)
                      // Only detect actual store creation calls, not all CallExpressions
                      else if (
                        fileContext.isStore &&
                        decl.init &&
                        decl.init.type === 'CallExpression' &&
                        decl.init.callee &&
                        decl.init.callee.type === 'Identifier' &&
                        decl.init.callee.name === 'create'
                      ) {
                        if (!foundItems.stores.has(varName)) {
                          foundItems.stores.add(varName);
                          elements.stores.push(varName);
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
                      componentDependencies
                        .get(className)
                        .add({ name: store, type: 'store' })
                    );
                    fileImports.services.forEach((service) =>
                      componentDependencies
                        .get(className)
                        .add({ name: service, type: 'service' })
                    );
                    fileImports.hooks.forEach((hook) =>
                      componentDependencies
                        .get(className)
                        .add({ name: hook, type: 'hook' })
                    );
                    fileImports.utilities.forEach((utility) =>
                      componentDependencies
                        .get(className)
                        .add({ name: utility, type: 'utility' })
                    );
                  } else if (
                    fileContext.isUtil &&
                    !foundItems.utilities.has(className)
                  ) {
                    // Classes in util files are utilities
                    foundItems.utilities.add(className);
                    elements.utilities.push(className);
                    // Track file→function relationship
                    if (!fileFunctions.has(fileName)) {
                      fileFunctions.set(fileName, { type: 'utility', functions: new Set() });
                    }
                    fileFunctions.get(fileName).functions.add(className);
                  } else if (
                    fileContext.isService &&
                    !foundItems.services.has(className)
                  ) {
                    // Classes in service files are services
                    foundItems.services.add(className);
                    elements.services.push(className);
                    // Track file→function relationship
                    if (!fileFunctions.has(fileName)) {
                      fileFunctions.set(fileName, { type: 'service', functions: new Set() });
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
                    else if (
                      openingElement.name.type === 'JSXMemberExpression'
                    ) {
                      jsxName = openingElement.name.property.name;
                    }

                    // Track all custom components (starts with uppercase) - we'll filter later
                    if (jsxName && jsxName[0] === jsxName[0].toUpperCase()) {
                      if (!componentRelationships.has(currentComponent)) {
                        componentRelationships.set(currentComponent, new Set());
                      }
                      componentRelationships.get(currentComponent).add(jsxName);
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
                      componentDependencies
                        .get(currentComponent)
                        .add({ name: calleeName, type: 'hook' });
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
                  const helperComponents = fileComponents.filter(comp => comp !== exportedComponent);
                  
                  if (helperComponents.length > 0) {
                    internalComponents.set(fileName, {
                      parent: exportedComponent,
                      helpers: new Set(helperComponents)
                    });
                   
                  }
                } else {
                  // No export found, use last component as parent (likely the main one)
                  const parentComponent = fileComponents[fileComponents.length - 1];
                  const helperComponents = fileComponents.slice(0, -1);
                  
                  if (helperComponents.length > 0) {
                    internalComponents.set(fileName, {
                      parent: parentComponent,
                      helpers: new Set(helperComponents)
                    });
                   
                  }
                }
              }
            } catch {
              // Silently skip files that can't be parsed
              return; // Changed from 'continue' for Promise.all
            }
          })
        );
      }

      // Generate Merfolk markdown
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
          console.warn(
            `⚠️ INVALID COMPONENT (not uppercase): "${comp}" - first char: "${comp[0]}"`
          );
        }
      });

      // SAFETY FILTER: Remove any components that don't start with uppercase letter
      const validComponents = elements.components.filter((comp) =>
        /^[A-Z]/.test(comp)
      );
      const invalidComponents = elements.components.filter(
        (comp) => !/^[A-Z]/.test(comp)
      );

      if (invalidComponents.length > 0) {
        console.warn(
          `🚫 FILTERED OUT ${invalidComponents.length} invalid components:`,
          invalidComponents
        );
      }

      elements.components = validComponents;

      // Remove cross-category duplicates (prioritize more specific categories)
      // Remove services/utilities that are in stores
      const storesSet = new Set(elements.stores);
      elements.services = elements.services.filter(
        (item) => !storesSet.has(item)
      );
      elements.utilities = elements.utilities.filter(
        (item) => !storesSet.has(item)
      );

      // Remove utilities that are in services
      const servicesSet = new Set(elements.services);
      elements.utilities = elements.utilities.filter(
        (item) => !servicesSet.has(item)
      );

      // Remove component-internal functions from the general functions list
      // These will be handled via componentFunctions relationships
      const componentInternalFunctions = new Set();
      componentFunctions.forEach((functions) => {
        functions.forEach((func) => componentInternalFunctions.add(func));
      });
      elements.functions = elements.functions.filter(
        (func) => !componentInternalFunctions.has(func)
      );

      // Filter component relationships to only include components that exist in our codebase
      const componentsSet = new Set(elements.components);



      componentRelationships.forEach((usedComponents, component) => {
        const beforeFilter = Array.from(usedComponents);
        const filtered = new Set(
          [...usedComponents].filter((comp) => componentsSet.has(comp))
        );
        const afterFilter = Array.from(filtered);

        if (beforeFilter.length !== afterFilter.length) {
          const removed = beforeFilter.filter((c) => !afterFilter.includes(c));
        
        }

        componentRelationships.set(component, filtered);
      });
      // Remove entries with no valid relationships
      for (const [
        component,
        usedComponents,
      ] of componentRelationships.entries()) {
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
            if (dep.type === 'service')
              return servicesSetForFilter.has(dep.name);
            if (dep.type === 'store') return storesSetForFilter.has(dep.name);
            if (dep.type === 'utility')
              return utilitiesSetForFilter.has(dep.name);
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

  

      // Add components (no internal functions nested - they'll be connected via arrows)
      if (elements.components.length > 0) {
        markdown += `%% Components\n`;
        elements.components.forEach((comp) => {
          if (nodeIds.has(comp)) {
            duplicates.push({
              id: comp,
              type: 'Component',
              section: 'Components',
            });
            console.warn(`⚠️ DUPLICATE NODE ID: ${comp} (Component)`);
          }
          nodeIds.add(comp);
          markdown += `${comp}{Component: ${comp}}\n`;
        });
      }

      // Add internal helper components with parent-child relationships
      if (internalComponents.size > 0) {
       
      

        markdown += '\n%% Internal Helper Components\n';
        internalComponents.forEach((data, fileName) => {
          // Use the actual parent component (first component found in file)
          const parentComponent = data.parent;
          
          data.helpers.forEach((helperComp) => {
            // Prevent self-references
            if (parentComponent === helperComp) {
              console.warn(`⚠️  Skipping self-reference: ${parentComponent} -.-> ${helperComp}`);
              return;
            }
            // Create dashed arrow connection: parent -.-> helper : "internal"
            // This will make markdownDiagramService position the helper inside the parent
            markdown += `${parentComponent} -.-> ${helperComp} : "internal"\n`;
          });
        });
      }

      // Add functions
      if (elements.functions.length > 0) {
        markdown += `\n%% Functions\n`;
        elements.functions.forEach((func) => {
          if (nodeIds.has(func)) {
            duplicates.push({
              id: func,
              type: 'Function',
              section: 'Functions',
            });
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

      // Add services
      if (elements.services.length > 0) {
        markdown += `\n%% Services\n`;
        elements.services.forEach((service) => {
          if (nodeIds.has(service)) {
            duplicates.push({
              id: service,
              type: 'Service',
              section: 'Services',
            });
            console.warn(`⚠️ DUPLICATE NODE ID: ${service} (Service)`);
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
            duplicates.push({
              id: util,
              type: 'Utility',
              section: 'Utilities',
            });
            console.warn(`⚠️ DUPLICATE NODE ID: ${util} (Utility)`);
          }
          nodeIds.add(util);
          markdown += `${util}[Function: ${util}]\n`;
        });
      }

      // Add library imports
      if (elements.imports.libraries.length > 0) {
        markdown += `\n%% External Libraries\n`;
        elements.imports.libraries.forEach((lib) => {
          if (nodeIds.has(lib)) {
            duplicates.push({
              id: lib,
              type: 'Library',
              section: 'External Libraries',
            });
            console.warn(`⚠️ DUPLICATE NODE ID: ${lib} (Library)`);
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
            duplicates.push({
              id: func,
              type: 'Function',
              section: 'Component Internal Functions',
            });
            console.warn(
              `⚠️ DUPLICATE NODE ID: ${func} (Component Internal Function)`
            );
          }
          nodeIds.add(func);
          markdown += `${func}[Function: ${func}]\n`;
        });

        // Then add arrow relationships with descriptive labels
        markdown += '\n%% Component-Function Relationships\n';
        componentFunctions.forEach((functions, component) => {
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
            } else if (
              func.toLowerCase().includes('calculate') ||
              func.toLowerCase().includes('compute')
            ) {
              label = 'calculation helper';
            } else if (
              func.toLowerCase().includes('should') ||
              func.toLowerCase().includes('is')
            ) {
              label = 'boolean check';
            } else if (func.toLowerCase().includes('debounced')) {
              label = 'debounced helper';
            }

            markdown += `${component} --> ${func} : "${label}"\n`;
          });
        });
      }

      // Add file-function relationships for hooks/services/utilities/stores
      // Files that contain multiple functions should have the file as a container
      if (fileFunctions.size > 0) {
     

        markdown += '\n%% File Container Nodes\n';
        // Create file nodes for files that contain multiple functions
        fileFunctions.forEach((fileInfo, fileName) => {
          // Only create container if file has more than 1 function
          if (fileInfo.functions.size > 1) {
            // Use fileName__file to avoid conflicts when file name matches a contained function
            const fileNodeId = fileInfo.functions.has(fileName) ? `${fileName}__file` : fileName;
            
            if (nodeIds.has(fileNodeId)) {
              duplicates.push({
                id: fileNodeId,
                type: `${fileInfo.type} File`,
                section: 'File Container Nodes',
              });
              console.warn(`⚠️ DUPLICATE NODE ID: ${fileNodeId} (${fileInfo.type} File)`);
            }
            nodeIds.add(fileNodeId);
            
            // Use appropriate shape based on file type
            if (fileInfo.type === 'service') {
              markdown += `${fileNodeId}((Service: ${fileName}))\n`;
            } else if (fileInfo.type === 'hook') {
              markdown += `${fileNodeId}[Hook: ${fileName}]\n`;
            } else if (fileInfo.type === 'store') {
              markdown += `${fileNodeId}[[Store: ${fileName}]]\n`;
            } else {
              // utility
              markdown += `${fileNodeId}[Function: ${fileName}]\n`;
            }
            
            // Store the file node ID for later connection generation
            fileInfo.nodeId = fileNodeId;
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
              markdown += `${fileNodeId} -.-> ${funcName} : "contains"\n`;
            }
          });
        });
      }

      // Add component-to-component relationships
      if (componentRelationships.size > 0) {
     
        

        markdown += '\n%% Component Relationships\n';
        componentRelationships.forEach((usedComponents, component) => {
          usedComponents.forEach((usedComp) => {
            // Generate descriptive labels based on component names
            let label = 'uses';
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
        
            markdown += `${component} --> ${usedComp} : "${label}"\n`;
          });
        });
      }

      // Add component-to-hook/service/store relationships
      if (componentDependencies.size > 0) {
        markdown += '\n%% Component Dependencies\n';
        componentDependencies.forEach((deps, component) => {
          deps.forEach((dep) => {
            markdown += `${component} --> ${dep.name} : "uses ${dep.type}"\n`;
          });
        });
      }

      // Wrap the entire diagram in Merfolk code blocks
      const merfolkMarkdown = `\`\`\`merfolk\n${markdown}\`\`\`\n`;

      return merfolkMarkdown;
    } catch (error) {
      console.error('Error generating Merfolk from repository:', error);
      return `%% ${repoName} Repository Analysis\n\n%% Error: Unable to analyze repository\n`;
    }
  };

  // Function to scan repository and generate Merfolk diagram
  const fetchAppJsxFromRepo = async (repo) => {
    const token = localStorage.getItem('github_token');
    if (!token) {
      throw new Error('No GitHub token found');
    }

    try {
      // Generate Merfolk markdown from entire repository
      const merfolkMarkdown = await generateMerfolkFromJsx(
        repo.owner.login,
        repo.name
      );

      // Upload the generated markdown to Firebase Storage
      let storageUrl = null;
      if (user?.uid && currentSpaceId) {
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

      // Create a File from the markdown for processing
      const markdownBlob = new Blob([merfolkMarkdown], {
        type: 'text/markdown',
      });
      const markdownFile = new File([markdownBlob], `${repo.name}-diagram.md`, {
        type: 'text/markdown',
      });

      // Use the markdown processing service to handle the upload and creation
      const result = await markdownDiagramService.processMarkdownFile(
        markdownFile,
        onCreateObject,
        currentSpaceId,
        user
      );

      if (result.success) {
        const uploadMessage = storageUrl
          ? ` and saved to storage (${storageUrl})`
          : '';
        alert(
          `Successfully created diagram for ${repo.name}! Generated ${result.objectsCreated} 3D objects with ${result.connectionsCreated} connections${uploadMessage}.`
        );
      } else {
        alert(
          'Diagram generated but no 3D objects were created. Check Merfolk syntax.'
        );
      }

      return merfolkMarkdown;
    } catch (error) {
      console.error('Error generating diagram from repository:', error);
      throw error;
    }
  };

  // Handle GitHub OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      // Exchange the code for a token and fetch repositories
      exchangeGithubCode(code)
        .then((token) => {
          localStorage.setItem('github_token', token); // Save token for future use
          // Clean up the URL by removing the code parameter
          const newUrl = new URL(window.location);
          newUrl.searchParams.delete('code');
          window.history.replaceState({}, '', newUrl);
          fetchRepositories();
          alert('GitHub login successful!');
        })
        .catch((error) => {
          console.error('GitHub OAuth flow failed:', error);
          // Clean up the URL even on failure
          const newUrl = new URL(window.location);
          newUrl.searchParams.delete('code');
          window.history.replaceState({}, '', newUrl);
        });
    }
  }, []);

  // Add this useEffect to check for existing GitHub token on mount
  useEffect(() => {
    const token = localStorage.getItem('github_token');
    setIsGithubAuthenticated(!!token);
  }, []);

  // Handle GitHub OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      // Exchange the code for a token and fetch repositories
      exchangeGithubCode(code)
        .then((token) => {
          localStorage.setItem('github_token', token); // Save token for future use
          setIsGithubAuthenticated(true); // Update authentication state
          // Clean up the URL by removing the code parameter
          const newUrl = new URL(window.location);
          newUrl.searchParams.delete('code');
          window.history.replaceState({}, '', newUrl);
          fetchRepositories();
          alert('GitHub login successful!');
        })
        .catch((error) => {
          console.error('GitHub OAuth flow failed:', error);
          // Clean up the URL even on failure
          const newUrl = new URL(window.location);
          newUrl.searchParams.delete('code');
          window.history.replaceState({}, '', newUrl);
        });
    }
  }, []);

  const handleRecordClick = useCallback(async () => {
    if (isRecording) {
      // Stop recording
      try {
        const blob = await screenRecorder.stopRecording();
        if (blob) {
          screenRecorder.downloadRecording(blob);
        }
        setIsRecording(false);
      } catch {
        alert('Failed to stop recording');
      }
    } else {
      // Ask for confirmation before starting
      const confirmed = window.confirm(
        'Do you want to start recording your screen? You will be asked to select which screen or window to share.'
      );

      if (confirmed) {
        const success = await screenRecorder.startRecording();
        if (success) {
          setIsRecording(true);
        }
      }
    }
  }, [isRecording, setIsRecording]);

  const handleModelUpload = useCallback(() => {
    if (modelFileInputRef.current) {
      modelFileInputRef.current.click();
    }
  }, []);

  const handleModelFileSelect = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file || !user?.uid || !currentSpaceId) {
        if (!user?.uid) {
          alert('You must be logged in to upload 3D models');
        }
        return;
      }

      // Validate file type
      const validExtensions = ['.glb', '.gltf'];
      const fileExtension = file.name
        .toLowerCase()
        .substring(file.name.lastIndexOf('.'));
      if (!validExtensions.includes(fileExtension)) {
        alert('Please select a GLB or GLTF file');
        return;
      }
      setIsUploadingModel(true);

      try {
        const modelUrl = await uploadModelToStorage(
          file,
          user.uid,
          currentSpaceId
        );

        // Get camera position and direction to position model 50 units in front
        let modelPosition = [0, 0, -50]; // Default fallback position

        try {
          // Try to get camera from various sources
          const camera =
            window.cameraRef?.current?.camera ||
            window.camera ||
            window.orbitControls?.object;

          if (camera) {
            // Get camera position and direction
            const cameraPosition = camera.position;
            const cameraDirection = new THREE.Vector3();
            camera.getWorldDirection(cameraDirection);

            // Position model 50 units in front of camera
            modelPosition = [
              cameraPosition.x + cameraDirection.x * 50,
              cameraPosition.y + cameraDirection.y * 50,
              cameraPosition.z + cameraDirection.z * 50,
            ];
          }
        } catch {
          // Using default position
        }

        // Create model object
        onCreateObject('model', modelPosition, { modelUrl });

        alert('3D model uploaded successfully!');
      } catch {
        alert('Failed to upload model. Please try again.');
      } finally {
        setIsUploadingModel(false);
        // Reset file input
        if (modelFileInputRef.current) {
          modelFileInputRef.current.value = '';
        }
      }
    },
    [user, currentSpaceId, onCreateObject, setIsUploadingModel]
  );

  const handleMarkdownUpload = useCallback(() => {
    if (markdownFileInputRef.current) {
      markdownFileInputRef.current.click();
    }
  }, []);

  const handleMarkdownFileSelect = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) {
        return;
      }

      setIsProcessingMarkdown(true);

      try {
        const result = await markdownDiagramService.processMarkdownFile(
          file,
          onCreateObject,
          currentSpaceId,
          user
        );

        if (result.success) {
          // Objects and connections are rendered immediately
          // But wait for database save to complete before showing completion message
          if (result.savePromise) {
         
            await result.savePromise;
          }

          alert(
            `Successfully processed ${result.diagramCount} diagram(s) and created ${result.objectsCreated} 3D objects with ${result.connectionsCreated} connections!`
          );
        } else {
          alert(
            'No 3D objects were created. Please check that your Merfolk syntax is correct.'
          );
        }
      } catch (error) {
        alert(
          `Failed to process markdown file: ${error.message}. Please check the file format and try again.`
        );
      } finally {
        setIsProcessingMarkdown(false);
        // Reset file input
        if (markdownFileInputRef.current) {
          markdownFileInputRef.current.value = '';
        }
      }
    },
    [onCreateObject, currentSpaceId, user, setIsProcessingMarkdown]
  );

  // Get store state for main overlay - use direct selectors for better reactivity
  const menuOpen = useUIOverlayStore((state) => {
    const overlay = state.overlays['main'];
    return overlay ? overlay.menuOpen : state.defaultOverlay.menuOpen;
  });
  const templateOpen = useUIOverlayStore((state) => {
    const overlay = state.overlays['main'];
    return overlay ? overlay.templateOpen : state.defaultOverlay.templateOpen;
  });
  const templateConfig = useUIOverlayStore((state) => {
    const overlay = state.overlays['main'];
    return overlay
      ? overlay.templateConfig
      : state.defaultOverlay.templateConfig;
  });
  const handleMenuToggle = () => {
    toggleMenu('main');
  };

  const handleArrowClick = () => {
    toggleConnectionsVisible();
  };

  const handleTemplateConfigChange = (field, value) => {
    updateTemplateConfig('main', field, value);
  };

  const createTemplate = () => {
    const {
      objectType,
      numberOfObjects,
      distance,
      templateShape,
      orientation,
    } = templateConfig;

    // Get camera position and direction to position template 50 units in front
    let templateCenter = [0, 0, -50]; // Default fallback position

    try {
      // Try to get camera from various sources
      const camera =
        window.cameraRef?.current?.camera ||
        window.camera ||
        window.orbitControls?.object;

      if (camera) {
        // Get camera position
        const cameraPos = camera.position;

        // Get camera's forward direction
        const direction = { x: 0, y: 0, z: -1 };
        const quaternion = camera.quaternion;

        // Apply camera rotation to direction vector
        const rotatedDirection = {
          x:
            direction.x *
              (1 -
                2 *
                  (quaternion.y * quaternion.y + quaternion.z * quaternion.z)) +
            direction.y *
              2 *
              (quaternion.x * quaternion.y - quaternion.w * quaternion.z) +
            direction.z *
              2 *
              (quaternion.x * quaternion.z + quaternion.w * quaternion.y),
          y:
            direction.x *
              2 *
              (quaternion.x * quaternion.y + quaternion.w * quaternion.z) +
            direction.y *
              (1 -
                2 *
                  (quaternion.x * quaternion.x + quaternion.z * quaternion.z)) +
            direction.z *
              2 *
              (quaternion.y * quaternion.z - quaternion.w * quaternion.x),
          z:
            direction.x *
              2 *
              (quaternion.x * quaternion.z - quaternion.w * quaternion.y) +
            direction.y *
              2 *
              (quaternion.y * quaternion.z + quaternion.w * quaternion.x) +
            direction.z *
              (1 -
                2 *
                  (quaternion.x * quaternion.x + quaternion.y * quaternion.y)),
        };

        // Calculate template center 50 units in front of camera
        templateCenter = [
          cameraPos.x + rotatedDirection.x * 50,
          cameraPos.y + rotatedDirection.y * 50,
          cameraPos.z + rotatedDirection.z * 50,
        ];
      }
    } catch {
      // Using default position if camera access fails
    }
    if (templateShape === 'plane') {
      // Create objects in a grid pattern
      const gridSize = Math.ceil(Math.sqrt(numberOfObjects));
      let count = 0;

      for (let i = 0; i < gridSize && count < numberOfObjects; i++) {
        for (let j = 0; j < gridSize && count < numberOfObjects; j++) {
          let relativeX, relativeY, relativeZ;

          if (orientation === 'vertical') {
            // Vertical orientation - grid in Y-Z plane
            relativeY = (i - (gridSize - 1) / 2) * distance;
            relativeZ = (j - (gridSize - 1) / 2) * distance;
            relativeX = 0;
          } else {
            // Horizontal orientation - grid in X-Z plane (default)
            relativeX = (i - (gridSize - 1) / 2) * distance;
            relativeZ = (j - (gridSize - 1) / 2) * distance;
            relativeY = 0;
          }

          // Position relative to template center
          const absolutePosition = [
            templateCenter[0] + relativeX,
            templateCenter[1] + relativeY,
            templateCenter[2] + relativeZ,
          ];

          onCreateObject(objectType, absolutePosition);
          count++;
        }
      }
    } else if (templateShape === 'sphere') {
      // Create objects in a spherical pattern
      const radius = distance;
      const angleStep = (2 * Math.PI) / numberOfObjects;

      for (let i = 0; i < numberOfObjects; i++) {
        const angle = i * angleStep;
        let relativeX, relativeY, relativeZ;

        if (orientation === 'vertical') {
          // Vertical orientation - circle in Y-Z plane
          relativeY = radius * Math.cos(angle);
          relativeZ = radius * Math.sin(angle);
          relativeX = 0;
        } else {
          // Horizontal orientation - circle in X-Z plane (default)
          relativeX = radius * Math.cos(angle);
          relativeZ = radius * Math.sin(angle);
          relativeY = 0;
        }

        // Position relative to template center
        const absolutePosition = [
          templateCenter[0] + relativeX,
          templateCenter[1] + relativeY,
          templateCenter[2] + relativeZ,
        ];

        onCreateObject(objectType, absolutePosition);
      }
    } else if (templateShape === 'cube') {
      // Create objects in a cube pattern
      const cubeSize = Math.ceil(Math.cbrt(numberOfObjects));
      let count = 0;

      for (let i = 0; i < cubeSize && count < numberOfObjects; i++) {
        for (let j = 0; j < cubeSize && count < numberOfObjects; j++) {
          for (let k = 0; k < cubeSize && count < numberOfObjects; k++) {
            const relativeX = (i - (cubeSize - 1) / 2) * distance;
            const relativeY = (j - (cubeSize - 1) / 2) * distance;
            const relativeZ = (k - (cubeSize - 1) / 2) * distance;

            // Position relative to template center
            const absolutePosition = [
              templateCenter[0] + relativeX,
              templateCenter[1] + relativeY,
              templateCenter[2] + relativeZ,
            ];

            onCreateObject(objectType, absolutePosition);
            count++;
          }
        }
      }
    } // Close template menu after creation
    toggleTemplate('main');
  };

  if (!isAuthReady) {
    return <div className="ui-overlay">Initializing...</div>;
  }

  return (
    <>
      {' '}
      <div className="menu-button-container">
        <button
          className="menu-button"
          onClick={handleMenuToggle}
          aria-label="Toggle menu"
        >
          ☰
        </button>
      </div>{' '}
      <div className={`sidebar-menu ${menuOpen ? 'open' : ''}`}>
        <div className="menu-content">
          <div className="current-cell-info">
            <span>Current cell: </span>
            <span className="cell-coordinates">
              {currentCell
                ? `${currentCell.x},${currentCell.y},${currentCell.z}`
                : '0,0,0'}
            </span>
          </div>
          {/* Template Section */}{' '}
          <div className="template-section">
            <button
              className="template-toggle-button"
              onClick={() => toggleTemplate('main')}
            >
              Templates {templateOpen ? '▼' : '▶'}
            </button>

            {templateOpen && (
              <div className="template-dropdown">
                <div className="template-config">
                  <div className="config-group">
                    <label>Object Type:</label>{' '}
                    <select
                      value={templateConfig.objectType}
                      onChange={(e) =>
                        handleTemplateConfigChange('objectType', e.target.value)
                      }
                    >
                      <option value="cube">Cube</option>
                      <option value="tetrahedron">Tetrahedron</option>
                      <option value="dodecahedron">Dodecahedron</option>
                      <option value="plane">Plane</option>
                      <option value="text">Text</option>
                    </select>
                  </div>
                  <div className="config-group">
                    <label>Number of Objects:</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={templateConfig.numberOfObjects}
                      onChange={(e) =>
                        handleTemplateConfigChange(
                          'numberOfObjects',
                          parseInt(e.target.value)
                        )
                      }
                    />
                  </div>
                  <div className="config-group">
                    <label>Distance Between:</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={templateConfig.distance}
                      onChange={(e) =>
                        handleTemplateConfigChange(
                          'distance',
                          parseInt(e.target.value)
                        )
                      }
                    />
                  </div>{' '}
                  <div className="config-group">
                    <label>Template Shape:</label>
                    <select
                      value={templateConfig.templateShape}
                      onChange={(e) =>
                        handleTemplateConfigChange(
                          'templateShape',
                          e.target.value
                        )
                      }
                    >
                      <option value="plane">Plane</option>
                      <option value="sphere">Sphere</option>
                      <option value="cube">Cube</option>
                    </select>
                  </div>
                  <div className="config-group">
                    <label>Orientation:</label>
                    <select
                      value={templateConfig.orientation}
                      onChange={(e) =>
                        handleTemplateConfigChange(
                          'orientation',
                          e.target.value
                        )
                      }
                    >
                      <option value="horizontal">Horizontal</option>
                      <option value="vertical">Vertical</option>
                    </select>
                  </div>
                  <button
                    className="create-template-button"
                    onClick={createTemplate}
                  >
                    Create Template
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* Markdown Upload Section */}
          <div className="markdown-section">
            <button
              className="markdown-upload-button"
              onClick={handleMarkdownUpload}
              disabled={isProcessingMarkdown}
              title="Upload Markdown with Merfolk diagrams"
            >
              {isProcessingMarkdown ? 'Processing...' : '📄 Upload Markdown'}
            </button>
            {/* Hidden file input for markdown upload */}
            <input
              ref={markdownFileInputRef}
              type="file"
              accept=".md,.markdown"
              style={{ display: 'none' }}
              onChange={handleMarkdownFileSelect}
            />
          </div>
          {/* GitHub repo section */}
          {isGithubAuthenticated ? (
            <div className="github-repos-dropdown">
              <button
                className="repos-toggle-button"
                onClick={() => {
                  if (!showRepos) {
                    fetchRepositories(); // Fetch repositories only when opening the dropdown
                  }
                  setShowRepos((prev) => !prev); // Toggle visibility
                }}
              >
                {showRepos ? 'Hide Repositories' : 'Show Repositories'}
              </button>
              {showRepos && (
                <ul className="github-repos-list">
                  {repositories.map((repo) => (
                    <li key={repo.id} onClick={() => setSelectedRepo(repo)}>
                      {repo.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <button
              className="github-login-button"
              onClick={() =>
                (window.location.href = `https://github.com/login/oauth/authorize?client_id=Ov23liLYzf9WoYPLBNat&scope=repo&redirect_uri=${encodeURIComponent(
                  'https://space.volscape.com'
                )}`)
              }
            >
              Connect to GitHub
            </button>
          )}
          {/* Popup for selected repository */}
          {selectedRepo && (
            <div className="popup-overlay">
              <div className="popup-content">
                <p>Create diagram for {selectedRepo.name}</p>
                <button
                  onClick={async () => {
                    try {
                      await fetchAppJsxFromRepo(selectedRepo);
                      setSelectedRepo(null);
                    } catch (error) {
                      alert(`Failed to create diagram: ${error.message}`);
                    }
                  }}
                >
                  Yes
                </button>
                <button onClick={() => setSelectedRepo(null)}>No</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="ui-overlay" onClick={(e) => e.stopPropagation()}>
        {isLoading ? (
          <div>Loading...</div>
        ) : !user && showLoginButton ? (
          <div className="login-container">
            <button onClick={onLogin} className="login-button">
              Login with Google
            </button>
          </div>
        ) : user ? (
          <div className="tools-container">
            <button
              className="shape-button"
              onClick={() => onCreateObject('cube')}
              title="Add Cube"
            >
              □
            </button>
            <button
              className="shape-button"
              onClick={() => onCreateObject('tetrahedron')}
              title="Add Tetrahedron"
            >
              ▲
            </button>
            <button
              className="shape-button"
              onClick={() => onCreateObject('dodecahedron')}
              title="Add Dodecahedron"
            >
              ○
            </button>
            <button
              className="shape-button"
              onClick={() => onCreateObject('plane')}
              title="Add Plane"
            >
              ▭
            </button>
            <button
              className={`shape-button ${isConnectMode ? 'active' : ''}`}
              onClick={handleArrowClick}
              title="Toggle Connection Lines"
              style={{
                borderColor: connectionsVisible ? '' : 'orange',
                borderWidth: connectionsVisible ? '' : '2px',
              }}
            >
              ↗
            </button>
            <button
              className={`shape-button ${
                cellBoundariesVisible ? 'active' : ''
              }`}
              onClick={handleCellBoundariesToggle}
              title="Toggle Cell Boundaries"
              style={{
                borderColor: cellBoundariesVisible ? '' : 'blue',
                borderWidth: cellBoundariesVisible ? '' : '2px',
              }}
            >
              ⬜
            </button>
            <button
              className="shape-button"
              onClick={() => onCreateObject('text')}
              title="Add Text"
            >
              T
            </button>{' '}
            <button
              className="shape-button"
              onClick={handleModelUpload}
              title="Add 3D Model"
              disabled={isUploadingModel}
            >
              {isUploadingModel ? '...' : '3D'}
            </button>
            {/* Hidden file input for model upload */}
            <input
              ref={modelFileInputRef}
              type="file"
              accept=".glb,.gltf"
              style={{ display: 'none' }}
              onChange={handleModelFileSelect}
            />
          </div>
        ) : null}
      </div>
      {/* Record button positioned at bottom center */}
      <div className="record-button-container">
        <button
          className={`record-button ${isRecording ? 'recording' : ''}`}
          onClick={handleRecordClick}
          title={isRecording ? 'Stop Recording' : 'Start Recording'}
        >
          {isRecording ? (
            <>
              <span className="record-icon recording">⏹️</span>
              <span className="record-text">Stop Recording</span>
            </>
          ) : (
            <>
              <span className="record-icon">🎥</span>
              <span className="record-text">Record</span>
            </>
          )}
        </button>
      </div>
    </>
  );
};

UIOverlay.displayName = 'UIOverlay';
export default UIOverlay;
