/**
 * symbolRanges.js
 *
 * Best-effort, language-aware extraction of the 1-based start/end line range
 * of each top-level function/class declaration in a source file.
 *
 * Used as a fallback when a primary scanner (e.g. Babel for JS/TS/JSX, or the
 * tree-sitter worker for Python/Go/Rust/Java/C/C++/C#/Ruby/PHP) does not carry
 * line ranges itself, so the code-viewer can still slice the exact symbol's
 * code out of the full file content.
 *
 * This is intentionally tolerant: anything it cannot reliably scope simply
 * produces no range and callers fall back to showing the whole file.
 */

const BRACED_LANGUAGE_KEYS = new Set([
  'js', 'jsx', 'ts', 'tsx', 'vue', 'mjs', 'cjs',
  'go', 'rust', 'java', 'c', 'cpp', 'csharp', 'php',
]);

/**
 * Find the exclusive character index just past the closing brace that balances
 * the first `{` at/after `openFrom`. Ignores string literals and comments so
 * braces inside them cannot corrupt the match.
 *
 * @returns {number|null} index just after the balanced close brace, or null.
 */
function findBlockEnd(code, openFrom) {
  const n = code.length;
  let brace = code.indexOf('{', openFrom);
  if (brace === -1) return null;

  let depth = 0;
  let strChar = null;      // ' " ` — or null when outside a string
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = brace; i < n; i++) {
    const c = code[i];
    const next = code[i + 1];

    if (inLineComment) {
      if (c === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (c === '*' && next === '/') { inBlockComment = false; i++; }
      continue;
    }
    if (strChar) {
      if (c === '\\') { i++; continue; }
      if (c === strChar) strChar = null;
      continue;
    }

    if (c === '/' && next === '/') { inLineComment = true; i++; continue; }
    if (c === '/' && next === '*') { inBlockComment = true; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { strChar = c; continue; }
    if (c === '{') { depth++; continue; }
    if (c === '}') {
      depth--;
      if (depth === 0) {
        const newline = code.indexOf('\n', i);
        return newline === -1 ? n : newline + 1;
      }
    }
  }
  return null;
}

/** Find the index of the end-of-line (exclusive) for a 0-based char index. */
function endOfLine(code, index) {
  const newline = code.indexOf('\n', index);
  return newline === -1 ? code.length : newline;
}

/**
 * Braced-language declarations matched per line. Group 1 is the symbol name.
 * `isArrow` declarations have a `{ ... }` init inside the same statement; for
 * those we want the statement's block, so brace matching from the line start
 * already captures it correctly.
 */
const BRACED_DECL_PATTERNS = [
  /\b(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/,
  /\bclass\s+([A-Za-z_$][\w$]*)\s*(?:<[^>]*>)?\b/,
  /\binterface\s+([A-Za-z_$][\w$]*)\b/,
  /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function|makeClass|class)\b/,
  /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/,
  /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?[A-Za-z_$][\w$]*\s*=>/,
];

/** Python declarations matched per line. Group 1 is the symbol name. */
const PYTHON_DECL_PATTERNS = [
  /^(?:async\s+)?def\s+([A-Za-z_]\w*)\s*\(/,
  /^class\s+([A-Za-z_]\w*)/,
];

/**
 * Map a file path to the language key used by `computeSymbolRanges`.
 * Extension-specific but coarse (js ↔ jsx are interchangeable here).
 */
const EXTENSION_LANGUAGE_MAP = [
  ['js', ['js', 'jsx', 'mjs', 'cjs', 'vue']],
  ['ts', ['ts', 'tsx', 'mts', 'cts']],
  ['python', ['py']],
  ['go', ['go']],
  ['rust', ['rs']],
  ['java', ['java']],
  ['c', ['c', 'h']],
  ['cpp', ['cpp', 'cc', 'cxx', 'hpp', 'hh', 'hxx']],
  ['csharp', ['cs']],
  ['ruby', ['rb']],
  ['php', ['php']],
];

/** @returns {string} language key for `computeSymbolRanges`, or '' if unknown. */
export function languageFromFilePath(filePath) {
  if (!filePath) return '';
  const dot = filePath.lastIndexOf('.');
  if (dot === -1) return '';
  const ext = filePath.slice(dot + 1).toLowerCase();
  for (const [key, exts] of EXTENSION_LANGUAGE_MAP) {
    if (exts.includes(ext)) return key;
  }
  return '';
}

/**
 * Compute the indentation-based end line for a Python block that begins at the
 * declaration line index `declLine` (1-based) with `declIndent` leading spaces.
 */
function pythonBlockEnd(lines, declLine, declIndent) {
  for (let i = declLine; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const indent = line.length - line.trimStart().length;
    if (indent <= declIndent) {
      return Math.max(declLine, i);
    }
  }
  return lines.length;
}

/**
 * Scan `source` and return a Map of symbol name → { startLine, endLine } for
 * every function/class declaration the language pattern can scope.
 *
 * @param {string} source   Raw file contents.
 * @param {string} language Language key (e.g. 'js', 'tsx', 'python', 'go').
 * @returns {Map<string, {startLine: number, endLine: number}>}
 */
export function computeSymbolRanges(source, language) {
  const ranges = new Map();
  if (!source) return ranges;

  const lang = (language || '').toLowerCase();
  const isPython = lang === 'python';
  const exhausted = new Set(); // symbols we've already scoped — first wins

  const record = (name, startLine, endLine) => {
    if (!name || exhausted.has(name)) return;
    exhausted.add(name);
    ranges.set(name, { startLine, endLine });
  };

  if (isPython) {
    const lines = source.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const re of PYTHON_DECL_PATTERNS) {
        const m = line.match(re);
        if (!m) continue;
        const indent = line.length - line.trimStart().length;
        record(m[1], i + 1, pythonBlockEnd(lines, i + 2, indent));
        break;
      }
    }
    return ranges;
  }

  if (!BRACED_LANGUAGE_KEYS.has(lang)) {
    // Unsupported language — no ranges. The code-viewer falls back to whole file.
    return ranges;
  }

  // Locate offset of every line so brace matching can run against the full
  // source (line-start offset alone doesn't reveal what precedes it).
  const lineStarts = [];
  const lineStartRe = /^/gm;
  let m;
  while ((m = lineStartRe.exec(source)) !== null) lineStarts.push(m.index);

  for (let i = 0; i < lineStarts.length; i++) {
    const lineStr = source.slice(lineStarts[i], endOfLine(source, lineStarts[i]));
    for (const re of BRACED_DECL_PATTERNS) {
      const dm = lineStr.match(re);
      if (!dm) continue;
      const endIndex = findBlockEnd(source, lineStarts[i]);
      const endLine = endIndex == null
        ? i + 1
        : Math.max(i + 1, source.slice(0, endIndex).split('\n').length);
      record(dm[1], i + 1, endLine);
      break;
    }
  }

  return ranges;
}