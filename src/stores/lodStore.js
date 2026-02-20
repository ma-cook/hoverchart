import { create } from 'zustand';

/**
 * LOD (Level of Detail) Store
 * 
 * Manages LOD levels for objects based on camera distance.
 * Used for child objects inside containers AND parent objects (not grouping containers).
 * 
 * NOTE: Grouping containers (isContainer: true) are excluded from the LOD system
 * and always render at full detail.
 * 
 * LOD Levels:
 * - 0: Full detail (edges, faces, text, indicators)
 * - 1: Medium detail (colored boxes, no edges)
 * - 2: Low detail (don't render)
 * 
 * Distance Thresholds:
 * - Child objects: FULL < 2000, MEDIUM 2000-6000, LOW > 6000
 * - Parent objects: FULL < 3500, MEDIUM 3500-11000, LOW > 11000
 */

// LOD distance thresholds for CHILD objects (inside containers)
export const LOD_THRESHOLDS = {
  FULL_DETAIL: 5000,   // Below this: full detail (LOD 0)
  MEDIUM_DETAIL: 20000, // Below this: medium detail (LOD 1), above: low detail (LOD 2)
};

// LOD distance thresholds for PARENT objects
// Note: Grouping containers (isContainer) are excluded from LOD system entirely
export const LOD_THRESHOLDS_PARENT = {
  FULL_DETAIL: 5000,  // Full detail below this distance
  MEDIUM_DETAIL: 20000, // Basic mesh renders from FULL_DETAIL to this distance, then LOW (hidden)
};

// LOD level constants
export const LOD_LEVELS = {
  FULL: 0,      // Full detail: edges, faces, text, indicators
  MEDIUM: 1,    // Medium: colored boxes only, no edges
  LOW: 2,       // Low: don't render children, parent outline only
};

/**
 * Calculate LOD level based on distance (for child objects)
 */
export const calculateLODLevel = (distance) => {
  if (distance < LOD_THRESHOLDS.FULL_DETAIL) {
    return LOD_LEVELS.FULL;
  } else if (distance < LOD_THRESHOLDS.MEDIUM_DETAIL) {
    return LOD_LEVELS.MEDIUM;
  }
  return LOD_LEVELS.LOW;
};

/**
 * Calculate LOD level based on distance (for parent/container objects)
 * Uses 3x the distance thresholds of child objects
 */
export const calculateParentLODLevel = (distance) => {
  if (distance < LOD_THRESHOLDS_PARENT.FULL_DETAIL) {
    return LOD_LEVELS.FULL;
  } else if (distance < LOD_THRESHOLDS_PARENT.MEDIUM_DETAIL) {
    return LOD_LEVELS.MEDIUM;
  }
  return LOD_LEVELS.LOW;
};

const useLODStore = create((set, get) => ({
  // Map of objectId -> LOD level
  lodLevels: new Map(),
  
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
   */
  setLODLevel: (objectId, level) => {
    set((state) => {
      const newLevels = new Map(state.lodLevels);
      newLevels.set(objectId, level);
      return { lodLevels: newLevels };
    });
  },
  
  /**
   * Batch update LOD levels for multiple objects
   */
  batchSetLODLevels: (updates) => {
    set((state) => {
      const newLevels = new Map(state.lodLevels);
      for (const [objectId, level] of updates) {
        newLevels.set(objectId, level);
      }
      return { lodLevels: newLevels };
    });
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
    set({ lodLevels: new Map() });
  },
}));

export default useLODStore;
