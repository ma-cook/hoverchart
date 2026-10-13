import { create } from 'zustand';

/**
 * LOD (Level of Detail) Store
 * 
 * Manages LOD levels for ALL objects based on camera distance.
 * 
 * NOTE: Grouping containers (isContainer: true) are excluded from the LOD system
 * and always render at full detail. All other objects get LOD applied.
 * 
 * LOD Levels:
 * - 0: Full detail (edges, faces, text, indicators)
 * - 1: Medium detail (colored boxes, no edges)
 * - 2: Low detail (don't render)
 * 
 * Distance Thresholds:
 * - All objects: FULL < 2000, MEDIUM 2000-20000, LOW > 20000
 *
 * Every non-container object uses the SAME thresholds — the previous parent
 * regime (which made components with members render grey at longer distances)
 * has been removed.
 */

// LOD distance thresholds for CHILD objects (inside containers)
export const LOD_THRESHOLDS = {
  FULL_DETAIL: 2000,   // Below this: full detail (LOD 0)
  MEDIUM_DETAIL: 20000, // Below this: medium detail (LOD 1), above: low detail (LOD 2)
};

// Pre-squared thresholds for distanceToSquared() comparison (avoids sqrt)
export const LOD_THRESHOLDS_SQ = {
  FULL_DETAIL: LOD_THRESHOLDS.FULL_DETAIL * LOD_THRESHOLDS.FULL_DETAIL,
  MEDIUM_DETAIL: LOD_THRESHOLDS.MEDIUM_DETAIL * LOD_THRESHOLDS.MEDIUM_DETAIL,
};

// LOD level constants
export const LOD_LEVELS = {
  FULL: 0,      // Full detail: edges, faces, text, indicators
  MEDIUM: 1,    // Medium: colored boxes only, no edges
  LOW: 2,       // Low: don't render children, parent outline only
};

/**
 * Calculate LOD level based on squared distance.
 * Uses squared distances to avoid sqrt per object per frame.
 * Single regime for ALL non-container objects.
 */
export const calculateLODLevel = (distanceSq) => {
  if (distanceSq < LOD_THRESHOLDS_SQ.FULL_DETAIL) {
    return LOD_LEVELS.FULL;
  } else if (distanceSq < LOD_THRESHOLDS_SQ.MEDIUM_DETAIL) {
    return LOD_LEVELS.MEDIUM;
  }
  return LOD_LEVELS.LOW;
};

// Face text distance threshold — face texts are small and unreadable beyond this
export const FACE_TEXT_DISTANCE = 500;
export const FACE_TEXT_DISTANCE_SQ = FACE_TEXT_DISTANCE * FACE_TEXT_DISTANCE;

const useLODStore = create((set, get) => {
  // ─── Coalesced subscriber notification ────────────────────────────────
  // PERF FIX (import freeze): every mutation applies to the live state object
  // SYNCHRONOUSLY (so `getState()` reads are always correct within the same
  // task — the mount-time seed reads levels/parent maps immediately after
  // writing them), but SUBSCRIBER NOTIFICATION is coalesced to ONE set() per
  // animation frame.
  //
  // Why: the mount seed, the LOD drain and the face-text pass each write to
  // this store and each `set()` notifies every subscriber.  ~15 components
  // (all Global* renderers + ConnectionArrowheads + ObjectsRenderer) subscribe
  // to `_lodVersion` / `childParentMap` / `parentIds`, and React 18's
  // useSyncExternalStore re-renders them eagerly.  A seed that issued several
  // set() calls (hierarchy + levels) in one task therefore produced several
  // full re-render waves of the whole renderer suite per flush — the
  // multi-second import freeze.  Coalescing bounds that to one wave per frame.
  let flushScheduled = false;
  let lodDirty = false;
  let hierDirty = false;
  let faceDirty = false;

  const flush = () => {
    flushScheduled = false;
    const patch = {};
    if (lodDirty || hierDirty) {
      patch._lodVersion = get()._lodVersion + 1;
      lodDirty = false;
      hierDirty = false;
    }
    if (faceDirty) {
      patch._faceTextVersion = get()._faceTextVersion + 1;
      faceDirty = false;
    }
    if (patch._lodVersion !== undefined || patch._faceTextVersion !== undefined) {
      set(patch);
    }
  };

  const scheduleFlush = () => {
    if (flushScheduled) return;
    flushScheduled = true;
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(flush);
    } else {
      setTimeout(flush, 0);
    }
  };

  return {
    // Map of objectId -> LOD level
    lodLevels: new Map(),

    // Version counter incremented when lodLevels Map is mutated in-place.
    // Subscribers that depend on this counter will re-run when LOD levels change
    // without requiring an O(N) Map copy on every update.
    _lodVersion: 0,

    // Set of parent/container object IDs
    parentIds: new Set(),

    // Map of parentId -> Set of childIds (for container relationships)
    parentChildMap: new Map(),

    // Map of childId -> parentId
    childParentMap: new Map(),

    // Last camera position used for LOD calculation
    lastCameraPosition: null,

    // Whether LOD is enabled globally
    lodEnabled: true,

    // Face text visibility: Map of objectId -> boolean (true = show, false = hide)
    // Objects beyond FACE_TEXT_DISTANCE are hidden even at FULL LOD
    faceTextVisible: new Map(),
    _faceTextVersion: 0,

    /**
     * Batch update face text visibility
     * PERFORMANCE: Mutates Map in-place, coalesces the version bump.
     */
    batchSetFaceTextVisible: (updates) => {
      const state = get();
      let changed = false;
      for (const [objectId, visible] of updates) {
        if (state.faceTextVisible.get(objectId) !== visible) {
          state.faceTextVisible.set(objectId, visible);
          changed = true;
        }
      }
      if (changed) {
        faceDirty = true;
        scheduleFlush();
      }
    },

    /**
     * Set LOD level for a specific object
     * PERFORMANCE: Mutates the Map in-place and coalesces the version bump.
     */
    setLODLevel: (objectId, level) => {
      const state = get();
      if (state.lodLevels.get(objectId) === level) return; // No change
      state.lodLevels.set(objectId, level); // Mutate in-place
      lodDirty = true;
      scheduleFlush();
    },

    /**
     * Batch update LOD levels for multiple objects
     * PERFORMANCE: Mutates the Map in-place and coalesces the version bump.
     */
    batchSetLODLevels: (updates) => {
      const state = get();
      let changed = false;
      for (const [objectId, level] of updates) {
        if (state.lodLevels.get(objectId) !== level) {
          state.lodLevels.set(objectId, level);
          changed = true;
        }
      }
      if (changed) {
        lodDirty = true;
        scheduleFlush();
      }
    },

    /**
     * Single-commit batch used by the mount-time seed.
     *
     * Commits hierarchy (parent ids + relationships) AND LOD levels (+ optional
     * face-text visibility) in ONE pass, producing at most ONE subscriber
     * notification.  This replaces the previous sequence of separate
     * batchRegisterParents / batchRegisterParentChild / batchSetLODLevels
     * calls, each of which re-rendered the entire Global* renderer suite.
     *
     * Idempotent and identity-preserving: maps/Sets are only replaced when
     * their contents actually change, so re-running the seed with an unchanged
     * population is a true no-op (no notification at all).
     *
     * @param {Object} [batch]
     * @param {Array<string>} [batch.parents] parent object ids
     * @param {Array<{parentId:string,childId:string}>} [batch.relationships]
     * @param {Array<[string, number]>} [batch.levels] [objectId, level] pairs
     * @param {Array<[string, boolean]>} [batch.faceText] [objectId, visible]
     */
    applyLODBatch: ({ parents, relationships, levels, faceText } = {}) => {
      const state = get();

      if (levels && levels.length > 0) {
        let changed = false;
        for (let i = 0; i < levels.length; i++) {
          const objectId = levels[i][0];
          const level = levels[i][1];
          if (state.lodLevels.get(objectId) !== level) {
            state.lodLevels.set(objectId, level);
            changed = true;
          }
        }
        if (changed) lodDirty = true;
      }

      if (faceText && faceText.length > 0) {
        let changed = false;
        for (let i = 0; i < faceText.length; i++) {
          const objectId = faceText[i][0];
          const visible = faceText[i][1];
          if (state.faceTextVisible.get(objectId) !== visible) {
            state.faceTextVisible.set(objectId, visible);
            changed = true;
          }
        }
        if (changed) faceDirty = true;
      }

      if (parents && parents.length > 0) {
        let changed = false;
        for (let i = 0; i < parents.length; i++) {
          const id = parents[i];
          if (!state.parentIds.has(id)) {
            if (!changed) {
              state.parentIds = new Set(state.parentIds);
              changed = true;
            }
            state.parentIds.add(id);
          }
        }
        if (changed) hierDirty = true;
      }

      if (relationships && relationships.length > 0) {
        let changed = false;
        // Collect parents not yet present and clone parentIds ONCE after the
        // loop.  Cloning inside the loop was O(relationships × parentIds) —
        // quadratic on a large hierarchy (a repo scan can register 100k+ rels).
        let newParents = null;
        for (let i = 0; i < relationships.length; i++) {
          const parentId = relationships[i].parentId;
          const childId = relationships[i].childId;
          if (
            state.parentIds.has(parentId) &&
            state.childParentMap.get(childId) === parentId
          ) {
            continue;
          }
          if (!changed) {
            state.parentChildMap = new Map(state.parentChildMap);
            state.childParentMap = new Map(state.childParentMap);
            changed = true;
          }
          let childSet = state.parentChildMap.get(parentId);
          if (!childSet) {
            childSet = new Set();
            state.parentChildMap.set(parentId, childSet);
          }
          childSet.add(childId);
          state.childParentMap.set(childId, parentId);
          if (!state.parentIds.has(parentId)) {
            if (newParents === null) newParents = [];
            newParents.push(parentId);
          }
        }
        if (newParents !== null) {
          state.parentIds = new Set(state.parentIds);
          for (let i = 0; i < newParents.length; i++) state.parentIds.add(newParents[i]);
          changed = true;
        }
        if (changed) hierDirty = true;
      }

      if (lodDirty || hierDirty || faceDirty) scheduleFlush();
    },

    /**
     * Get LOD level for an object
     */
    getLODLevel: (objectId) => {
      const { lodLevels, lodEnabled } = get();
      if (!lodEnabled) return LOD_LEVELS.FULL;
      return lodLevels.get(objectId) ?? LOD_LEVELS.FULL;
    },

    /**
     * Register a parent-child relationship
     */
    registerParentChild: (parentId, childId) => {
      const state = get();
      if (state.parentIds.has(parentId) && state.childParentMap.get(childId) === parentId) {
        return;
      }
      state.parentChildMap = new Map(state.parentChildMap);
      state.childParentMap = new Map(state.childParentMap);
      state.parentIds = new Set(state.parentIds);

      if (!state.parentChildMap.has(parentId)) {
        state.parentChildMap.set(parentId, new Set());
      }
      state.parentChildMap.get(parentId).add(childId);
      state.childParentMap.set(childId, parentId);
      state.parentIds.add(parentId);

      hierDirty = true;
      scheduleFlush();
    },

    /**
     * Batch register parent-child relationships
     */
    batchRegisterParentChild: (relationships) => {
      const state = get();
      let changed = false;
      let newParents = null;

      for (const { parentId, childId } of relationships) {
        if (state.parentIds.has(parentId) && state.childParentMap.get(childId) === parentId) {
          continue;
        }
        if (!changed) {
          state.parentChildMap = new Map(state.parentChildMap);
          state.childParentMap = new Map(state.childParentMap);
          changed = true;
        }
        if (!state.parentChildMap.has(parentId)) {
          state.parentChildMap.set(parentId, new Set());
        }
        state.parentChildMap.get(parentId).add(childId);
        state.childParentMap.set(childId, parentId);
        if (!state.parentIds.has(parentId)) {
          if (newParents === null) newParents = [];
          newParents.push(parentId);
        }
      }

      if (newParents !== null) {
        state.parentIds = new Set(state.parentIds);
        for (let i = 0; i < newParents.length; i++) state.parentIds.add(newParents[i]);
        changed = true;
      }

      if (changed) {
        hierDirty = true;
        scheduleFlush();
      }
    },

    /**
     * Register an object as a parent/container
     */
    registerParent: (parentId) => {
      const state = get();
      if (state.parentIds.has(parentId)) return;
      state.parentIds = new Set(state.parentIds);
      state.parentIds.add(parentId);
      hierDirty = true;
      scheduleFlush();
    },

    /**
     * Batch register parent IDs
     */
    batchRegisterParents: (parentIdList) => {
      const state = get();
      let changed = false;
      for (const id of parentIdList) {
        if (!state.parentIds.has(id)) {
          if (!changed) {
            state.parentIds = new Set(state.parentIds);
            changed = true;
          }
          state.parentIds.add(id);
        }
      }
      if (changed) {
        hierDirty = true;
        scheduleFlush();
      }
    },

    /**
     * Check if an object is a parent/container
     */
    isParent: (objectId) => {
      return get().parentIds.has(objectId);
    },

    /**
     * Get parent ID for a child object
     */
    getParentId: (childId) => {
      return get().childParentMap.get(childId);
    },

    /**
     * Get all children of a parent
     */
    getChildren: (parentId) => {
      return get().parentChildMap.get(parentId) || new Set();
    },

    /**
     * Check if an object is a child of a container
     */
    isChildOfContainer: (objectId) => {
      return get().childParentMap.has(objectId);
    },

    /**
     * Update camera position (used to track if LOD needs recalculation)
     */
    setLastCameraPosition: (position) => {
      set({ lastCameraPosition: position });
    },

    /**
     * Toggle LOD system
     */
    setLODEnabled: (enabled) => {
      set({ lodEnabled: enabled });
    },

    /**
     * Clear all LOD data
     */
    clearLODData: () => {
      // Drop any pending coalesced bump — the reset below is authoritative.
      lodDirty = false;
      hierDirty = false;
      faceDirty = false;
      set({
        lodLevels: new Map(),
        _lodVersion: 0,
        faceTextVisible: new Map(),
        _faceTextVersion: 0,
        parentIds: new Set(),
        parentChildMap: new Map(),
        childParentMap: new Map(),
        lastCameraPosition: null,
      });
    },

    /**
     * Clear LOD levels only (keep relationships)
     */
    clearLODLevels: () => {
      lodDirty = false;
      set({ lodLevels: new Map(), _lodVersion: 0 });
    },
  };
});

export default useLODStore;
