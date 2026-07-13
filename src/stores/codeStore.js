import { createWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';

function loadPersisted(key) {
  try {
    const raw = localStorage.getItem(`code:${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function persist(key, value) {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(`code:${key}`);
    } else {
      localStorage.setItem(`code:${key}`, JSON.stringify(value));
    }
  } catch {}
}

const useCodeStore = createWithEqualityFn((set) => ({
  githubConnected: false,
  githubToken: null,
  repoOwner: null,
  repoName: null,
  selectedRepo: loadPersisted('selectedRepo') || null,
  selectedBranch: loadPersisted('selectedBranch') || null,
  availableBranches: [],
  branchStrategy: loadPersisted('branchStrategy') || null,
  techStack: loadPersisted('techStack') || '',
  techStackSource: loadPersisted('techStackSource') || null,
  pushStatus: 'idle',
  expandedView: false,
  activeCodeObjectId: null,

  setGithubConnected: (connected) => set({ githubConnected: connected }),
  setGithubToken: (token) => set({ githubToken: token }),
  setRepoOwner: (owner) => set({ repoOwner: owner }),
  setRepoName: (name) => set({ repoName: name }),

  setSelectedRepo: (repo) => {
    persist('selectedRepo', repo);
    persist('selectedBranch', repo?.default_branch || 'main');
    set({
      selectedRepo: repo,
      selectedBranch: repo?.default_branch || 'main',
      branchStrategy: null,
    });
  },

  setSelectedBranch: (branch) => {
    persist('selectedBranch', branch);
    set({
      selectedBranch: branch,
      branchStrategy: branch === 'main' || branch === 'master' ? 'main' : 'existing',
    });
  },

  setAvailableBranches: (branches) => set({ availableBranches: branches }),

  setBranchStrategy: (strategy) => {
    persist('branchStrategy', strategy);
    set({ branchStrategy: strategy });
  },

  setTechStack: (stack, source) => {
    persist('techStack', stack);
    persist('techStackSource', source || 'user');
    set({
      techStack: stack,
      techStackSource: source || 'user',
    });
  },

  setPushStatus: (status) => set({ pushStatus: status }),

  setExpandedView: (expanded) => set({ expandedView: expanded }),

  setActiveCodeObjectId: (id) => set({ activeCodeObjectId: id }),

  reset: () => {
    ['selectedRepo', 'selectedBranch', 'branchStrategy', 'techStack', 'techStackSource'].forEach((k) => {
      try { localStorage.removeItem(`code:${k}`); } catch {}
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
    });
  },
}), shallow);

export default useCodeStore;
