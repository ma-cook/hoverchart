import { parse } from '@babel/parser';
import { fetchFileContent } from './githubRepoService';

function getNodeBrackets(declaration) {
  if (declaration.startsWith('{Component:')) return { type: 'Component', bracket: '{}' };
  if (declaration.startsWith('[Hook:')) return { type: 'Hook', bracket: '[]' };
  if (declaration.startsWith('[[Store:') || declaration.startsWith('[[Interface:')) return { type: 'Store', bracket: '[[]]' };
  if (declaration.startsWith('((Service:')) return { type: 'Service', bracket: '(())' };
  if (declaration.startsWith('<Library:')) return { type: 'Library', bracket: '<>' };
  if (declaration.startsWith('[Module:')) return { type: 'Module', bracket: '[]' };
  if (declaration.startsWith('[Function:')) return { type: 'Function', bracket: '[]' };
  if (declaration.startsWith('[Endpoint:')) return { type: 'Endpoint', bracket: '[]' };
  if (declaration.startsWith('[Boundary:')) return { type: 'Boundary', bracket: '[]' };
  if (declaration.startsWith('[Guard:')) return { type: 'Guard', bracket: '[]' };
  return { type: 'Unknown', bracket: '' };
}

function parseNodes(merfolkContent) {
  const nodes = [];
  const lines = merfolkContent.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('%%') || line.startsWith('flowpath') || line.startsWith('graph3d') || line.startsWith('ast3d')) continue;
    const match = line.match(/^(\w+)\s*(\{[^}]*\}|\[\[[^\]]*\]\]|\[[^\]]*\]|\(\([^)]*\)\)|<[^>]*>)/);
    if (match) {
      const nodeId = match[1];
      const declaration = match[2];
      const propsMatch = line.match(/\}\s*(\{[^}]*\})\s*$/);
      const properties = {};
      if (propsMatch) {
        const propStr = propsMatch[1];
        let propMatch;
        const propRe = /(\w+):\s*"([^"]*)"/g;
        while ((propMatch = propRe.exec(propStr)) !== null) {
          properties[propMatch[1]] = propMatch[2];
        }
      }
      const { type, bracket } = getNodeBrackets(declaration);
      const nameMatch = declaration.match(/:\s*([^}\]]+)\s*[}\]]/);
      const name = nameMatch ? nameMatch[1].trim() : nodeId;
      nodes.push({ nodeId, declaration, name, type, bracket, properties, lineIndex: i, line });
    }
  }
  return nodes;
}

function findFileForNode(nodeId, nodeName, fileTree) {
  if (!fileTree || fileTree.length === 0) return null;
  const candidates = [
    `${nodeId}.jsx`, `${nodeId}.tsx`, `${nodeId}.js`, `${nodeId}.ts`,
    `${nodeName}.jsx`, `${nodeName}.tsx`, `${nodeName}.js`, `${nodeName}.ts`,
  ];
  for (const file of fileTree) {
    if (file.type !== 'file') continue;
    const filePath = file.path || '';
    for (const candidate of candidates) {
      if (filePath.endsWith(`/${candidate}`) || filePath === candidate) {
        return filePath;
      }
    }
  }
  const lowerId = nodeId.toLowerCase();
  for (const file of fileTree) {
    if (file.type !== 'file') continue;
    const baseName = (file.path || '').split('/').pop()?.toLowerCase()?.replace(/\.(jsx|tsx|js|ts)$/, '');
    if (baseName === lowerId) return file.path;
  }
  return null;
}

function analyzeFileExports(content, filePath) {
  const exports = [];
  const internalFunctions = [];
  const htmlElements = new Set();
  const cssClasses = new Set();
  const jsxRefs = new Set();
  try {
    const plugins = [];
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      plugins.push('typescript');
    }
    if (filePath.endsWith('.jsx')) {
      plugins.push('jsx');
    }
    const ast = parse(content, {
      sourceType: 'module',
      plugins,
      errorRecovery: true,
    });
    for (const node of ast.program.body) {
      if (node.type === 'ExportDefaultDeclaration') {
        const decl = node.declaration;
        if (decl?.type === 'Identifier') {
          exports.push(decl.name);
        } else if (decl?.type === 'FunctionDeclaration') {
          exports.push(decl.id?.name || 'default');
          extractInternalFunctions(decl, internalFunctions, filePath);
        } else if (decl?.type === 'ArrowFunctionExpression' || decl?.type === 'FunctionExpression') {
          exports.push('default');
        } else if (decl?.type === 'ClassDeclaration') {
          exports.push(decl.id?.name || 'default');
        } else {
          exports.push('default');
        }
      } else if (node.type === 'ExportNamedDeclaration') {
        if (node.declaration?.type === 'FunctionDeclaration') {
          exports.push(node.declaration.id?.name);
          extractInternalFunctions(node.declaration, internalFunctions, filePath);
        } else if (node.declaration?.type === 'ClassDeclaration') {
          exports.push(node.declaration.id?.name);
        } else if (node.declaration?.type === 'VariableDeclaration') {
          for (const decl of node.declaration.declarations) {
            if (decl.id?.type === 'Identifier') exports.push(decl.id.name);
          }
        } else if (node.specifiers) {
          for (const spec of node.specifiers) {
            exports.push(spec.exported?.name || spec.local?.name);
          }
        }
      }
    }
    let body = ast.program.body;
    if (body.length === 1 && body[0].type === 'ExportDefaultDeclaration' && body[0].declaration?.body?.body) {
      body = body[0].declaration.body.body;
    }
    for (const node of body) {
      if (node.type === 'FunctionDeclaration' && node.id?.name) {
        const name = node.id.name;
        if (name.startsWith('handle') || name.startsWith('on') || name.startsWith('get') || name.startsWith('set')) {
          internalFunctions.push({ name, category: name.startsWith('handle') || name.startsWith('on') ? 'event handler' : name.startsWith('get') ? 'getter function' : 'setter function' });
        }
      }
      if (node.type === 'VariableDeclaration') {
        for (const decl of node.declarations) {
          if (decl.init?.type === 'ArrowFunctionExpression' || decl.init?.type === 'FunctionExpression') {
            const name = decl.id?.name;
            if (name && (name.startsWith('handle') || name.startsWith('on') || name.startsWith('render') || name.startsWith('get') || name.startsWith('set'))) {
              internalFunctions.push({ name, category: name.startsWith('handle') || name.startsWith('on') ? 'event handler' : name.startsWith('render') ? 'render helper' : name.startsWith('get') ? 'getter function' : 'setter function' });
            }
          }
        }
      }
    }
    traverseJsx(ast, htmlElements, cssClasses, jsxRefs);
  } catch {
    // Parse failure — return what we have
  }
  return {
    exports: exports.filter(Boolean),
    internalFunctions,
    htmlElements: [...htmlElements],
    cssClasses: [...cssClasses],
    jsxRefs: [...jsxRefs],
  };
}

function extractInternalFunctions(funcNode, internalFunctions, _filePath) {
  if (!funcNode?.body?.body) return;
  for (const stmt of funcNode.body.body) {
    if (stmt.type === 'VariableDeclaration') {
      for (const decl of stmt.declarations) {
        if (decl.init?.type === 'ArrowFunctionExpression' || decl.init?.type === 'FunctionExpression') {
          const name = decl.id?.name;
          if (name && (name.startsWith('handle') || name.startsWith('on') || name.startsWith('render') || name.startsWith('get') || name.startsWith('set'))) {
            internalFunctions.push({
              name,
              category: name.startsWith('handle') || name.startsWith('on') ? 'event handler' : name.startsWith('render') ? 'render helper' : name.startsWith('get') ? 'getter function' : 'setter function',
            });
          }
        }
      }
    }
  }
}

function traverseJsx(node, htmlElements, cssClasses, jsxRefs) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'JSXElement' && node.openingElement?.name) {
    const name = node.openingElement.name.name || node.openingElement.name.property?.name;
    if (name) {
      if (/^[a-z]/.test(name)) {
        htmlElements.add(name);
      } else {
        jsxRefs.add(name);
      }
    }
    for (const attr of node.openingElement.attributes || []) {
      if (attr.name?.name === 'className' && attr.value?.type === 'StringLiteral') {
        const classes = attr.value.value.split(/\s+/).filter(Boolean);
        classes.forEach((c) => cssClasses.add(c));
      }
    }
  }
  for (const key of Object.keys(node)) {
    if (key === 'type' || key === 'loc' || key === 'start' || key === 'end') continue;
    const child = node[key];
    if (Array.isArray(child)) {
      child.forEach((c) => traverseJsx(c, htmlElements, cssClasses, jsxRefs));
    } else if (child && typeof child === 'object' && child.type) {
      traverseJsx(child, htmlElements, cssClasses, jsxRefs);
    }
  }
}

function sanitizeNodeId(name) {
  return name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^(\d)/, '_$1');
}

export async function enrichPlanMerfolk(merfolkContent, repoContext) {
  if (!merfolkContent || !repoContext) return merfolkContent;
  const { owner, repo, token, fileTree, fileContents } = repoContext;
  if (!owner || !repo || !token) return merfolkContent;

  const nodes = parseNodes(merfolkContent);
  const existingNodeIds = new Set(nodes.map((n) => n.nodeId));
  const existingLines = new Set();

  const enrichedLines = merfolkContent.split('\n');
  const newSections = [];

  for (const node of nodes) {
    if (node.type === 'Library' || node.type === 'Unknown') continue;
    if (node.properties.codeFilePath) continue;

    const filePath = node.properties.codeFilePath || findFileForNode(node.nodeId, node.name, fileTree);
    if (!filePath) continue;

    let content = fileContents?.[filePath];
    if (!content) {
      try {
        content = await fetchFileContent(owner, repo, filePath, token);
      } catch {
        continue;
      }
    }
    if (!content) continue;

    const fileSize = content.length;
    const analysis = analyzeFileExports(content, filePath);

    const propsToAdd = [`codeFilePath: "${filePath}"`, `fileSize: "${fileSize}"`];
    if (analysis.exports.length > 0) {
      propsToAdd.push(`exports: "${analysis.exports.join(',')}"`);
    }
    if (analysis.htmlElements.length > 0) {
      propsToAdd.push(`htmlElements: "${analysis.htmlElements.join(',')}"`);
    }
    if (analysis.cssClasses.length > 0) {
      propsToAdd.push(`cssClasses: "${analysis.cssClasses.slice(0, 10).join(',')}"`);
    }
    if (analysis.jsxRefs.length > 0) {
      propsToAdd.push(`jsxRefs: "${analysis.jsxRefs.join(',')}"`);
    }

    const oldLine = enrichedLines[node.lineIndex];
    const propsStr = `{${propsToAdd.join(', ')}}`;
    const newLine = oldLine.includes('{') && oldLine.includes('}')
      ? oldLine.replace(/\}\s*(\{[^}]*\})?\s*$/, `} ${propsStr}`)
      : `${oldLine} ${propsStr}`;
    enrichedLines[node.lineIndex] = newLine;
    existingLines.add(node.lineIndex);

    const fileId = `${sanitizeNodeId(node.name)}_file`;
    if (!existingNodeIds.has(fileId)) {
      const containerDecl = node.bracket === '{}' ? `{Function: ${node.name}}` : `[Function: ${node.name}]`;
      const containerProps = `{codeFilePath: "${filePath}", exports: "${analysis.exports.join(',')}", fileSize: "${fileSize}"}`;
      newSections.push(`${fileId}${containerDecl} ${containerProps}`);
      newSections.push(`${fileId} -.-> ${node.nodeId} : "contains"`);
      existingNodeIds.add(fileId);
    }

    for (const fn of analysis.internalFunctions) {
      const fnId = sanitizeNodeId(fn.name);
      if (!existingNodeIds.has(fnId)) {
        newSections.push(`${fnId}[Function: ${fn.name}] {codeFilePath: "${filePath}"}`);
        newSections.push(`${node.nodeId} -.-> ${fnId} : "${fn.category}"`);
        existingNodeIds.add(fnId);
      }
    }
  }

  if (newSections.length > 0) {
    const lastContentLine = enrichedLines.length - 1;
    let insertAt = lastContentLine;
    for (let i = lastContentLine; i >= 0; i--) {
      const trimmed = enrichedLines[i].trim();
      if (trimmed && !trimmed.startsWith('%%') && trimmed !== '```') {
        insertAt = i;
        break;
      }
    }
    enrichedLines.splice(insertAt + 1, 0, '', '%% ── Enriched File Containers ─────────────────────', ...newSections);
  }

  return enrichedLines.join('\n');
}
