import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useDiagramStore = create(
  persist(
    (set) => ({
      serialisedGraphData: null,
      serialisedHierarchy: null,
      setGraphData: (data) => set({ serialisedGraphData: data }),
      setHierarchy: (data) => set({ serialisedHierarchy: data }),
      clearDiagram: () => set({ serialisedGraphData: null, serialisedHierarchy: null }),
    }),
    {
      name: 'diagram-storage',
      // If you need to migrate old versions, add a version and migrate function
      version: 1,
      partialize: (state) => ({
        serialisedGraphData: state.serialisedGraphData,
        serialisedHierarchy: state.serialisedHierarchy,
      }),
    }
  )
);