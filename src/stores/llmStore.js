import { createWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';
import {
  readStoredSecret,
  persistStoredSecret,
  migrateLegacySecrets,
} from '../utils/encryptedStorage';

function loadPersisted(key) {
  try {
    const raw = localStorage.getItem(`llm:${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persist(key, value) {
  try {
    localStorage.setItem(`llm:${key}`, JSON.stringify(value));
  } catch { /* ignore */ }
}

const useLlmStore = createWithEqualityFn((set, get) => ({
  providerId: loadPersisted('providerId') || null,
  apiKey: null,
  models: loadPersisted('models') || [],
  selectedModel: loadPersisted('selectedModel') || null,

  setProviderId: (id) => {
    persist('providerId', id);
    set({ providerId: id, models: [], selectedModel: null });
    persist('models', []);
    persist('selectedModel', null);
  },

  setApiKey: (key) => {
    persistStoredSecret('llm:apiKey', key);
    set({ apiKey: key });
  },

  setModels: (models) => {
    persist('models', models);
    set({ models });
  },

  setSelectedModel: (model) => {
    persist('selectedModel', model);
    set({ selectedModel: model });
  },

  reset: () => {
    ['providerId', 'apiKey', 'models', 'selectedModel'].forEach((k) => {
      try { localStorage.removeItem(`llm:${k}`); } catch { /* ignore */ }
    });
    set({ providerId: null, apiKey: null, models: [], selectedModel: null });
  },

  get isConfigured() {
    const s = get();
    return !!(s.providerId && s.apiKey && s.selectedModel);
  },
}), shallow);

migrateLegacySecrets();
readStoredSecret('llm:apiKey')
  .then((key) => {
    if (typeof key === 'string' && key.length > 0 && useLlmStore.getState().apiKey == null) {
      useLlmStore.setState({ apiKey: key });
    }
  })
  .catch(() => { /* ignore */ });

export default useLlmStore;
