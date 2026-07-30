import { AgentListener } from './agentListener';

class InvocationNode {
  constructor({ agentName, inputs, parent, iteration }) {
    this.agentName = agentName;
    this.inputs = inputs;
    this.parent = parent;
    this.children = [];
    this.toolCalls = [];
    this.output = null;
    this.tokens = 0;
    this.startTime = performance.now();
    this.finishTime = null;
    this.duration = null;
    this.error = null;
    this.iteration = iteration ?? null;
  }

  complete({ output, tokens, error } = {}) {
    this.finishTime = performance.now();
    this.duration = Math.round(this.finishTime - this.startTime);
    this.output = output ?? this.output;
    this.tokens = tokens ?? this.tokens;
    this.error = error ?? this.error;
  }

  toJSON() {
    return {
      agentName: this.agentName,
      iteration: this.iteration,
      duration: this.duration,
      tokens: this.tokens,
      inputsSize: this.inputs ? JSON.stringify(this.inputs).length : 0,
      outputSize: this.output ? this.output.length : 0,
      error: this.error?.message ?? null,
      childCount: this.children.length,
      toolCallCount: this.toolCalls.length,
    };
  }
}

export class AgentMonitor {
  constructor() {
    this.rootExecutions = [];
    this.listeners = [];
    this._nodeStack = [];
    this._enabled = true;
  }

  setEnabled(enabled) {
    this._enabled = enabled;
  }

  addListener(listener) {
    if (listener instanceof AgentListener) {
      this.listeners.push(listener);
    } else {
      this.listeners.push(listener);
    }
  }

  removeListener(listener) {
    const idx = this.listeners.indexOf(listener);
    if (idx >= 0) this.listeners.splice(idx, 1);
  }

  _notifyListeners(method, ...args) {
    if (!this._enabled) return;
    for (const listener of this.listeners) {
      try {
        listener[method]?.(...args);
      } catch (e) {
        console.warn('[AgentMonitor] Listener error:', e);
      }
    }
  }

  startInvocation({ agentName, inputs, iteration }) {
    if (!this._enabled) return null;
    const parent = this._nodeStack.length > 0 ? this._nodeStack[this._nodeStack.length - 1] : null;
    const node = new InvocationNode({ agentName, inputs, parent, iteration });
    if (parent) {
      parent.children.push(node);
    } else {
      this.rootExecutions.push(node);
    }
    this._nodeStack.push(node);

    this._notifyListeners('beforeAgentInvocation', { agentName, inputs, iteration });
    return node;
  }

  endInvocation({ output, tokens, error } = {}) {
    if (!this._enabled || this._nodeStack.length === 0) return;
    const node = this._nodeStack.pop();
    node.complete({ output, tokens, error });

    this._notifyListeners('afterAgentInvocation', {
      agentName: node.agentName,
      output,
      tokens,
      duration: node.duration,
      error,
    });
    return node;
  }

  recordTool({ toolName, args, result, duration, error }) {
    if (!this._enabled) return;
    const activeNode = this._nodeStack.length > 0 ? this._nodeStack[this._nodeStack.length - 1] : null;
    const entry = { toolName, args, resultSize: (result || '').length, duration, error: error?.message ?? null };
    if (activeNode) {
      activeNode.toolCalls.push(entry);
    }

    this._notifyListeners('afterToolExecution', entry);
  }

  get currentDepth() {
    return this._nodeStack.length;
  }

  clear() {
    this.rootExecutions = [];
    this._nodeStack = [];
  }

  toJSON() {
    const serialize = (nodes) => nodes.map(n => ({
      agentName: n.agentName,
      iteration: n.iteration,
      duration: n.duration,
      tokens: n.tokens,
      inputsSize: n.inputs ? JSON.stringify(n.inputs).length : 0,
      outputSize: n.output ? n.output.length : 0,
      error: n.error?.message ?? null,
      toolCalls: n.toolCalls,
      children: serialize(n.children),
    }));
    return {
      summary: this.getSummary(),
      executions: serialize(this.rootExecutions),
    };
  }

  getSummary() {
    let totalTokens = 0;
    let totalDuration = 0;
    let totalTools = 0;
    let errorCount = 0;
    const count = (nodes) => {
      for (const n of nodes) {
        totalTokens += n.tokens;
        totalDuration += n.duration ?? 0;
        totalTools += n.toolCalls.length;
        if (n.error) errorCount++;
        count(n.children);
      }
    };
    count(this.rootExecutions);
    return {
      totalInvocations: this.rootExecutions.length,
      totalTokens,
      totalDuration,
      totalTools,
      errorCount,
    };
  }

  generateHtmlReport() {
    const serializeToHtml = (nodes, depth = 0) => {
      let html = '';
      for (const node of nodes) {
        const hasChildren = node.children.length > 0;
        const hasTools = node.toolCalls.length > 0;
        const hasError = !!node.error;
        const label = `${node.agentName}${node.iteration != null ? ` (iter ${node.iteration})` : ''}`;
        const meta = `${node.duration}ms${node.tokens ? `, ${node.tokens}tok` : ''}`;

        html += `<li class="${hasError ? 'error' : ''}">`;
        html += `<div class="node-header ${hasChildren || hasTools ? 'collapsible' : ''}" onclick="this.parentElement.classList.toggle('open')">`;
        html += `<span class="label">${label}</span>`;
        html += `<span class="meta">${meta}</span>`;
        if (hasError) html += `<span class="error-badge">ERROR</span>`;
        html += `</div>`;

        if (hasChildren || hasTools) {
          html += '<div class="node-body">';
          if (hasTools) {
            html += '<div class="tools">';
            for (const tc of node.toolCalls) {
              html += `<div class="tool-call ${tc.error ? 'error' : ''}">`;
              html += `<span>${tc.toolName}</span>`;
              html += `<span class="meta">${tc.duration}ms, ${tc.resultSize}B</span>`;
              if (tc.error) html += `<span class="error-badge">${tc.error}</span>`;
              html += '</div>';
            }
            html += '</div>';
          }
          if (hasChildren) {
            html += `<ul>${serializeToHtml(node.children, depth + 1)}</ul>`;
          }
          html += '</div>';
        }
        html += '</li>';
      }
      return html;
    };

    const summary = this.getSummary();
    const treeHtml = serializeToHtml(this.rootExecutions);

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Agent Execution Report</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d1117; color: #c9d1d9; padding: 24px; }
  h1 { color: #58a6ff; font-size: 1.5rem; margin-bottom: 16px; }
  .summary { display: flex; gap: 24px; margin-bottom: 24px; flex-wrap: wrap; }
  .stat { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 16px; min-width: 140px; }
  .stat .value { font-size: 1.8rem; font-weight: 600; color: #f0f6fc; }
  .stat .label { font-size: 0.8rem; color: #8b949e; text-transform: uppercase; letter-spacing: 0.5px; }
  ul { list-style: none; padding-left: 0; }
  ul ul { padding-left: 20px; border-left: 1px solid #30363d; margin-left: 8px; }
  li { margin: 4px 0; }
  .node-header { display: flex; align-items: center; gap: 12px; padding: 8px 12px; background: #161b22; border: 1px solid #30363d; border-radius: 6px; cursor: default; font-size: 0.9rem; }
  .node-header.collapsible { cursor: pointer; }
  .node-header.collapsible::before { content: '\\25B6'; color: #8b949e; font-size: 0.7rem; transition: transform 0.15s; }
  li.open > .node-header.collapsible::before { transform: rotate(90deg); }
  .node-header:hover { border-color: #58a6ff; }
  .label { flex: 1; }
  .meta { color: #8b949e; font-size: 0.8rem; }
  .error-badge { background: #da3633; color: #fff; font-size: 0.7rem; padding: 2px 6px; border-radius: 3px; font-weight: 600; }
  .node-body { display: none; padding: 8px 0 8px 20px; }
  li.open > .node-body { display: block; }
  .tools { margin-bottom: 8px; }
  .tool-call { display: flex; align-items: center; gap: 12px; padding: 4px 12px; font-size: 0.85rem; font-family: monospace; color: #8b949e; }
  .tool-call.error { color: #f85149; }
  li.error > .node-header { border-color: #da3633; background: #1c1014; }
</style>
</head>
<body>
  <h1>Agent Execution Report</h1>
  <div class="summary">
    <div class="stat"><div class="value">${summary.totalInvocations}</div><div class="label">Invocations</div></div>
    <div class="stat"><div class="value">${summary.totalDuration}ms</div><div class="label">Total Time</div></div>
    <div class="stat"><div class="value">${summary.totalTokens}</div><div class="label">Total Tokens</div></div>
    <div class="stat"><div class="value">${summary.totalTools}</div><div class="label">Tool Calls</div></div>
    ${summary.errorCount > 0 ? `<div class="stat" style="border-color:#da3633"><div class="value" style="color:#f85149">${summary.errorCount}</div><div class="label">Errors</div></div>` : ''}
  </div>
  <ul>${treeHtml}</ul>
</body>
</html>`;
  }
}

export const globalMonitor = new AgentMonitor();
