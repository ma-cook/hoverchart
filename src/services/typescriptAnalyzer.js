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
 * Resolve import definitions transitively through re-exports and barrel files.
 * For each import, follows `checker.getAliasedSymbol()` to find the original
 * declaration, giving accurate target resolution that the heuristic barrel
 * chain resolver cannot provide.
 *
 * @param {ts.Program} program
 * @param {ts.TypeChecker} checker
 * @returns {Map<string, Map<string, { targetFile: string, targetLine: number, targetSymbol: string, isTypeOnly: boolean }>>}
 */
export function resolveImportDefinitions(program, checker) {
  const ts = tsModule;
  if (!ts || !checker) return new Map();

  const result = new Map();
  const sourceFiles = program.getSourceFiles().filter(f => !f.isDeclarationFile);

  for (const sourceFile of sourceFiles) {
    const importsByName = new Map();

    ts.forEachChild(sourceFile, (node) => {
      if (!ts.isImportDeclaration(node)) return;

      const isTypeOnly = node.importKind === ts.SyntaxKind.TypeKeyword;
      const bindings = node.importClause?.namedBindings;

      // Named imports: import { Foo, Bar } from './module'
      if (bindings && ts.isNamedImports(bindings)) {
        for (const element of bindings.elements) {
          try {
            const symbol = checker.getSymbolAtLocation(element.name);
            if (!symbol) continue;

            const aliased = checker.getAliasedSymbol(symbol);
            const decl = aliased.getDeclarations?.()?.[0];
            if (!decl) continue;

            importsByName.set(element.name.text, {
              targetFile: decl.getSourceFile().fileName,
              targetLine: ts.getLineAndCharacterOfPosition(decl.getSourceFile(), decl.getStart()).line + 1,
              targetSymbol: aliased.getName(),
              isTypeOnly: isTypeOnly || isTypeOnlySymbol(aliased, ts),
            });
          } catch {
            // Skip symbols that can't be resolved (e.g. ambient declarations)
          }
        }
      }

      // Default import: import Foo from './module'
      if (node.importClause?.name) {
        try {
          const symbol = checker.getSymbolAtLocation(node.importClause.name);
          if (!symbol) return;

          const aliased = checker.getAliasedSymbol(symbol);
          const decl = aliased.getDeclarations?.()?.[0];
          if (!decl) return;

          importsByName.set(node.importClause.name.text, {
            targetFile: decl.getSourceFile().fileName,
            targetLine: ts.getLineAndCharacterOfPosition(decl.getSourceFile(), decl.getStart()).line + 1,
            targetSymbol: aliased.getName(),
            isTypeOnly: isTypeOnly || isTypeOnlySymbol(aliased, ts),
          });
        } catch {
          // Skip
        }
      }

      // Namespace import: import * as Foo from './module'
      if (bindings && ts.isNamespaceImport(bindings)) {
        try {
          const symbol = checker.getSymbolAtLocation(bindings.name);
          if (!symbol) return;

          const aliased = checker.getAliasedSymbol(symbol);
          const decl = aliased.getDeclarations?.()?.[0];
          if (!decl) return;

          importsByName.set(bindings.name.text, {
            targetFile: decl.getSourceFile().fileName,
            targetLine: ts.getLineAndCharacterOfPosition(decl.getSourceFile(), decl.getStart()).line + 1,
            targetSymbol: aliased.getName(),
            isTypeOnly: false,
          });
        } catch {
          // Skip
        }
      }
    });

    if (importsByName.size > 0) {
      result.set(sourceFile.fileName, importsByName);
    }
  }

  console.log(`[TSAnalyzer] Resolved import definitions for ${result.size} files`);
  return result;
}

/**
 * Get all exports of each module, including re-exports.
 * Uses `checker.getExportsOfModule()` to follow re-exports transitively,
 * replacing the heuristic barrel content detection in `resolveBarrelChains()`.
 *
 * @param {ts.Program} program
 * @param {ts.TypeChecker} checker
 * @returns {Map<string, Array<{ exportName: string, targetFile: string, targetLine: number, isReExport: boolean }>>}
 */
export function resolveModuleExports(program, checker) {
  const ts = tsModule;
  if (!ts || !checker) return new Map();

  const result = new Map();
  const sourceFiles = program.getSourceFiles().filter(f => !f.isDeclarationFile);

  for (const sourceFile of sourceFiles) {
    const exports = [];

    try {
      const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
      if (!moduleSymbol) continue;

      const moduleExports = checker.getExportsOfModule(moduleSymbol);
      for (const exp of moduleExports) {
        try {
          const aliased = checker.getAliasedSymbol(exp);
          const decl = aliased.getDeclarations?.()?.[0];
          if (!decl) continue;

          const isReExport = aliased !== exp && aliased !== moduleSymbol;
          exports.push({
            exportName: exp.getName(),
            targetFile: decl.getSourceFile().fileName,
            targetLine: ts.getLineAndCharacterOfPosition(decl.getSourceFile(), decl.getStart()).line + 1,
            isReExport,
          });
        } catch {
          // Skip unresolvable exports
        }
      }
    } catch {
      // Skip files that can't be analyzed
    }

    if (exports.length > 0) {
      result.set(sourceFile.fileName, exports);
    }
  }

  console.log(`[TSAnalyzer] Resolved module exports for ${result.size} files`);
  return result;
}

/**
 * Build a call graph by resolving each CallExpression to its actual target.
 * Uses `checker.getSymbolAtLocation()` on the call expression to determine
 * what function is being called, replacing the name-matching heuristic in
 * `functionCallRelationships`.
 *
 * @param {ts.Program} program
 * @param {ts.TypeChecker} checker
 * @returns {Map<string, Array<{ calleeName: string, calleeFile: string, calleeLine: number }>>}
 */
export function buildCallGraph(program, checker) {
  const ts = tsModule;
  if (!ts || !checker) return new Map();

  const result = new Map();
  const sourceFiles = program.getSourceFiles().filter(f => !f.isDeclarationFile);

  for (const sourceFile of sourceFiles) {
    const visit = (node, callerName) => {
      // Track function declarations to know what "caller" we're inside
      if (ts.isFunctionDeclaration(node) && node.name) {
        callerName = node.name.text;
      } else if (ts.isVariableStatement(node)) {
        for (const decl of node.declarationList.declarations) {
          if (decl.name && ts.isIdentifier(decl.name) && decl.initializer) {
            if (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer)) {
              callerName = decl.name.text;
            }
          }
        }
      } else if (ts.isMethodDeclaration(node) && node.name) {
        callerName = `${getClassName(node, sourceFile, ts)}.${node.name.text}`;
      }

      if (ts.isCallExpression(node) && callerName) {
        try {
          const callSymbol = checker.getSymbolAtLocation(node.expression);
          if (callSymbol) {
            const aliased = checker.getAliasedSymbol(callSymbol);
            const decl = aliased.getDeclarations?.()?.[0];
            if (decl && decl.getSourceFile() !== sourceFile) {
              // Only track cross-file calls (same-file calls add noise)
              if (!result.has(callerName)) result.set(callerName, []);

              // Deduplicate
              const calleeName = aliased.getName();
              const calleeFile = decl.getSourceFile().fileName;
              const existing = result.get(callerName);
              if (!existing.some(e => e.calleeName === calleeName && e.calleeFile === calleeFile)) {
                existing.push({
                  calleeName,
                  calleeFile,
                  calleeLine: ts.getLineAndCharacterOfPosition(decl.getSourceFile(), decl.getStart()).line + 1,
                });
              }
            }
          }
        } catch {
          // Skip unresolvable calls
        }
      }

      ts.forEachChild(node, (child) => visit(child, callerName));
    };

    ts.forEachChild(sourceFile, (node) => visit(node, null));
  }

  console.log(`[TSAnalyzer] Built call graph for ${result.size} callers`);
  return result;
}

/**
 * Find all references to exported symbols.
 * Uses `checker.getReferencesAtLocation()` to determine which files
 * consume each export, creating accurate dependency edges.
 *
 * @param {ts.Program} program
 * @param {ts.TypeChecker} checker
 * @returns {Map<string, { sourceFile: string, sourceLine: number, symbolName: string, referencedBy: Array<{ file: string, line: number }> }>}
 */
export function findExportReferences(program, checker) {
  const ts = tsModule;
  if (!ts || !checker) return new Map();

  const result = new Map();
  const sourceFiles = program.getSourceFiles().filter(f => !f.isDeclarationFile);

  for (const sourceFile of sourceFiles) {
    ts.forEachChild(sourceFile, (node) => {
      // Export declarations: export { Foo } or export { Foo as Bar }
      if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
        for (const element of node.exportClause.elements) {
          try {
            const symbol = checker.getSymbolAtLocation(element.name);
            if (!symbol) continue;

            const refs = checker.getReferencesAtLocation(element.name);
            if (!refs || refs.length === 0) continue;

            const exportKey = `${sourceFile.fileName}::${element.name.text}`;
            result.set(exportKey, {
              sourceFile: sourceFile.fileName,
              sourceLine: ts.getLineAndCharacterOfPosition(sourceFile, element.name.getStart()).line + 1,
              symbolName: element.name.text,
              referencedBy: refs
                .filter(r => r.fileName !== sourceFile.fileName) // Exclude self-references
                .map(r => ({
                  file: r.fileName,
                  line: ts.getLineAndCharacterOfPosition(
                    program.getSourceFile(r.fileName) || sourceFile,
                    r.textSpan.start
                  ).line + 1,
                })),
            });
          } catch {
            // Skip
          }
        }
      }

      // Exported function/class declarations
      if ((ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) &&
          node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) && node.name) {
        try {
          const symbol = checker.getSymbolAtLocation(node.name);
          if (!symbol) return;

          const refs = checker.getReferencesAtLocation(node.name);
          if (!refs || refs.length === 0) return;

          const exportKey = `${sourceFile.fileName}::${node.name.text}`;
          result.set(exportKey, {
            sourceFile: sourceFile.fileName,
            sourceLine: ts.getLineAndCharacterOfPosition(sourceFile, node.name.getStart()).line + 1,
            symbolName: node.name.text,
            referencedBy: refs
              .filter(r => r.fileName !== sourceFile.fileName)
              .map(r => ({
                file: r.fileName,
                line: ts.getLineAndCharacterOfPosition(
                  program.getSourceFile(r.fileName) || sourceFile,
                  r.textSpan.start
                ).line + 1,
              })),
          });
        } catch {
          // Skip
        }
      }

      // Exported variable declarations (export const Foo = ...)
      if (ts.isVariableStatement(node) &&
          node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        for (const decl of node.declarationList.declarations) {
          if (!decl.name || !ts.isIdentifier(decl.name)) continue;
          try {
            const symbol = checker.getSymbolAtLocation(decl.name);
            if (!symbol) continue;

            const refs = checker.getReferencesAtLocation(decl.name);
            if (!refs || refs.length === 0) continue;

            const exportKey = `${sourceFile.fileName}::${decl.name.text}`;
            result.set(exportKey, {
              sourceFile: sourceFile.fileName,
              sourceLine: ts.getLineAndCharacterOfPosition(sourceFile, decl.name.getStart()).line + 1,
              symbolName: decl.name.text,
              referencedBy: refs
                .filter(r => r.fileName !== sourceFile.fileName)
                .map(r => ({
                  file: r.fileName,
                  line: ts.getLineAndCharacterOfPosition(
                    program.getSourceFile(r.fileName) || sourceFile,
                    r.textSpan.start
                  ).line + 1,
                })),
            });
          } catch {
            // Skip
          }
        }
      }
    });
  }

  console.log(`[TSAnalyzer] Found export references for ${result.size} symbols`);
  return result;
}

/**
 * Extract rich type metadata for key symbols (components, hooks, stores, functions).
 * Uses `checker.getTypeAtLocation()` and `checker.typeToString()` to provide
 * accurate type information that can be added as Merfolk node metadata.
 *
 * @param {ts.Program} program
 * @param {ts.TypeChecker} checker
 * @returns {Map<string, { filePath: string, typeString: string, properties?: Array<{ name: string, type: string }> }>}
 */
export function extractRichTypeMetadata(program, checker) {
  const ts = tsModule;
  if (!ts || !checker) return new Map();

  const result = new Map();
  const sourceFiles = program.getSourceFiles().filter(f => !f.isDeclarationFile);

  for (const sourceFile of sourceFiles) {
    ts.forEachChild(sourceFile, (node) => {
      let name = null;
      let funcNode = null;

      if (ts.isFunctionDeclaration(node) && node.name) {
        name = node.name.text;
        funcNode = node;
      } else if (ts.isVariableStatement(node)) {
        for (const decl of node.declarationList.declarations) {
          if (decl.name && ts.isIdentifier(decl.name) && decl.initializer) {
            name = decl.name.text;
            funcNode = decl;
          }
        }
      } else if (ts.isClassDeclaration(node) && node.name) {
        name = node.name.text;
        funcNode = node;
      }

      if (!name || !funcNode) return;

      // Only extract for components, hooks, stores, and exported symbols
      const isComponent = /^[A-Z]/.test(name);
      const isHook = /^use[A-Z]/.test(name);
      const isStore = /store|Store/i.test(name);
      const isExported = node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword);

      if (!isComponent && !isHook && !isStore && !isExported) return;

      try {
        const symbol = checker.getSymbolAtLocation(
          ts.isFunctionDeclaration(funcNode) || ts.isClassDeclaration(funcNode)
            ? funcNode.name
            : funcNode.name
        );
        if (!symbol) return;

        const type = checker.getTypeOfSymbolAtLocation(symbol, funcNode);
        const typeString = checker.typeToString(type);

        // For store-like or complex types, enumerate properties
        let properties = undefined;
        if (isStore || (typeString.includes('{') && type.getProperties().length > 0 && type.getProperties().length < 20)) {
          const props = type.getProperties();
          properties = props.map(p => ({
            name: p.getName(),
            type: checker.typeToString(checker.getTypeOfSymbolAtLocation(p, funcNode)),
          }));
        }

        result.set(name, {
          filePath: sourceFile.fileName,
          typeString: typeString.slice(0, 200), // Truncate long type strings
          properties,
        });
      } catch {
        // Skip files with type errors
      }
    });
  }

  console.log(`[TSAnalyzer] Extracted rich type metadata for ${result.size} symbols`);
  return result;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Check if a symbol is effectively type-only (all uses are type positions).
 */
function isTypeOnlySymbol(symbol, ts) {
  if (!symbol.declarations) return false;
  for (const decl of symbol.declarations) {
    if (ts.isTypeAliasDeclaration(decl) || ts.isInterfaceDeclaration(decl)) return true;
    if (ts.isImportSpecifier(decl) && decl.importKind === ts.SyntaxKind.TypeKeyword) return true;
  }
  return false;
}

/**
 * Get the class name containing a method declaration.
 */
function getClassName(node, sourceFile, ts) {
  let current = node.parent;
  while (current) {
    if (ts.isClassDeclaration(current) && current.name) return current.name.text;
    if (ts.isClassExpression(current) && current.name) return current.name.text;
    current = current.parent;
  }
  return 'unknown';
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

  // L2 extractions — existing
  const componentPropTypes = extractComponentPropTypes(program, checker);
  const hookReturnTypes = extractHookReturnTypes(program, checker);
  const typeImports = classifyTypeImports(program, checker);

  // L2 extractions — new (LSP-like semantic analysis)
  const importDefinitions = resolveImportDefinitions(program, checker);
  const moduleExports = resolveModuleExports(program, checker);
  const callGraph = buildCallGraph(program, checker);
  const exportReferences = findExportReferences(program, checker);
  const richTypes = extractRichTypeMetadata(program, checker);

  const elapsed = Date.now() - startTime;
  console.log(`[TSAnalyzer] Analysis complete in ${elapsed}ms:`);
  console.log(`  ${componentPropTypes.size} component prop types, ${hookReturnTypes.size} hook return types, ${typeImports.size} files with type imports`);
  console.log(`  ${importDefinitions.size} files with resolved imports, ${moduleExports.size} files with resolved exports`);
  console.log(`  ${callGraph.size} callers in call graph, ${exportReferences.size} symbols with references`);
  console.log(`  ${richTypes.size} symbols with rich type metadata`);

  return {
    componentPropTypes, hookReturnTypes, typeImports,
    importDefinitions, moduleExports, callGraph, exportReferences, richTypes,
  };
}
