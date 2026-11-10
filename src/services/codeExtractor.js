// The info string after the opening fence is everything up to the newline. It
// may be just a language (`jsx`), a language + path with either a colon or a
// space (`jsx:src/App.jsx`, `jsx src/App.jsx`), or a bare path
// (`src/App.jsx`). Accepting all of these is what lets a model that "just
// outputs code" (instead of calling the edit tool) still produce a change that
// the harness can route to the right file.
const CODE_BLOCK_REGEX = /```([^\n`]*)\n([\s\S]*?)```/g;

// Parse an info string into { lang, path }. Conservative: only treat a token
// as a path when it looks like one (contains a slash or a dot), so a stray
// word like `copy` in "```jsx copy" is not mistaken for a filename.
function parseInfoString(info) {
  const s = (info || '').trim();
  if (!s) return { lang: '', path: null };

  const hasPathChars = (t) => /[./]/.test(t);

  const colon = s.match(/^([A-Za-z0-9_+#.-]+)\s*:\s*(.+)$/);
  if (colon && hasPathChars(colon[2].trim())) {
    return { lang: colon[1], path: colon[2].trim() };
  }

  const space = s.match(/^([A-Za-z0-9_+#.-]+)\s+(.+)$/);
  if (space && !hasPathChars(space[1]) && hasPathChars(space[2].trim())) {
    return { lang: space[1], path: space[2].trim() };
  }

  if (hasPathChars(s)) return { lang: '', path: s };
  return { lang: s, path: null };
}

const FILE_DIRECTIVE_REGEX = /\/\/\s*FILE:\s*(.+)/m;
const NODE_DIRECTIVE_REGEX = /\/\/\s*NODE:\s*(\S+)/m;
const HASH_FILE_DIRECTIVE = /#\s*FILE:\s*(.+)/m;
const HASH_NODE_DIRECTIVE = /#\s*NODE:\s*(\S+)/m;
const PY_FILE_DIRECTIVE = /^#\s*FILE:\s*(.+)/m;
const PY_NODE_DIRECTIVE = /^#\s*NODE:\s*(\S+)/m;

export function extractCodeBlocks(text) {
  if (!text) return [];
  const blocks = [];
  // Maps a `${filePath||nodeId}_${lang}` key to its index in `blocks`, so a
  // second code block for the same file can be MERGED into the first instead
  // of dropped. A model commonly emits one block per changed region; dropping
  // every block after the first silently discarded most of the edit.
  const indexByKey = new Map();
  let match;

  CODE_BLOCK_REGEX.lastIndex = 0;
  while ((match = CODE_BLOCK_REGEX.exec(text)) !== null) {
    const { lang, path: pathFromLabel } = parseInfoString(match[1]);
    const code = match[2].trim();
    if (!code) continue;

    let filePath = pathFromLabel;
    let nodeId = null;

    const lines = code.split('\n');
    const headerLines = [];
    const bodyLines = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!nodeId) {
        const nodeMatch = trimmed.match(NODE_DIRECTIVE_REGEX) ||
                          trimmed.match(HASH_NODE_DIRECTIVE) ||
                          trimmed.match(PY_NODE_DIRECTIVE);
        if (nodeMatch) {
          nodeId = nodeMatch[1];
          headerLines.push(line);
          continue;
        }
      }
      if (!filePath) {
        const fileMatch = trimmed.match(FILE_DIRECTIVE_REGEX) ||
                          trimmed.match(HASH_FILE_DIRECTIVE) ||
                          trimmed.match(PY_FILE_DIRECTIVE);
        if (fileMatch) {
          filePath = fileMatch[1].trim();
          headerLines.push(line);
          continue;
        }
      }
      bodyLines.push(line);
    }

    // A fence with no language and no path (a plain ``` block) carries no
    // routing information — skip it rather than inventing a `generated.` file.
    if (!filePath && !lang && !nodeId) continue;

    if (!filePath) {
      filePath = inferFilePathFromLang(lang, nodeId);
    }

    const bodyCode = bodyLines.join('\n').trim();
    const dedupKey = `${filePath || nodeId || 'unknown'}_${lang}`;
    const existingIndex = indexByKey.get(dedupKey);
    if (existingIndex !== undefined) {
      const existing = blocks[existingIndex];
      // Multiple SEARCH/REPLACE hunks for the same file must ALL survive: join
      // them so the apply/push step sees every hunk. Plain full-file duplicates
      // stay deduped (merging identical whole files would corrupt the result).
      if (hasSearchReplaceMarkers(bodyCode) && hasSearchReplaceMarkers(existing.code)) {
        existing.code = `${existing.code}\n\n${bodyCode}`;
        existing.rawCode = `${existing.rawCode}\n\n${code}`;
      }
      continue;
    }
    indexByKey.set(dedupKey, blocks.length);

    blocks.push({
      filePath,
      nodeId,
      language: mapLanguage(lang),
      code: bodyCode,
      rawCode: code,
    });
  }

  return blocks;
}

function inferFilePathFromLang(lang, nodeId) {
  if (!nodeId) return `generated.${mapExtension(lang)}`;
  return `src/${nodeId}.${mapExtension(lang)}`;
}

function mapLanguage(lang) {
  const map = {
    js: 'javascript',
    jsx: 'jsx',
    ts: 'typescript',
    tsx: 'tsx',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    cs: 'csharp',
    php: 'php',
    vue: 'vue',
    css: 'css',
    scss: 'scss',
    html: 'html',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    dockerfile: 'dockerfile',
    docker: 'dockerfile',
  };
  return map[lang] || lang;
}

function mapExtension(lang) {
  const map = {
    javascript: 'js',
    jsx: 'jsx',
    typescript: 'ts',
    tsx: 'tsx',
    python: 'py',
    ruby: 'rb',
    go: 'go',
    rust: 'rs',
    java: 'java',
    csharp: 'cs',
    php: 'php',
    vue: 'vue',
    css: 'css',
    scss: 'scss',
    html: 'html',
    json: 'json',
    yaml: 'yaml',
    sql: 'sql',
    shell: 'sh',
    dockerfile: 'Dockerfile',
  };
  return map[lang] || lang;
}

export function hasCodeBlocks(text) {
  if (!text) return false;
  CODE_BLOCK_REGEX.lastIndex = 0;
  return CODE_BLOCK_REGEX.test(text);
}

const STRIP_CODE_BLOCK_REGEX = /```[\s\S]*?```/g;
const STRIP_OPEN_CODE_BLOCK_REGEX = /```[\s\S]*$/;

export function stripCodeBlocks(text) {
  if (!text) return '';
  return text.replace(STRIP_CODE_BLOCK_REGEX, '').replace(STRIP_OPEN_CODE_BLOCK_REGEX, '').trim();
}

const SEARCH_MARKER = /<<<<<<<\s*SEARCH/m;
const DIVIDER_MARKER = /=======/m;
const REPLACE_MARKER = />>>>>>>\s*REPLACE/m;

export function hasSearchReplaceMarkers(code) {
  return SEARCH_MARKER.test(code) && DIVIDER_MARKER.test(code) && REPLACE_MARKER.test(code);
}
