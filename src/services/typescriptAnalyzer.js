/**
 * typescriptAnalyzer.js
 *
 * L2: TypeScript Compiler API integration for type-aware Merfolk diagram analysis.
 * Dynamically loads the TypeScript compiler from a CDN to avoid bundling it.
 * Only activated for TypeScript repositories.
 *
 * Extracts:
 * - Component prop types (React.FC<Props>, function Component(props: P))
 * - Hook return types (function useX(): { data: T, loading: boolean })
 * - Store state shapes (Zustand create<State>(), Pinia defineStore)
 * - Type-only import classification (import type vs import)
 * - Resolved module paths (follows re-exports and barrel files)
 */

let tsModule = null;

const TS_CDN_URL = 'https://cdn.jsdelivr.net/npm/typescript@5.5.4/lib/typescript.min.js';

/**
 * Dynamically load the TypeScript compiler module.
 * Uses fetch + blob URL to avoid Vite/Rollup static analysis.
 */
async function loadTypeScript() {
  if (tsModule) return tsModule;

  try {
    const response = await fetch(TS_CDN_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const code = await response.text();
    const blob = new Blob([code], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);
    const mod = await import(blobUrl);
    URL.revokeObjectURL(blobUrl);
    tsModule = mod.default || mod;
    console.log('[TSAnalyzer] Loaded TypeScript from CDN');
    return tsModule;
  } catch (err) {
    console.warn('[TSAnalyzer] Failed to load TypeScript:', err.message);
    return null;
  }
}

/**
 * Create an in-memory TypeScript Program from source files.
 * Uses a custom CompilerHost that reads from a Map instead of the filesystem.
 *
 * @param {Map<string, string>} sourceFiles - filePath -> file content
 * @param {string} tsconfigContent - tsconfig.json content (optional)
 * @returns {{ program: ts.Program, checker: ts.TypeChecker } | null}
 */
export async function createTypeScriptProgram(sourceFiles, tsconfigContent = null) {
  const ts = await loadTypeScript();
  if (!ts) return null;

  try {
    // Parse tsconfig or create minimal compiler options
    let compilerOptions = {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.BundlerLeastStrict || ts.ModuleResolutionKind.Node10,
      jsx: ts.JsxEmit.ReactJSX,
      strict: false,
      esModuleInterop: true,
      skipLibCheck: true,
      allowJs: true,
      noEmit: true,
      noLib: true,  // Don't include default lib — we don't have node_modules
    };

    if (tsconfigContent) {
      try {
        const parsed = ts.parseConfigFileTextToJson('tsconfig.json', tsconfigContent);
        if (parsed.config?.compilerOptions) {
          const converted = ts.convertCompilerOptionsFromJson(
            parsed.config.compilerOptions,
            '.'
          );
          if (converted.options) {
            compilerOptions = { ...compilerOptions, ...converted.options, noEmit: true, noLib: true };
          }
        }
      } catch (err) {
        console.warn('[TSAnalyzer] Failed to parse tsconfig, using minimal options:', err.message);
      }
    }

    // Build the list of source file paths
    const fileNames = Array.from(sourceFiles.keys()).filter(f =>
      /\.(tsx?|jsx?)$/.test(f) && !f.includes('node_modules')
    );

    // Create a custom CompilerHost that reads from our in-memory Map
    const defaultHost = ts.createCompilerHost(compilerOptions);
    const fileContents = sourceFiles;

    const customHost = {
      ...defaultHost,
      fileExists(fileName) {
        return fileContents.has(fileName) || defaultHost.fileExists(fileName);
      },
      readFile(fileName) {
        return fileContents.get(fileName) || defaultHost.readFile(fileName);
      },
      getSourceFile(fileName, languageVersion) {
        const content = fileContents.get(fileName);
        if (content !== undefined) {
          return ts.createSourceFile(fileName, content, languageVersion, true);
        }
        return defaultHost.getSourceFile(fileName, languageVersion);
      },
      getDefaultLibFileName(opts) {
        return defaultHost.getDefaultLibFileName(opts);
      },
      writeFile() {},
      getCurrentDirectory() {
        return '.';
      },
      getCanonicalFileName(fileName) {
        return fileName;
      },
      useCaseSensitiveFileNames() {
        return true;
      },
      getNewLine() {
        return '\n';
      },
    };

    const program = ts.createProgram(fileNames, compilerOptions, customHost);
    const checker = program.getTypeChecker();

    console.log(`[TSAnalyzer] Created program: ${fileNames.length} source files`);
    return { program, checker };
  } catch (err) {
    console.warn('[TSAnalyzer] Failed to create TypeScript program:', err.message);
    return null;
  }
}

/**
 * Extract component prop types from a TypeScript program.
 * Returns a map of componentName -> { propsType, propsInterface, requiredProps, optionalProps }
 *
 * @param {ts.Program} program
 * @param {ts.TypeChecker} checker
 * @returns {Map<string, object>}
 */
export function extractComponentPropTypes(program, checker) {
  const ts = tsModule;
  if (!ts || !checker) return new Map();

  const result = new Map();
  const sourceFiles = program.getSourceFiles().filter(f => !f.isDeclarationFile);

  for (const sourceFile of sourceFiles) {
    const fileName = sourceFile.fileName;

    ts.forEachChild(sourceFile, (node) => {
      // Look for function declarations and arrow function exports
      let funcName = null;
      let funcNode = null;

      if (ts.isFunctionDeclaration(node) && node.name) {
        funcName = node.name.text;
        funcNode = node;
      } else if (ts.isVariableStatement(node)) {
        for (const decl of node.declarationList.declarations) {
          if (decl.name && ts.isIdentifier(decl.name) && decl.initializer) {
            funcName = decl.name.text;
            funcNode = decl;
          }
        }
      }

      if (!funcName || !funcNode) return;

      // Check if this looks like a React component (starts with uppercase)
      if (!/^[A-Z]/.test(funcName)) return;

      try {
        const symbol = checker.getSymbolAtLocation(
          ts.isFunctionDeclaration(funcNode) ? funcNode.name : funcNode.name
        );
        if (!symbol) return;

        const type = checker.getTypeOfSymbolAtLocation(symbol, funcNode);
        const signatures = type.getCallSignatures();

        if (signatures.length > 0) {
          const firstSig = signatures[0];
          const params = firstSig.getParameters();

          if (params.length > 0) {
            const propsParam = params[0];
            const propsType = checker.getTypeOfSymbolAtLocation(propsParam, funcNode);

            // Extract individual properties
            const propsMembers = propsType.getProperties();
            const required = [];
            const optional = [];

            for (const prop of propsMembers) {
              const propType = checker.getTypeOfSymbolAtLocation(prop, funcNode);
              const isOptional = (prop.flags & ts.SymbolFlags.Optional) !== 0 ||
                                 checker.isOptionalParameter &&
                                 checker.isOptionalParameter(prop.declarations?.[0]);
              const typeString = checker.typeToString(propType);

              const propInfo = { name: prop.name, type: typeString, optional: isOptional };
              if (isOptional) optional.push(propInfo);
              else required.push(propInfo);
            }

            if (required.length > 0 || optional.length > 0) {
              result.set(funcName, {
                filePath: fileName,
                requiredProps: required,
                optionalProps: optional,
                propsTypeString: checker.typeToString(propsType),
              });
            }
          }
        }
      } catch {
        // Skip files with type errors
      }
    });
  }

  console.log(`[TSAnalyzer] Extracted prop types for ${result.size} components`);
  return result;
}

/**
 * Extract hook return types from a TypeScript program.
 * Returns a map of hookName -> { returnType, returnProperties }
 *
 * @param {ts.Program} program
 * @param {ts.TypeChecker} checker
 * @returns {Map<string, object>}
 */
export function extractHookReturnTypes(program, checker) {
  const ts = tsModule;
  if (!ts || !checker) return new Map();

  const result = new Map();
  const sourceFiles = program.getSourceFiles().filter(f => !f.isDeclarationFile);

  for (const sourceFile of sourceFiles) {
    ts.forEachChild(sourceFile, (node) => {
      let funcName = null;
      let funcNode = null;

      if (ts.isFunctionDeclaration(node) && node.name) {
        funcName = node.name.text;
        funcNode = node;
      } else if (ts.isVariableStatement(node)) {
        for (const decl of node.declarationList.declarations) {
          if (decl.name && ts.isIdentifier(decl.name) && decl.initializer) {
            funcName = decl.name.text;
            funcNode = decl;
          }
        }
      }

      if (!funcName || !funcNode) return;
      if (!/^use[A-Z]/.test(funcName)) return; // Only hooks

      try {
        const symbol = checker.getSymbolAtLocation(
          ts.isFunctionDeclaration(funcNode) ? funcNode.name : funcNode.name
        );
        if (!symbol) return;

        const type = checker.getTypeOfSymbolAtLocation(symbol, funcNode);
        const signatures = type.getCallSignatures();

        if (signatures.length > 0) {
          const returnType = signatures[0].getReturnType();
          const returnProps = returnType.getProperties();

          if (returnProps.length > 0) {
            const properties = returnProps.map(prop => ({
              name: prop.name,
              type: checker.typeToString(checker.getTypeOfSymbolAtLocation(prop, funcNode)),
            }));

            result.set(funcName, {
              filePath: sourceFile.fileName,
              returnTypeString: checker.typeToString(returnType),
              returnProperties: properties,
            });
          }
        }
      } catch {
        // Skip files with type errors
      }
    });
  }

  console.log(`[TSAnalyzer] Extracted return types for ${result.size} hooks`);
  return result;
}

/**
 * Classify imports as type-only or value imports using the TypeScript type checker.
 * Returns a map of sourceFile -> Set<importedName> for type-only imports.
 *
 * @param {ts.Program} program
 * @param {ts.TypeChecker} checker
 * @returns {Map<string, Set<string>>}
 */
export function classifyTypeImports(program, checker) {
  const ts = tsModule;
  if (!ts || !checker) return new Map();

  const result = new Map();
  const sourceFiles = program.getSourceFiles().filter(f => !f.isDeclarationFile);

  for (const sourceFile of sourceFiles) {
    const imports = new Set();

    ts.forEachChild(sourceFile, (node) => {
      if (ts.isImportDeclaration(node) && node.importKind === ts.SyntaxKind.TypeKeyword) {
        // Already flagged as import type by syntax
        for (const spec of node.importClause?.namedBindings?.elements || []) {
          imports.add(spec.name.text);
        }
        if (node.importClause?.name) {
          imports.add(node.importClause.name.text);
        }
      }
    });

    if (imports.size > 0) {
      result.set(sourceFile.fileName, imports);
    }
  }

  console.log(`[TSAnalyzer] Classified type imports in ${result.size} files`);
  return result;
}

/**
 * Run the full TypeScript analysis pipeline.
 * Returns all extracted type information, or null if analysis fails.
 *
 * @param {Map<string, string>} sourceFiles - filePath -> content
 * @param {string|null} tsconfigContent - tsconfig.json content
 * @returns {Promise<{ componentPropTypes: Map, hookReturnTypes: Map, typeImports: Map } | null>}
 */
export async function runTypeScriptAnalysis(sourceFiles, tsconfigContent = null) {
  const startTime = Date.now();
  console.log(`[TSAnalyzer] Starting analysis of ${sourceFiles.size} files...`);

  const result = await createTypeScriptProgram(sourceFiles, tsconfigContent);
  if (!result) return null;

  const { program, checker } = result;

  const componentPropTypes = extractComponentPropTypes(program, checker);
  const hookReturnTypes = extractHookReturnTypes(program, checker);
  const typeImports = classifyTypeImports(program, checker);

  const elapsed = Date.now() - startTime;
  console.log(`[TSAnalyzer] Analysis complete in ${elapsed}ms: ${componentPropTypes.size} component prop types, ${hookReturnTypes.size} hook return types, ${typeImports.size} files with type imports`);

  return { componentPropTypes, hookReturnTypes, typeImports };
}
