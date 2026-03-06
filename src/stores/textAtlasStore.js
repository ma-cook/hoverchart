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

const useTextAtlasStore = create((set) => ({
  atlasVersion: 0,
  bumpVersion: () => set((s) => ({ atlasVersion: s.atlasVersion + 1 })),
}));

export default useTextAtlasStore;
