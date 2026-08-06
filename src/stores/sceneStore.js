import { createWithEqualityFn } from 'zustand/traditional';

const useSceneStore = createWithEqualityFn((set) => ({
  landingScene: null,
  diagramScene: null,
  onDiagramPointerMissed: null,
  landingScrollVersion: 0,
  setLandingScene: (scene) => set({ landingScene: scene }),
  setDiagramScene: (scene, onPointerMissed) =>
    set({ diagramScene: scene, onDiagramPointerMissed: onPointerMissed }),
  notifyLandingScroll: () =>
    set((s) => ({ landingScrollVersion: s.landingScrollVersion + 1 })),
}));

export default useSceneStore;
