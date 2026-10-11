/**
 * textAtlasStore.js
 *
 * Tiny Zustand store whose sole purpose is to notify React components when
 * the text atlas worker delivers new rendered text bitmaps.
 *
 * Components subscribe to `atlasVersion` and include it in their useMemo
 * deps so geometry is re-created once the worker-rendered entry is in cache.
 */

import { create } from 'zustand';

// Coalesce bump requests within a single animation frame into one store
// update.  During progressive mounting the atlas worker can finish several
// batches in quick succession and every `bumpVersion()` re-renders each
// mounted text sprite; collapsing them prevents an O(batches x sprites)
// re-render storm.
let _bumpScheduled = false;

const useTextAtlasStore = create((set) => ({
  atlasVersion: 0,

  /** Schedule a single atlasVersion bump on the next animation frame. */
  bumpVersion: () => {
    if (_bumpScheduled) return;
    _bumpScheduled = true;
    requestAnimationFrame(() => {
      _bumpScheduled = false;
      set((s) => ({ atlasVersion: s.atlasVersion + 1 }));
    });
  },

  /** Immediately bump atlasVersion (used when a synchronous frame is required). */
  bumpVersionNow: () => set((s) => ({ atlasVersion: s.atlasVersion + 1 })),
}));

export default useTextAtlasStore;
