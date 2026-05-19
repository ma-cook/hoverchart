import { parse } from '@babel/parser';
import fs from 'fs';
import path from 'path';

// ---- replicate containsJSX from githubRepoService.js ----

function containsJSX(node, fileContext) {
  if (!node) return false;
  if (node.type === 'JSXElement' || node.type === 'JSXFragment') return true;
  if (node.type === 'ReturnStatement') {
    return containsJSX(node.argument, fileContext);
  }
  if (node.type === 'BlockStatement') {
    return node.body.some((stmt) => containsJSX(stmt, fileContext));
  }
  if (node.type === 'IfStatement') {
    return (
      containsJSX(node.consequent, fileContext) ||
      containsJSX(node.alternate, fileContext)
    );
  }
  if (node.type === 'ConditionalExpression') {
    return (
      containsJSX(node.consequent, fileContext) ||
      containsJSX(node.alternate, fileContext)
    );
  }
  if (node.type === 'LogicalExpression') {
    return containsJSX(node.left, fileContext) || containsJSX(node.right, fileContext);
  }
  if (node.type === 'CallExpression') {
    if (
      node.callee?.type === 'MemberExpression' &&
      (node.callee.property?.name === 'map' ||
        node.callee.property?.name === 'filter' ||
        node.callee.property?.name === 'reduce')
    ) {
      const callback = node.arguments?.[0];
      if (callback) {
        return containsJSX(callback.body || callback, fileContext);
      }
    }
    if (
      node.callee?.type === 'MemberExpression' &&
      node.callee.object?.name === 'React' &&
      node.callee.property?.name === 'createElement'
    ) {
      return true;
    }
    if (node.callee?.name === 'createElement') return true;
    return false;
  }
  if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') {
    return containsJSX(node.body, fileContext);
  }
  if (
    (node.type === 'Identifier' || node.type === 'MemberExpression') &&
    fileContext?.isComponent
  ) {
    const name =
      node.type === 'Identifier' ? node.name : node.property?.name;
    if (name === 'children') return true;
  }
  if (node.type === 'NullLiteral' && fileContext?.isComponent) return true;
  return false;
}

// ---- test each landing file ----

const landingDir = 'src/landing';
const files = fs.readdirSync(landingDir).filter(f => f.endsWith('.jsx'));
const fileContext = { isComponent: true };

for (const file of files) {
  const content = fs.readFileSync(path.join(landingDir, file), 'utf8');
  let ast;
  try {
    ast = parse(content, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
      errorRecovery: true,
    });
  } catch (e) {
    console.log(`${file}: PARSE ERROR: ${e.message}`);
    continue;
  }

  const results = [];

  for (const node of ast.program.body) {
    // Handle ExportDefaultDeclaration wrapping a FunctionDeclaration
    let checkNode = node;
    if (node.type === 'ExportDefaultDeclaration' && node.declaration?.type === 'FunctionDeclaration') {
      checkNode = node.declaration;
    }
    // Handle ExportNamedDeclaration wrapping a FunctionDeclaration
    if (node.type === 'ExportNamedDeclaration' && node.declaration?.type === 'FunctionDeclaration') {
      checkNode = node.declaration;
    }

    if (checkNode.type === 'FunctionDeclaration' && checkNode.id) {
      const funcName = checkNode.id.name;
      const looksLikeComponent = /^[A-Z]/.test(funcName);
      if (looksLikeComponent) {
        const hasJSX = containsJSX(checkNode.body, fileContext);
        results.push(`  FunctionDeclaration ${funcName}: looksLikeComponent=${looksLikeComponent}, containsJSX=${hasJSX}`);
        if (!hasJSX) {
          // drill deeper - what types are in the body?
          const returnStmts = checkNode.body.body.filter(s => s.type === 'ReturnStatement');
          results.push(`    -> return stmt count: ${returnStmts.length}`);
          returnStmts.forEach((r, i) => {
            results.push(`    -> return[${i}] argument type: ${r.argument?.type}`);
          });
        }
      }
    }

    if (node.type === 'VariableDeclaration') {
      for (const decl of node.declarations) {
        const varName = decl.id?.name;
        if (!varName) continue;
        const looksLikeComponent = /^[A-Z]/.test(varName);
        if (!looksLikeComponent) continue;
        let init = decl.init;
        // memo wrapping
        if (
          init?.type === 'CallExpression' &&
          (init.callee?.name === 'memo' || init.callee?.property?.name === 'memo') &&
          init.arguments?.[0]
        ) {
          init = init.arguments[0];
        }
        if (
          init?.type === 'ArrowFunctionExpression' ||
          init?.type === 'FunctionExpression'
        ) {
          const hasJSX = containsJSX(init.body, fileContext);
          results.push(`  VariableDecl ${varName}: containsJSX=${hasJSX}`);
        }
      }
    }
  }

  if (results.length === 0) {
    console.log(`${file}: no uppercase function/component declarations found at top level`);
  } else {
    console.log(`${file}:`);
    results.forEach(r => console.log(r));
  }
}
