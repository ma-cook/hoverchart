const DEFAULT_TASK_PROFILES = {
  'code-gen': {
    description: 'Generate or modify production code',
    requiredCapabilities: ['tools', 'long-context'],
    preferredProvider: null,
    minContextWindow: 32000,
    maxCostPerCall: 1.0,
  },
  'plan': {
    description: 'Architecture planning and discussion',
    requiredCapabilities: ['reasoning'],
    preferredProvider: null,
    minContextWindow: 16000,
    maxCostPerCall: 0.5,
  },
  'research': {
    description: 'Sub-agent codebase research',
    requiredCapabilities: ['tools'],
    preferredProvider: null,
    minContextWindow: 8000,
    maxCostPerCall: 0.2,
  },
  'search': {
    description: 'Quick code search and navigation',
    requiredCapabilities: [],
    preferredProvider: null,
    minContextWindow: 4000,
    maxCostPerCall: 0.05,
  },
  'summary': {
    description: 'Summarize conversation or context',
    requiredCapabilities: [],
    preferredProvider: null,
    minContextWindow: 16000,
    maxCostPerCall: 0.1,
  },
};

const PROVIDER_CAPABILITIES = {
  anthropic: ['tools', 'long-context', 'reasoning'],
  google: ['long-context'],
  'opencode-zen': ['tools', 'reasoning'],
  'opencode-go': ['tools'],
  nvidia: ['tools', 'reasoning'],
};

export class ModelRouter {
  constructor({ profiles, onRoute } = {}) {
    this._profiles = { ...DEFAULT_TASK_PROFILES, ...profiles };
    this._usage = new Map();
    this._lastRoute = null;
    this._onRoute = onRoute;
  }

  registerProfile(name, config) {
    this._profiles[name] = { ...DEFAULT_TASK_PROFILES[name], ...config };
  }

  async route(taskType, { providerId, model, messages, availableProviders } = {}) {
    const profile = this._profiles[taskType];
    if (!profile) {
      return this._directRoute(providerId, model);
    }

    if (profile.preferredProvider && profile.preferredProvider !== providerId) {
      const prefProvider = availableProviders?.find(p => p.id === profile.preferredProvider);
      if (prefProvider) {
        this._recordRoute(taskType, prefProvider.id, model);
        return { providerId: prefProvider.id, model };
      }
    }

    const caps = PROVIDER_CAPABILITIES[providerId] || [];
    const missingCaps = profile.requiredCapabilities.filter(c => !caps.includes(c));

    if (missingCaps.length > 0 && availableProviders?.length > 0) {
      const fallback = this._findBestFallback(profile, availableProviders);
      if (fallback) {
        this._recordRoute(taskType, fallback.id, fallback.model);
        return fallback;
      }
    }

    this._recordRoute(taskType, providerId, model);
    return { providerId, model };
  }

  _findBestFallback(profile, availableProviders) {
    const scored = availableProviders
      .map(p => {
        const caps = PROVIDER_CAPABILITIES[p.id] || [];
        const capScore = profile.requiredCapabilities.filter(c => caps.includes(c)).length;
        const hasWindow = profile.minContextWindow || 0;
        return { provider: p, capScore, hasWindow: true };
      })
      .filter(s => s.capScore >= profile.requiredCapabilities.length)
      .sort((a, b) => b.capScore - a.capScore);

    return scored.length > 0 ? { providerId: scored[0].provider.id, model: scored[0].provider.selectedModel } : null;
  }

  _directRoute(providerId, model) {
    if (!providerId || !model) return { providerId, model };
    this._lastRoute = { providerId, model };
    return { providerId, model };
  }

  _recordRoute(taskType, providerId, model) {
    const key = `${providerId}:${model}`;
    this._usage.set(key, (this._usage.get(key) || 0) + 1);
    this._lastRoute = { taskType, providerId, model, timestamp: Date.now() };
    this._onRoute?.({ taskType, providerId, model });
  }

  getUsageReport() {
    const report = [];
    for (const [key, count] of this._usage) {
      const [providerId, ...modelParts] = key.split(':');
      report.push({ providerId, model: modelParts.join(':'), calls: count });
    }
    return report.sort((a, b) => b.calls - a.calls);
  }

  getLastRoute() {
    return this._lastRoute;
  }

  getProfile(taskType) {
    return this._profiles[taskType] || null;
  }

  supportsTaskType(taskType, providerId) {
    const profile = this._profiles[taskType];
    if (!profile) return true;
    if (profile.requiredCapabilities.length === 0) return true;
    const caps = PROVIDER_CAPABILITIES[providerId] || [];
    return profile.requiredCapabilities.every(c => caps.includes(c));
  }

  estimateTaskComplexity(messages) {
    const totalChars = messages.reduce((s, m) => s + (m.content || '').length, 0);
    const toolCount = messages.filter(m => m.tool_calls?.length > 0).length;
    const roundCount = messages.filter(m => m.role === 'assistant').length;

    if (totalChars > 50000 || toolCount > 10) return 'complex';
    if (totalChars > 10000 || toolCount > 3) return 'moderate';
    return 'simple';
  }

  classifyTaskType(messages, tools) {
    if (!messages || messages.length === 0) return 'search';

    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    const content = (lastUserMsg?.content || '').toLowerCase();

    if (content.includes('generate') || content.includes('create') || content.includes('implement') ||
        content.includes('write') || content.includes('add') || content.includes('modify') ||
        content.includes('refactor') || content.includes('fix') || content.includes('update') ||
        content.includes('change')) {
      if (tools && tools.length > 0) return 'code-gen';
      return 'plan';
    }

    if (content.startsWith('/explain') || content.startsWith('/review') ||
        content.includes('explain') || content.includes('how does') || content.includes('what is') ||
        content.includes('architecture') || content.includes('design')) {
      return 'plan';
    }

    if (content.startsWith('/search') || content.startsWith('/find') ||
        content.includes('search for') || content.includes('find') ||
        content.startsWith('/summarize') || content.includes('summarize')) {
      return 'search';
    }

    if (messages.length > 10 || content.length > 2000) return 'code-gen';
    return 'plan';
  }
}

export const globalRouter = new ModelRouter();
