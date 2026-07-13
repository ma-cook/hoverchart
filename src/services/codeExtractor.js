const CODE_BLOCK_REGEX = /```(\w+)(?::([^\n]*?))?\n([\s\S]*?)```/g;

const FILE_DIRECTIVE_REGEX = /\/\/\s*FILE:\s*(.+)/m;
const NODE_DIRECTIVE_REGEX = /\/\/\s*NODE:\s*(\S+)/m;
const HASH_FILE_DIRECTIVE = /#\s*FILE:\s*(.+)/m;
const HASH_NODE_DIRECTIVE = /#\s*NODE:\s*(\S+)/m;
const PY_FILE_DIRECTIVE = /^#\s*FILE:\s*(.+)/m;
const PY_NODE_DIRECTIVE = /^#\s*NODE:\s*(\S+)/m;

export function extractCodeBlocks(text) {
  if (!text) return [];
  const blocks = [];
  const seenPaths = new Set();
  let match;

  while ((match = CODE_BLOCK_REGEX.exec(text)) !== null) {
    const lang = match[1];
    const pathFromLabel = match[2] ? match[2].trim() : null;
    const code = match[3].trim();
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

    if (!filePath) {
      filePath = inferFilePathFromLang(lang, nodeId);
    }

    const dedupKey = `${filePath || nodeId || 'unknown'}_${lang}`;
    if (seenPaths.has(dedupKey)) continue;
    seenPaths.add(dedupKey);

    blocks.push({
      filePath,
      nodeId,
      language: mapLanguage(lang),
      code: bodyLines.join('\n').trim(),
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
