import { create } from 'zustand';

export const getBaseDpr = () => Math.min(window.devicePixelRatio || 1, 2);

/**
 * Render quality state shared between the adaptive-DPR controller, the shared
 * Canvas and the post-processing stack. Kept separate from UI stores so quality
 * drops do not re-render the whole application.
 */
const useRenderQualityStore = create((set, get) => ({
  // Authoritative render pixel ratio. SharedCanvas passes this as the Canvas
  // `dpr` prop so R3F's deps-less configure() cannot reset it back to max on an
  // unrelated canvas re-render.
  dpr: getBaseDpr(),

  // True while frames are being rendered below the base quality tier.
  degraded: false,

  setDpr: (value) => {
    const next = Number(value) || 1;
    if (get().dpr === next) return;
    set({ dpr: next });
  },

  setDegraded: (value) => {
    const next = Boolean(value);
    if (get().degraded === next) return;
    set({ degraded: next });
  },
}));

export default useRenderQualityStore;
