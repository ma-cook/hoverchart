import { createWithEqualityFn } from 'zustand/traditional';

const useChatWindowStore = createWithEqualityFn((set) => ({
  layouts: {},

  setLayout: (id, nextLayout) =>
    set((state) => ({
      layouts: { ...state.layouts, [id]: nextLayout },
    })),

  removeLayout: (id) =>
    set((state) => {
      if (!(id in state.layouts)) return state;
      const layouts = { ...state.layouts };
      delete layouts[id];
      return { layouts };
    }),

  clearLayouts: () => set({ layouts: {} }),
}));

export default useChatWindowStore;
