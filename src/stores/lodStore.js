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
 * - Child/standalone objects: FULL < 2000, MEDIUM 2000-20000, LOW > 20000
 * - Parent objects: FULL < 4000, MEDIUM 4000-20000, LOW > 20000
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

// LOD distance thresholds for PARENT objects
// Note: Grouping containers (isContainer) are excluded from LOD system entirely
export const LOD_THRESHOLDS_PARENT = {
  FULL_DETAIL: 4000,  // Full detail below this distance
  MEDIUM_DETAIL: 20000, // Basic mesh renders from FULL_DETAIL to this distance, then LOW (hidden)
};

// Pre-squared parent thresholds
export const LOD_THRESHOLDS_PARENT_SQ = {
  FULL_DETAIL: LOD_THRESHOLDS_PARENT.FULL_DETAIL * LOD_THRESHOLDS_PARENT.FULL_DETAIL,
  MEDIUM_DETAIL: LOD_THRESHOLDS_PARENT.MEDIUM_DETAIL * LOD_THRESHOLDS_PARENT.MEDIUM_DETAIL,
};

// LOD level constants
export const LOD_LEVELS = {
  FULL: 0,      // Full detail: edges, faces, text, indicators
  MEDIUM: 1,    // Medium: colored boxes only, no edges
  LOW: 2,       // Low: don't render children, parent outline only
};

/**
 * Calculate LOD level based on squared distance (for child objects)
 * Uses squared distances to avoid sqrt per object per frame
 */
export const calculateLODLevel = (distanceSq) => {
  if (distanceSq < LOD_THRESHOLDS_SQ.FULL_DETAIL) {
    return LOD_LEVELS.FULL;
  } else if (distanceSq < LOD_THRESHOLDS_SQ.MEDIUM_DETAIL) {
    return LOD_LEVELS.MEDIUM;
  }
  return LOD_LEVELS.LOW;
};

/**
 * Calculate LOD level based on squared distance (for parent/container objects)
 * Uses squared distances to avoid sqrt per object per frame
 */
export const calculateParentLODLevel = (distanceSq) => {
  if (distanceSq < LOD_THRESHOLDS_PARENT_SQ.FULL_DETAIL) {
    return LOD_LEVELS.FULL;
  } else if (distanceSq < LOD_THRESHOLDS_PARENT_SQ.MEDIUM_DETAIL) {
    return LOD_LEVELS.MEDIUM;
  }
  return LOD_LEVELS.LOW;
};

const useLODStore = create((set, get) => ({
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
  
  /**
   * Set LOD level for a specific object
   * PERFORMANCE: Mutates the Map in-place and bumps _lodVersion to avoid O(N) copy.
   */
  setLODLevel: (objectId, level) => {
    const state = get();
    if (state.lodLevels.get(objectId) === level) return; // No change
    state.lodLevels.set(objectId, level); // Mutate in-place
    set({ _lodVersion: state._lodVersion + 1 });
  },
  
  /**
   * Batch update LOD levels for multiple objects
   * PERFORMANCE: Mutates the Map in-place and bumps _lodVersion once per batch.
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
      set({ _lodVersion: state._lodVersion + 1 });
    }
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
    set((state) => {
      const newParentChildMap = new Map(state.parentChildMap);
      const newChildParentMap = new Map(state.childParentMap);
      
      if (!newParentChildMap.has(parentId)) {
        newParentChildMap.set(parentId, new Set());
      }
      newParentChildMap.get(parentId).add(childId);
      newChildParentMap.set(childId, parentId);
      
      return { 
        parentChildMap: newParentChildMap,
        childParentMap: newChildParentMap,
      };
    });
  },
  
  /**
   * Batch register parent-child relationships
   */
  batchRegisterParentChild: (relationships) => {
    set((state) => {
      const newParentChildMap = new Map(state.parentChildMap);
      const newChildParentMap = new Map(state.childParentMap);
      const newParentIds = new Set(state.parentIds);
      
      for (const { parentId, childId } of relationships) {
        if (!newParentChildMap.has(parentId)) {
          newParentChildMap.set(parentId, new Set());
        }
        newParentChildMap.get(parentId).add(childId);
        newChildParentMap.set(childId, parentId);
        newParentIds.add(parentId); // Track parent IDs
      }
      
      return { 
        parentChildMap: newParentChildMap,
        childParentMap: newChildParentMap,
        parentIds: newParentIds,
      };
    });
  },
  
  /**
   * Register an object as a parent/container
   */
  registerParent: (parentId) => {
    set((state) => {
      const newParentIds = new Set(state.parentIds);
      newParentIds.add(parentId);
      return { parentIds: newParentIds };
    });
  },
  
  /**
   * Batch register parent IDs
   */
  batchRegisterParents: (parentIdList) => {
    set((state) => {
      const newParentIds = new Set(state.parentIds);
      for (const id of parentIdList) {
        newParentIds.add(id);
      }
      return { parentIds: newParentIds };
    });
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
    set({
      lodLevels: new Map(),
      _lodVersion: 0,
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
    set({ lodLevels: new Map(), _lodVersion: 0 });
  },
}));

export default useLODStore;
