import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import useLODStore, { calculateLODLevel, calculateParentLODLevel, LOD_LEVELS } from '../stores/lodStore';
import useObjectsStore from '../stores/objectsStore';
import * as THREE from 'three';

// Reusable vectors to avoid GC pressure
const _cameraPos = new THREE.Vector3();
const _objectPos = new THREE.Vector3();

// Throttle settings
const LOD_UPDATE_INTERVAL = 100; // ms between LOD updates
const CAMERA_MOVE_THRESHOLD = 10; // Only recalculate if camera moved more than this

/**
 * LODManager Component
 * 
 * This component manages LOD (Level of Detail) for all objects.
 * It must be placed inside the Canvas context to have access to the camera.
 * 
 * LOD Levels:
 * - 0 (FULL): Full detail
 * - 1 (MEDIUM): Medium detail (no edges)
 * - 2 (LOW): Low detail (don't render)
 * 
 * Distance Thresholds:
 * - Child objects (inside containers): FULL < 200, MEDIUM 200-500, LOW > 500
 * - Parent containers: FULL < 600, MEDIUM 600-1500, LOW > 1500 (3x child distances)
 */
const LODManager = ({ enabled = true }) => {
  const { camera } = useThree();
  const lastUpdateTimeRef = useRef(0);
  const lastCameraPositionRef = useRef(new THREE.Vector3());
  const initializedRef = useRef(false);
  
  // Get objects from store
  const objects = useObjectsStore((state) => state.objects);
  
  // Get LOD store state and actions
  const { 
    batchSetLODLevels, 
    batchRegisterParentChild,
    batchRegisterParents,
    childParentMap, 
    parentIds,
    lodEnabled,
    setLODEnabled,
    clearLODData,
  } = useLODStore();
  
  // Enable/disable LOD based on prop
  useEffect(() => {
    setLODEnabled(enabled);
  }, [enabled, setLODEnabled]);
  
  // Initialize parent-child relationships when objects change
  useEffect(() => {
    if (!objects || objects.length === 0) {
      return;
    }
    
    const relationships = [];
    const parentIdList = [];
    
    // Find all container objects (can be cubes, dodecahedrons, or tetrahedrons)
    const containers = objects.filter(obj => obj.merfolkData?.isContainer);
    
    // Register all containers as parents
    for (const container of containers) {
      parentIdList.push(container.id);
    }
    
    if (containers.length === 0) {
      // Even without containers, we might have parent components from merfolk data
      // Check for objects that have children based on merfolkData
      for (const obj of objects) {
        if (obj.merfolkData?.isParent || obj.merfolkData?.hasChildren) {
          parentIdList.push(obj.id);
        }
      }
      
      if (parentIdList.length > 0) {
        batchRegisterParents(parentIdList);
      }
      initializedRef.current = true;
      return;
    }
    
    for (const container of containers) {
      const containerId = container.id;
      const containerPos = container.position || [0, 0, 0];
      const containerScale = container.scale || [1, 1, 1];
      
      // Calculate container bounds (approximate)
      const halfSize = [
        (containerScale[0] || 1) * 5 * 1.5, // CUBE_SIZE * some margin
        (containerScale[1] || 1) * 5 * 1.5,
        (containerScale[2] || 1) * 5 * 1.5,
      ];
      
      for (const obj of objects) {
        // Skip containers themselves and self-reference
        if (obj.merfolkData?.isContainer || obj.id === containerId) {
          continue;
        }
        
        // Check if object has explicit parent reference
        if (obj.merfolkData?.parentId === containerId) {
          relationships.push({ parentId: containerId, childId: obj.id });
          continue;
        }
        
        // Check spatial containment
        const objPos = obj.position;
        if (!objPos) continue;
        
        const ox = objPos[0] || 0;
        const oy = objPos[1] || 0;
        const oz = objPos[2] || 0;
        const cx = containerPos[0] || 0;
        const cy = containerPos[1] || 0;
        const cz = containerPos[2] || 0;
        
        // Check if object is inside container bounds
        if (
          Math.abs(ox - cx) < halfSize[0] &&
          Math.abs(oy - cy) < halfSize[1] &&
          Math.abs(oz - cz) < halfSize[2]
        ) {
          relationships.push({ parentId: containerId, childId: obj.id });
        }
      }
    }
    
    // Batch register parents first
    if (parentIdList.length > 0) {
      batchRegisterParents(parentIdList);
    }
    
    // Then batch register relationships
    if (relationships.length > 0) {
      batchRegisterParentChild(relationships);
    }
    
    initializedRef.current = true;
  }, [objects, batchRegisterParentChild, batchRegisterParents]);
  
  // Update LOD levels in useFrame
  useFrame(() => {
    if (!lodEnabled || !camera || !initializedRef.current) return;
    
    const now = performance.now();
    
    // Throttle updates
    if (now - lastUpdateTimeRef.current < LOD_UPDATE_INTERVAL) {
      return;
    }
    
    // Get current camera position
    _cameraPos.setFromMatrixPosition(camera.matrixWorld);
    
    // Check if camera moved significantly
    const cameraMoved = _cameraPos.distanceTo(lastCameraPositionRef.current) > CAMERA_MOVE_THRESHOLD;
    
    if (!cameraMoved) {
      return;
    }
    
    // Update last camera position
    lastCameraPositionRef.current.copy(_cameraPos);
    lastUpdateTimeRef.current = now;
    
    // Calculate LOD updates for ALL objects (parents and children)
    const lodUpdates = [];
    const currentLodLevels = useLODStore.getState().lodLevels;
    const currentChildParentMap = useLODStore.getState().childParentMap;
    const currentParentIds = useLODStore.getState().parentIds;
    
    for (const obj of objects) {
      // Get object position
      const pos = obj.position;
      if (!pos) continue;
      
      if (Array.isArray(pos)) {
        _objectPos.set(pos[0] || 0, pos[1] || 0, pos[2] || 0);
      } else if (pos.x !== undefined) {
        _objectPos.set(pos.x, pos.y, pos.z);
      } else {
        continue;
      }
      
      // Calculate distance to camera
      const distance = _cameraPos.distanceTo(_objectPos);
      
      // Check if this is a grouping container (excluded from LOD system)
      const isGroupingContainer = obj.merfolkData?.isContainer === true;
      
      // Grouping containers are excluded from LOD - they always render at full detail
      if (isGroupingContainer) {
        continue;
      }
      
      // Determine if this object is a parent (has children) or a child
      const isParent = currentParentIds.has(obj.id);
      const isChild = currentChildParentMap.has(obj.id);
      
      // Calculate LOD level based on object type
      let newLodLevel;
      if (isParent) {
        // Parent objects use 5x distance thresholds
        newLodLevel = calculateParentLODLevel(distance);
      } else if (isChild) {
        // Child objects use standard thresholds
        newLodLevel = calculateLODLevel(distance);
      } else {
        // Objects that are neither parent nor child don't get LOD applied
        // (they render at full detail always)
        continue;
      }
      
      const currentLevel = currentLodLevels.get(obj.id);
      
      // Only update if changed
      if (currentLevel !== newLodLevel) {
        lodUpdates.push([obj.id, newLodLevel]);
      }
    }
    
    // Batch update if there are changes
    if (lodUpdates.length > 0) {
      batchSetLODLevels(lodUpdates);
    }
  });
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearLODData();
    };
  }, [clearLODData]);
  
  return null; // This is a logic-only component
};

export default LODManager;
