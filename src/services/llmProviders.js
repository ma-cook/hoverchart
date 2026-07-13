const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const PROVIDERS = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    chatEndpoint: 'https://api.anthropic.com/v1/messages',
    modelsEndpoint: 'https://api.anthropic.com/v1/models',
    getHeaders: (apiKey) => ({
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    }),
    formatBody: (messages, model) => {
      const system = messages.find((m) => m.role === 'system')?.content;
      const msgs = messages.filter((m) => m.role !== 'system');
      return {
        model,
        system,
        messages: msgs.map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
        max_tokens: 16384,
        stream: true,
      };
    },
    parseModels: (data) =>
      (data.data || [])
        .filter((m) => m.id.startsWith('claude-'))
        .map((m) => ({ id: m.id, name: m.id }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    parseStreamLine: (line) => {
      if (!line.startsWith('data: ')) return null;
      const data = line.slice(6);
      if (data === '[DONE]') return { done: true };
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          return parsed.delta.text;
        }
        if (parsed.type === 'message_stop') return { done: true };
        return null;
      } catch {
        return null;
      }
    },
  },
  {
    id: 'google',
    name: 'Google Gemini',
    chatEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    modelsEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    getHeaders: (_apiKey) => ({
      'Content-Type': 'application/json',
    }),
    formatBody: (messages, model) => {
      const msgs = messages.filter((m) => m.role !== 'system');
      const system = messages.find((m) => m.role === 'system')?.content;
      return {
        system_instruction: system ? { parts: [{ text: system }] } : undefined,
        contents: msgs.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
      };
    },
    formatEndpoint: (apiKey, model) =>
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
    parseModels: (data) =>
      (data.models || [])
        .filter((m) => m.name.startsWith('models/gemini-'))
        .map((m) => ({ id: m.name.replace('models/', ''), name: m.name.replace('models/', '') }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    parseStreamLine: (line) => {
      if (!line.startsWith('data: ')) return null;
      const data = line.slice(6);
      if (!data || data === '[DONE]') return { done: true };
      try {
        const parsed = JSON.parse(data);
        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text != null) return text;
        return null;
      } catch {
        return null;
      }
    },
  },
  {
    id: 'opencode-zen',
    name: 'Opencode Zen',
    chatEndpoint: 'https://opencode.ai/zen/v1/chat/completions',
    modelsEndpoint: 'https://opencode.ai/zen/v1/models',
    getHeaders: (apiKey) => ({
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
    formatBody: (messages, model) => ({
      model,
      messages,
      stream: true,
      max_tokens: 16384,
    }),
    parseModels: (data) =>
      (data.data || [])
        .map((m) => ({ id: m.id, name: m.id }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    parseStreamLine: (line) => {
      if (!line.startsWith('data: ')) return null;
      const data = line.slice(6);
      if (data === '[DONE]') return { done: true };
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta != null) return delta;
        if (parsed.choices?.[0]?.finish_reason) return { done: true };
        return null;
      } catch {
        return null;
      }
    },
  },
  {
    id: 'opencode-go',
    name: 'Opencode Go',
    chatEndpoint: 'https://opencode.ai/zen/go/v1/chat/completions',
    modelsEndpoint: 'https://opencode.ai/zen/go/v1/models',
    getHeaders: (apiKey) => ({
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
    formatBody: (messages, model) => ({
      model,
      messages,
      stream: true,
      max_tokens: 16384,
    }),
    parseModels: (data) =>
      (data.data || [])
        .map((m) => ({ id: m.id, name: m.id }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    parseStreamLine: (line) => {
      if (!line.startsWith('data: ')) return null;
      const data = line.slice(6);
      if (data === '[DONE]') return { done: true };
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta != null) return delta;
        if (parsed.choices?.[0]?.finish_reason) return { done: true };
        return null;
      } catch {
        return null;
      }
    },
  },
  {
    id: 'nvidia',
    name: 'Nvidia',
    chatEndpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
    modelsEndpoint: 'https://integrate.api.nvidia.com/v1/models',
    getHeaders: (apiKey) => ({
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
    formatBody: (messages, model) => ({
      model,
      messages,
      stream: true,
      max_tokens: 16384,
    }),
    parseModels: (data) =>
      (data.data || [])
        .map((m) => ({ id: m.id, name: m.id }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    parseStreamLine: (line) => {
      if (!line.startsWith('data: ')) return null;
      const data = line.slice(6);
      if (data === '[DONE]') return { done: true };
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta != null) return delta;
        if (parsed.choices?.[0]?.finish_reason) return { done: true };
        return null;
      } catch {
        return null;
      }
    },
  },
];

export function getProvider(id) {
  return PROVIDERS.find((p) => p.id === id);
}

export async function fetchModels(providerId, apiKey) {
  const provider = getProvider(providerId);
  if (!provider) throw new Error(`Unknown provider: ${providerId}`);

  const headers = provider.getHeaders(apiKey);
  const url = provider.modelsEndpoint;
  if (!url) return [];

  try {
    const res = await fetch(`${API_BASE}/api/llm/models`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, headers }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return provider.parseModels(data);
  } catch {
    return [];
  }
}

export async function sendToProvider({
  providerId,
  apiKey,
  model,
  messages,
  onChunk,
  signal,
}) {
  const provider = getProvider(providerId);
  if (!provider) throw new Error(`Unknown provider: ${providerId}`);

  const body = provider.formatBody(messages, model);
  const url = provider.formatEndpoint
    ? provider.formatEndpoint(apiKey, model)
    : provider.chatEndpoint;
  const headers = provider.getHeaders(apiKey);

  const res = await fetch(`${API_BASE}/api/llm/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, headers, body }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${provider.name} error ${res.status}: ${text}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const result = provider.parseStreamLine(trimmed);
      if (result === null) continue;
      if (result.done) break;
      if (typeof result === 'string') {
        fullText += result;
        onChunk?.(result, fullText);
      }
    }
  }
  return fullText;
}
