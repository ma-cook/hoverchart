import { createWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';

const SPACE_SCOPED_KEYS = ['selectedRepo', 'selectedBranch', 'branchStrategy', 'techStack', 'techStackSource'];

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
  } catch {}
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

  setRepoContext: (fileTree, fileContents) => set({ repoFileTree: fileTree, repoFileContents: fileContents }),

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
      try { localStorage.removeItem(`code:${ns}${k}`); } catch {}
    });
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
      pendingChanges: [],
    });
  },
}), shallow);

export default useCodeStore;
