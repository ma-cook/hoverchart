import { createWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';

function loadPersisted(key) {
  try {
    const raw = localStorage.getItem(`contentIdx:${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function persist(key, value) {
  try {
    localStorage.setItem(`contentIdx:${key}`, JSON.stringify(value));
  } catch {}
}

const useContentIndexStore = createWithEqualityFn((set) => ({
  manifest: loadPersisted('manifest') || [],
  lastPopulated: loadPersisted('lastPopulated') || null,
  totalChunks: loadPersisted('totalChunks') || 0,

  setManifest: (manifest) => {
    persist('manifest', manifest);
    set({ manifest });
  },

  setPopulated: (timestamp) => {
    persist('lastPopulated', timestamp);
    set({ lastPopulated: timestamp });
  },

  setTotalChunks: (total) => {
    persist('totalChunks', total);
    set({ totalChunks: total });
  },

  reset: () => {
    ['manifest', 'lastPopulated', 'totalChunks'].forEach(k => {
      try { localStorage.removeItem(`contentIdx:${k}`); } catch {}
    });
    set({ manifest: [], lastPopulated: null, totalChunks: 0 });
  },
}), shallow);

export default useContentIndexStore;
