import { LOD_LEVELS } from '../stores/lodStore';

/**
 * A "gated child" is an internal member of a component — a function, class,
 * variable or hook that the merfolk hierarchy records as contained by a parent
 * object.  Sub-components (which are themselves parents) are NOT gated: they
 * render on their own distance LOD.
 *
 * `childParentMap` maps childId -> parentId; `parentIds` holds every object
 * that contains at least one member.
 */
export function isGatedChild(id, childParentMap, parentIds) {
  return childParentMap.has(id) && !parentIds.has(id);
}

/**
 * Whether an object should be drawn at FULL detail (edges / faces / full
 * instanced boxes) given the persisted merfolk hierarchy.
 *
 * - Gated internal member: visible only when its immediate parent component is
 *   at FULL detail.
 * - Free objects, parent components and sub-components: their own distance LOD.
 */
export function isFullDetailVisible(id, lodLevels, childParentMap, parentIds) {
  if (isGatedChild(id, childParentMap, parentIds)) {
    const parentId = childParentMap.get(id);
    return (lodLevels.get(parentId) ?? LOD_LEVELS.MEDIUM) === LOD_LEVELS.FULL;
  }
  return (lodLevels.get(id) ?? LOD_LEVELS.MEDIUM) === LOD_LEVELS.FULL;
}

/**
 * Whether an object should be drawn at FULL detail purely from its own
 * distance-based level.  Used for component shapes (dodecahedron / octahedron /
 * tetrahedron) which are never parent-gated — sub-components in particular must
 * keep rendering on their own LOD.
 */
export function isFullDetailByOwnLevel(id, lodLevels) {
  return (lodLevels.get(id) ?? LOD_LEVELS.MEDIUM) === LOD_LEVELS.FULL;
}

/**
 * Whether an object should be drawn by a given (MEDIUM/LOW) tier renderer.
 *
 * Gated internal members never render at MEDIUM/LOW — they exist only at FULL
 * detail (when their parent is FULL) or not at all.  This keeps the thousands
 * of component members out of the medium/low instanced meshes and out of the
 * raycast target set.
 */
export function visibleAtTier(id, tier, lodLevels, childParentMap, parentIds) {
  if (tier !== LOD_LEVELS.FULL && isGatedChild(id, childParentMap, parentIds)) {
    return false;
  }
  return (lodLevels.get(id) ?? LOD_LEVELS.MEDIUM) === tier;
}
