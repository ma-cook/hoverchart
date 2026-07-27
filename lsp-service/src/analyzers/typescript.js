/**
 * typescript.js
 *
 * TypeScript/JavaScript LSP analyzer.
 * Uses typescript-language-server to provide definition resolution,
 * reference finding, call graph extraction, and type metadata.
 */

/**
 * Analyze TypeScript/JavaScript files using the LSP.
 *
 * @param {import('../lspManager.js').LspManager} lspManager
 * @param {Array<{path: string, content: string}>} files
 * @param {object} options
 * @param {boolean} [options.includeDefinitions=true]
 * @param {boolean} [options.includeReferences=true]
 * @param {boolean} [options.includeHover=true]
 * @param {boolean} [options.includeCallGraph=true]
 * @param {function} [onProgress]
 * @returns {Promise<import('../lib/protocol.js').AnalyzeResult>}
 */
export async function analyzeTypeScript(lspManager, files, options = {}, onProgress) {
  const {
    includeDefinitions = true,
    includeReferences = true,
    includeHover = true,
    includeCallGraph = true,
  } = options;

  const result = {
    definitions: [],
    references: [],
    hover: [],
    callGraph: [],
    moduleExports: [],
    errors: [],
  };

  // Filter to TS/JS files only
  const tsFiles = files.filter(f => /\.(tsx?|jsx?|mjs|cjs)$/.test(f.path));
  if (tsFiles.length === 0) return result;

  // Open all files in the language server
  const language = 'typescript';
  for (let i = 0; i < tsFiles.length; i++) {
    const file = tsFiles[i];
    try {
      const langId = file.path.endsWith('.tsx') ? 'typescriptreact'
        : file.path.endsWith('.jsx') ? 'javascriptreact'
        : file.path.endsWith('.ts') ? 'typescript'
        : 'javascript';
      await lspManager.request(language, 'textDocument/didOpen', {
        textDocument: {
          uri: `file:///${file.path}`,
          languageId: langId,
          version: 1,
          text: file.content,
        },
      });
    } catch (err) {
      result.errors.push({ file: file.path, message: err.message, severity: 'warning' });
    }

    if (onProgress) {
      onProgress({ processed: i + 1, total: tsFiles.length, currentFile: file.path });
    }
  }

  // Analyze each file
  for (const file of tsFiles) {
    const lines = file.content.split('\n');

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];

      // ── Import definitions ───────────────────────────────────────────
      if (includeDefinitions && /^\s*import\s/.test(line)) {
        try {
          // Find the import source string position
          const sourceMatch = line.match(/from\s+['"]([^'"]+)['"]/);
          if (sourceMatch) {
            const col = line.indexOf(sourceMatch[1]);
            const defResult = await lspManager.request(language, 'textDocument/definition', {
              textDocument: { uri: `file:///${file.path}` },
              position: { line: lineIdx, character: col },
            }, 5000);

            if (defResult && (Array.isArray(defResult) ? defResult.length > 0 : defResult)) {
              const defs = Array.isArray(defResult) ? defResult : [defResult];
              for (const def of defs) {
                result.definitions.push({
                  sourceFile: file.path,
                  importName: sourceMatch[1],
                  targetFile: (def.uri || '').replace('file:///', ''),
                  targetLine: (def.range?.start?.line || 0) + 1,
                  targetSymbol: '',
                  isTypeOnly: /import\s+type\s/.test(line),
                });
              }
            }
          }
        } catch (err) {
          result.errors.push({ file: file.path, message: `definition: ${err.message}`, severity: 'warning' });
        }
      }

      // ── Export references ────────────────────────────────────────────
      if (includeReferences && /^\s*export\s/.test(line)) {
        try {
          const exportNameMatch = line.match(/export\s+(?:default\s+)?(?:function|class|const|let|var|interface|type)\s+(\w+)/);
          const namedMatch = line.match(/export\s+\{\s*(\w+)/);

          const symbolName = exportNameMatch?.[1] || namedMatch?.[1];
          if (symbolName) {
            const col = line.indexOf(symbolName);
            const refsResult = await lspManager.request(language, 'textDocument/references', {
              textDocument: { uri: `file:///${file.path}` },
              position: { line: lineIdx, character: col },
              context: { includeDeclaration: false },
            }, 5000);

            if (refsResult && Array.isArray(refsResult) && refsResult.length > 0) {
              result.references.push({
                sourceFile: file.path,
                sourceLine: lineIdx + 1,
                symbolName,
                referencedBy: refsResult
                  .filter(r => r.uri !== `file:///${file.path}`)
                  .map(r => ({
                    file: (r.uri || '').replace('file:///', ''),
                    line: (r.range?.start?.line || 0) + 1,
                  })),
              });
            }
          }
        } catch (err) {
          result.errors.push({ file: file.path, message: `references: ${err.message}`, severity: 'warning' });
        }
      }

      // ── Hover / type info ───────────────────────────────────────────
      if (includeHover) {
        const symbolMatch = line.match(/(?:function|const|let|var|class)\s+(\w+)/);
        if (symbolMatch) {
          try {
            const col = line.indexOf(symbolMatch[1]);
            const hoverResult = await lspManager.request(language, 'textDocument/hover', {
              textDocument: { uri: `file:///${file.path}` },
              position: { line: lineIdx, character: col },
            }, 5000);

            if (hoverResult?.contents) {
              const typeStr = typeof hoverResult.contents === 'string'
                ? hoverResult.contents
                : hoverResult.contents.value || hoverResult.contents.plainText || '';

              if (typeStr) {
                result.hover.push({
                  file: file.path,
                  line: lineIdx + 1,
                  symbol: symbolMatch[1],
                  type: typeStr.slice(0, 200),
                  documentation: undefined,
                });
              }
            }
          } catch {
            // Hover failures are non-fatal
          }
        }
      }
    }

    // ── Call graph: extract from function bodies ─────────────────────
    if (includeCallGraph) {
      try {
        // Use textDocument/references on function declarations to find callers
        for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
          const line = lines[lineIdx];
          const funcMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
          if (!funcMatch) continue;

          try {
            const refsResult = await lspManager.request(language, 'textDocument/references', {
              textDocument: { uri: `file:///${file.path}` },
              position: { line: lineIdx, character: line.indexOf(funcMatch[1]) },
              context: { includeDeclaration: false },
            }, 5000);

            if (refsResult && Array.isArray(refsResult)) {
              for (const ref of refsResult) {
                if (ref.uri === `file:///${file.path}`) continue; // Skip same-file refs
                result.callGraph.push({
                  callerFile: (ref.uri || '').replace('file:///', ''),
                  callerName: '',
                  calleeFile: file.path,
                  calleeName: funcMatch[1],
                  calleeLine: lineIdx + 1,
                });
              }
            }
          } catch {
            // Non-fatal
          }
        }
      } catch {
        // Non-fatal
      }
    }
  }

  // Close all files
  for (const file of tsFiles) {
    try {
      await lspManager.request(language, 'textDocument/didClose', {
        textDocument: { uri: `file:///${file.path}` },
      });
    } catch {
      // Non-fatal
    }
  }

  return result;
}

export default analyzeTypeScript;
