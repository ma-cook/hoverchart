import { createWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';

const useCodeStore = createWithEqualityFn((set) => ({
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

  setGithubConnected: (connected) => set({ githubConnected: connected }),
  setGithubToken: (token) => set({ githubToken: token }),
  setRepoOwner: (owner) => set({ repoOwner: owner }),
  setRepoName: (name) => set({ repoName: name }),

  setSelectedRepo: (repo) => set({
    selectedRepo: repo,
    selectedBranch: repo?.default_branch || 'main',
    branchStrategy: null,
  }),

  setSelectedBranch: (branch) => set({
    selectedBranch: branch,
    branchStrategy: branch === 'main' || branch === 'master' ? 'main' : 'existing',
  }),

  setAvailableBranches: (branches) => set({ availableBranches: branches }),

  setBranchStrategy: (strategy) => set({ branchStrategy: strategy }),

  setTechStack: (stack, source) => set({
    techStack: stack,
    techStackSource: source || 'user',
  }),

  setPushStatus: (status) => set({ pushStatus: status }),

  setExpandedView: (expanded) => set({ expandedView: expanded }),

  setActiveCodeObjectId: (id) => set({ activeCodeObjectId: id }),

  reset: () => set({
    githubToken: null,
    repoOwner: null,
    repoName: null,
    selectedRepo: null,
    selectedBranch: null,
    availableBranches: [],
    branchStrategy: null,
    pushStatus: 'idle',
    activeCodeObjectId: null,
  }),
}), shallow);

export default useCodeStore;
