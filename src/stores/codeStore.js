import { createWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';
import { safeSetItem, safeRemoveItem } from '../utils/safeLocalStorage';

const SPACE_SCOPED_KEYS = ['selectedRepo', 'selectedBranch', 'branchStrategy', 'techStack', 'techStackSource', 'contentIndex', 'importGraph', 'repoFileTree', 'fileSizes', 'fileIndexByPath', 'importIndexByFile'];

function loadPersisted(spaceId, key) {
  try {
    const ns = spaceId ? `${spaceId}:` : '';
    const raw = localStorage.getItem(`code:${ns}${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function persist(spaceId, key, value) {
  const ns = spaceId ? `${spaceId}:` : '';
  const storageKey = `code:${ns}${key}`;
  if (value === null || value === undefined) {
    safeRemoveItem(storageKey);
  } else {
    safeSetItem(storageKey, JSON.stringify(value));
  }
}

// fileIndexByPath values are objects holding Set fields (exports, functions,
// cssClasses, htmlElements) — JSON cannot persist Sets, so flatten on save and
// rebuild on load.
function serializeFileIndexByPath(map) {
  if (!(map instanceof Map)) return map;
  return [...map.entries()].map(([filePath, entry]) => [
    filePath,
    {
      ...entry,
      exports: entry.exports instanceof Set ? [...entry.exports] : entry.exports,
      functions: entry.functions instanceof Set ? [...entry.functions] : entry.functions,
      cssClasses: entry.cssClasses instanceof Set ? [...entry.cssClasses] : entry.cssClasses,
      htmlElements: entry.htmlElements instanceof Set ? [...entry.htmlElements] : entry.htmlElements,
    },
  ]);
}

function restoreFileIndexByPath(value) {
  if (!value) return null;
  if (value instanceof Map) return value;
  if (!Array.isArray(value)) return null;
  return new Map(value.map(([filePath, entry]) => [
    filePath,
    {
      ...entry,
      exports: Array.isArray(entry.exports) ? new Set(entry.exports) : entry.exports,
      functions: Array.isArray(entry.functions) ? new Set(entry.functions) : entry.functions,
      cssClasses: Array.isArray(entry.cssClasses) ? new Set(entry.cssClasses) : entry.cssClasses,
      htmlElements: Array.isArray(entry.htmlElements) ? new Set(entry.htmlElements) : entry.htmlElements,
    },
  ]));
}

function serializeImportIndexByFile(map) {
  if (!(map instanceof Map)) return map;
  return [...map.entries()].map(([file, set]) => [file, set instanceof Set ? [...set] : set]);
}

function restoreImportIndexByFile(value) {
  if (!value) return null;
  if (value instanceof Map) return value;
  if (!Array.isArray(value)) return null;
  return new Map(value.map(([file, arr]) => [file, Array.isArray(arr) ? new Set(arr) : arr]));
}

const useCodeStore = createWithEqualityFn((set, get) => ({
  _spaceId: null,
  githubConnected: false,
  githubToken: null,
  repoOwner: null,
  repoName: null,
  selectedRepo: null,
  selectedBranch: null,
  availableBranches: [],
  branchStrategy: null,
  techStack: '',
  techStackSource: null,
  pushStatus: 'idle',
  expandedView: false,
  activeCodeObjectId: null,
  repoFileTree: null,
  repoFileContents: null,
  contentIndex: null,
  importGraph: null,
  fileSizes: null,
  fileIndexByPath: null,
  importIndexByFile: null,
  pendingChanges: [],

  setSpaceId: (spaceId) => {
    const prev = get()._spaceId;
    if (prev === spaceId) return;
    set({
      _spaceId: spaceId,
      selectedRepo: loadPersisted(spaceId, 'selectedRepo'),
      selectedBranch: loadPersisted(spaceId, 'selectedBranch'),
      branchStrategy: loadPersisted(spaceId, 'branchStrategy'),
      techStack: loadPersisted(spaceId, 'techStack') || '',
      techStackSource: loadPersisted(spaceId, 'techStackSource'),
      contentIndex: null,
      importGraph: null,
      repoFileTree: null,
      repoFileContents: null,
      fileSizes: null,
      fileIndexByPath: null,
      importIndexByFile: null,
    });
    // repoFileContents is too large for localStorage, so it lives in IndexedDB.
    // Restore it asynchronously; the gate falls back to a GitHub refetch until
    // it arrives (or if nothing was ever saved for this space).
    import('../services/context/contentStorePersistence.js')
      .then((m) => m.loadRepoFileContents(spaceId))
      .then((contents) => {
        if (contents && get()._spaceId === spaceId) {
          set({ repoFileContents: contents });
          console.log(`[codeStore] Restored repoFileContents (${Object.keys(contents).length} files) from IndexedDB`);
        }
      })
      .catch(() => {});
    // fileIndexByPath, repoFileTree, contentIndex, importGraph, fileSizes and
    // importIndexByFile are all too large for localStorage. Restore them from
    // IndexedDB; if nothing was ever migrated, fall back to the legacy
    // localStorage keys and migrate them across so future loads read from
    // IndexedDB (this also frees the biggest legacy localStorage users).
    import('../services/context/contentStorePersistence.js')
      .then(async (m) => {
        const [
          tree,
          fileIndex,
          contentIndex,
          importGraph,
          fileSizes,
          importIndex,
        ] = await Promise.all([
          m.loadRepoFileTree(spaceId),
          m.loadSpaceFileIndex(spaceId),
          m.loadSpaceContentIndex(spaceId),
          m.loadSpaceImportGraph(spaceId),
          m.loadSpaceFileSizes(spaceId),
          m.loadSpaceImportIndex(spaceId),
        ]);
        if (get()._spaceId !== spaceId) return;
        const ns = spaceId ? `${spaceId}:` : '';
        const patch = {};
        if (tree) {
          patch.repoFileTree = tree;
        } else {
          const legacyTree = loadPersisted(spaceId, 'repoFileTree');
          if (legacyTree) {
            patch.repoFileTree = legacyTree;
            m.saveRepoFileTree(spaceId, legacyTree).catch(() => {});
            safeRemoveItem(`code:${ns}repoFileTree`);
          }
        }
        if (fileIndex) {
          patch.fileIndexByPath = restoreFileIndexByPath(fileIndex);
        } else {
          const legacyIndex = loadPersisted(spaceId, 'fileIndexByPath');
          if (legacyIndex) {
            patch.fileIndexByPath = restoreFileIndexByPath(legacyIndex);
            m.saveSpaceFileIndex(spaceId, legacyIndex).catch(() => {});
            safeRemoveItem(`code:${ns}fileIndexByPath`);
          }
        }
        if (contentIndex) {
          patch.contentIndex = contentIndex;
        } else {
          const legacy = loadPersisted(spaceId, 'contentIndex');
          if (legacy) {
            patch.contentIndex = legacy;
            m.saveSpaceContentIndex(spaceId, legacy).catch(() => {});
            safeRemoveItem(`code:${ns}contentIndex`);
          }
        }
        if (importGraph) {
          patch.importGraph = importGraph;
        } else {
          const legacy = loadPersisted(spaceId, 'importGraph');
          if (legacy) {
            patch.importGraph = legacy;
            m.saveSpaceImportGraph(spaceId, legacy).catch(() => {});
            safeRemoveItem(`code:${ns}importGraph`);
          }
        }
        if (fileSizes) {
          patch.fileSizes = fileSizes;
        } else {
          const legacy = loadPersisted(spaceId, 'fileSizes');
          if (legacy) {
            patch.fileSizes = legacy;
            m.saveSpaceFileSizes(spaceId, legacy).catch(() => {});
            safeRemoveItem(`code:${ns}fileSizes`);
          }
        }
        if (importIndex) {
          patch.importIndexByFile = restoreImportIndexByFile(importIndex);
        } else {
          const legacy = loadPersisted(spaceId, 'importIndexByFile');
          if (legacy) {
            patch.importIndexByFile = restoreImportIndexByFile(legacy);
            m.saveSpaceImportIndex(spaceId, legacy).catch(() => {});
            safeRemoveItem(`code:${ns}importIndexByFile`);
          }
        }
        if (Object.keys(patch).length > 0) set(patch);
      })
      .catch(() => {});
  },

  setGithubConnected: (connected) => set({ githubConnected: connected }),
  setGithubToken: (token) => set({ githubToken: token }),
  setRepoOwner: (owner) => set({ repoOwner: owner }),
  setRepoName: (name) => set({ repoName: name }),

  setSelectedRepo: (repo) => {
    const spaceId = get()._spaceId;
    persist(spaceId, 'selectedRepo', repo);
    persist(spaceId, 'selectedBranch', repo?.default_branch || 'main');
    set({
      selectedRepo: repo,
      selectedBranch: repo?.default_branch || 'main',
      branchStrategy: null,
    });
  },

  setSelectedBranch: (branch) => {
    const spaceId = get()._spaceId;
    persist(spaceId, 'selectedBranch', branch);
    set({
      selectedBranch: branch,
      branchStrategy: branch === 'main' || branch === 'master' ? 'main' : 'existing',
    });
  },

  setAvailableBranches: (branches) => set({ availableBranches: branches }),

  setBranchStrategy: (strategy) => {
    const spaceId = get()._spaceId;
    persist(spaceId, 'branchStrategy', strategy);
    set({ branchStrategy: strategy });
  },

  setTechStack: (stack, source) => {
    const spaceId = get()._spaceId;
    persist(spaceId, 'techStack', stack);
    persist(spaceId, 'techStackSource', source || 'user');
    set({
      techStack: stack,
      techStackSource: source || 'user',
    });
  },

  setPushStatus: (status) => set({ pushStatus: status }),

  setRepoContext: (fileTree, fileContents) => {
    const spaceId = get()._spaceId;
    set({ repoFileTree: fileTree, repoFileContents: fileContents });
    // Persist the tree and contents to IndexedDB (both too large for
    // localStorage) so the next page load can reuse the cached context
    // instead of refetching every file from GitHub. Fire-and-forget.
    import('../services/context/contentStorePersistence.js')
      .then((m) => {
        const writes = [];
        if (fileTree) writes.push(m.saveRepoFileTree(spaceId, fileTree));
        if (fileContents && Object.keys(fileContents).length > 0) {
          writes.push(m.saveRepoFileContents(spaceId, fileContents));
        }
        return Promise.all(writes);
      })
      .catch(() => {});
  },

  setRepoFileContents: (fileContents) => set({ repoFileContents: fileContents }),

  setContentIndex: (contentIndex) => {
    const spaceId = get()._spaceId;
    set({ contentIndex });
    if (contentIndex) {
      // Too large for localStorage — persist to IndexedDB. Fire-and-forget.
      import('../services/context/contentStorePersistence.js')
        .then((m) => m.saveSpaceContentIndex(spaceId, contentIndex))
        .catch(() => {});
    }
  },

  setFileSizes: (fileSizes) => {
    const spaceId = get()._spaceId;
    const serialized = fileSizes instanceof Map ? [...fileSizes] : fileSizes;
    set({ fileSizes: serialized });
    if (serialized) {
      // Too large for localStorage — persist to IndexedDB. Fire-and-forget.
      import('../services/context/contentStorePersistence.js')
        .then((m) => m.saveSpaceFileSizes(spaceId, serialized))
        .catch(() => {});
    }
  },

  setImportGraph: (importGraph) => {
    const spaceId = get()._spaceId;
    set({ importGraph });
    if (importGraph) {
      // Too large for localStorage — persist to IndexedDB. Fire-and-forget.
      import('../services/context/contentStorePersistence.js')
        .then((m) => m.saveSpaceImportGraph(spaceId, importGraph))
        .catch(() => {});
    }
  },

  setFileIndexByPath: (fileIndexByPath) => {
    const spaceId = get()._spaceId;
    set({ fileIndexByPath });
    if (fileIndexByPath) {
      // Too large for localStorage — persist to IndexedDB. Fire-and-forget.
      const serialized = serializeFileIndexByPath(fileIndexByPath);
      import('../services/context/contentStorePersistence.js')
        .then((m) => m.saveSpaceFileIndex(spaceId, serialized))
        .catch(() => {});
    }
  },

  setImportIndexByFile: (importIndexByFile) => {
    const spaceId = get()._spaceId;
    set({ importIndexByFile });
    if (importIndexByFile) {
      // Too large for localStorage — persist to IndexedDB. Fire-and-forget.
      const serialized = serializeImportIndexByFile(importIndexByFile);
      import('../services/context/contentStorePersistence.js')
        .then((m) => m.saveSpaceImportIndex(spaceId, serialized))
        .catch(() => {});
    }
  },

  setExpandedView: (expanded) => set({ expandedView: expanded }),

  setActiveCodeObjectId: (id) => set({ activeCodeObjectId: id }),

  addPendingChange: (change) => set((state) => ({
    pendingChanges: [...state.pendingChanges, { ...change, status: change.status || 'pending' }],
  })),

  addPendingChanges: (changes) => set((state) => ({
    pendingChanges: [...state.pendingChanges, ...changes.map(c => ({ ...c, status: c.status || 'pending' }))],
  })),

  acceptPendingChange: (filePath) => set((state) => ({
    pendingChanges: state.pendingChanges.map(c =>
      c.filePath === filePath ? { ...c, status: 'accepted' } : c
    ),
  })),

  rejectPendingChange: (filePath) => set((state) => ({
    pendingChanges: state.pendingChanges.filter(c => c.filePath !== filePath),
  })),

  acceptAllPendingChanges: () => set((state) => ({
    pendingChanges: state.pendingChanges.map(c => ({ ...c, status: 'accepted' })),
  })),

  rejectAllPendingChanges: () => set({ pendingChanges: [] }),

  clearPendingChanges: () => set({ pendingChanges: [] }),

  reset: () => {
    const spaceId = get()._spaceId;
    const ns = spaceId ? `${spaceId}:` : '';
    SPACE_SCOPED_KEYS.forEach((k) => {
      try { localStorage.removeItem(`code:${ns}${k}`); } catch { /* ignore */ }
    });
    import('../services/context/contentStorePersistence.js').then(m => m.clearContentStorePersistence()).catch(() => {});
    import('../services/context/contentStore.js').then(m => m.getContentStore().clear()).catch(() => {});
    import('../services/context/base64Store.js').then(m => { try { m.getBase64Store().encodedChunks.clear(); } catch { /* ignore */ } }).catch(() => {});
    set({
      githubToken: null,
      repoOwner: null,
      repoName: null,
      selectedRepo: null,
      selectedBranch: null,
      availableBranches: [],
      branchStrategy: null,
      techStack: '',
      techStackSource: null,
      pushStatus: 'idle',
      activeCodeObjectId: null,
      repoFileTree: null,
      repoFileContents: null,
      contentIndex: null,
      importGraph: null,
      fileSizes: null,
      fileIndexByPath: null,
      importIndexByFile: null,
      pendingChanges: [],
    });
  },
}), shallow);

export function getFileIndexEntry(filePath) {
  const map = useCodeStore.getState().fileIndexByPath;
  return map?.get(filePath) || null;
}

export function getFileImports(filePath) {
  const map = useCodeStore.getState().importIndexByFile;
  return map?.get(filePath) || null;
}

export default useCodeStore;
