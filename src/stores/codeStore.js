import { createWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';

const SPACE_SCOPED_KEYS = ['selectedRepo', 'selectedBranch', 'branchStrategy', 'techStack', 'techStackSource', 'contentIndex', 'importGraph', 'repoFileTree', 'fileSizes', 'fileIndexByPath', 'importIndexByFile'];

function loadPersisted(spaceId, key) {
  try {
    const ns = spaceId ? `${spaceId}:` : '';
    const raw = localStorage.getItem(`code:${ns}${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function persist(spaceId, key, value) {
  try {
    const ns = spaceId ? `${spaceId}:` : '';
    const storageKey = `code:${ns}${key}`;
    if (value === null || value === undefined) {
      localStorage.removeItem(storageKey);
    } else {
      localStorage.setItem(storageKey, JSON.stringify(value));
    }
  } catch { /* ignore */ }
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
      contentIndex: loadPersisted(spaceId, 'contentIndex'),
      importGraph: loadPersisted(spaceId, 'importGraph'),
      repoFileTree: loadPersisted(spaceId, 'repoFileTree'),
      fileSizes: loadPersisted(spaceId, 'fileSizes'),
      fileIndexByPath: restoreFileIndexByPath(loadPersisted(spaceId, 'fileIndexByPath')),
      importIndexByFile: restoreImportIndexByFile(loadPersisted(spaceId, 'importIndexByFile')),
    });
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
    persist(spaceId, 'repoFileTree', fileTree);
    set({ repoFileTree: fileTree, repoFileContents: fileContents });
  },

  setContentIndex: (contentIndex) => {
    const spaceId = get()._spaceId;
    persist(spaceId, 'contentIndex', contentIndex);
    set({ contentIndex });
  },

  setFileSizes: (fileSizes) => {
    const spaceId = get()._spaceId;
    const serialized = fileSizes instanceof Map ? [...fileSizes] : fileSizes;
    persist(spaceId, 'fileSizes', serialized);
    set({ fileSizes: serialized });
  },

  setImportGraph: (importGraph) => {
    set({ importGraph });
  },

  setFileIndexByPath: (fileIndexByPath) => {
    const spaceId = get()._spaceId;
    persist(spaceId, 'fileIndexByPath', serializeFileIndexByPath(fileIndexByPath));
    set({ fileIndexByPath });
  },

  setImportIndexByFile: (importIndexByFile) => {
    const spaceId = get()._spaceId;
    persist(spaceId, 'importIndexByFile', serializeImportIndexByFile(importIndexByFile));
    set({ importIndexByFile });
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
