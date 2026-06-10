import { createWithEqualityFn } from 'zustand/traditional';

const useSceneStore = createWithEqualityFn((set) => ({
  landingScene: null,
  diagramScene: null,
  onDiagramPointerMissed: null,
  setLandingScene: (scene) => set({ landingScene: scene }),
  setDiagramScene: (scene, onPointerMissed) =>
    set({ diagramScene: scene, onDiagramPointerMissed: onPointerMissed }),
}));

export default useSceneStore;
