import { useRef, useCallback, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import useLODStore, { calculateLODLevel, LOD_LEVELS } from '../stores/lodStore';
import useObjectsStore from '../stores/objectsStore';
import * as THREE from 'three';

// Reusable vectors to avoid GC pressure
const _cameraPos = new THREE.Vector3();
const _objectPos = new THREE.Vector3();

// Throttle settings
const LOD_UPDATE_INTERVAL = 100; // ms between LOD updates
const CAMERA_MOVE_THRESHOLD = 10; // Only recalculate if camera moved more than this

/**
 * Hook to manage LOD (Level of Detail) updates based on camera position
 * 
 * This hook:
 * 1. Tracks camera position changes
 * 2. Calculates LOD levels for objects inside containers
 * 3. Updates the LOD store with new levels
 * 
 * LOD Levels:
 * - 0 (FULL): Full detail - distance < 200 units
 * - 1 (MEDIUM): Medium detail (no edges) - distance 200-500 units  
 * - 2 (LOW): Low detail (don't render) - distance > 500 units
 */
const useLOD = (enabled = true) => {
  const { camera } = useThree();
  const lastUpdateTimeRef = useRef(0);
  const lastCameraPositionRef = useRef(new THREE.Vector3());
  
  // Get objects from store
  const objects = useObjectsStore((state) => state.objects);
  
  // Get LOD store actions
  const { 
    batchSetLODLevels, 
    childParentMap, 
    lodEnabled,
    setLODEnabled,
  } = useLODStore();
  
  // Enable/disable LOD based on prop
  useEffect(() => {
    setLODEnabled(enabled);
  }, [enabled, setLODEnabled]);
  
  // Calculate LOD for a single object
  const calculateObjectLOD = useCallback((objectPosition) => {
    if (!objectPosition) return LOD_LEVELS.FULL;
    
    // Set object position
    if (Array.isArray(objectPosition)) {
      _objectPos.set(
        objectPosition[0] || 0,
        objectPosition[1] || 0,
        objectPosition[2] || 0
      );
    } else if (objectPosition.x !== undefined) {
      _objectPos.set(objectPosition.x, objectPosition.y, objectPosition.z);
    } else {
      return LOD_LEVELS.FULL;
    }
    
    // Calculate distance
    const distance = _cameraPos.distanceTo(_objectPos);
    
    return calculateLODLevel(distance);
  }, []);
  
  // Update LOD levels in useFrame
  useFrame(() => {
    if (!lodEnabled || !camera) return;
    
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
    
    // Calculate LOD updates for children of containers
    const lodUpdates = [];
    const currentLodLevels = useLODStore.getState().lodLevels;
    
    for (const obj of objects) {
      // Only calculate LOD for objects that are children of containers
      if (!childParentMap.has(obj.id)) {
        continue;
      }
      
      const newLodLevel = calculateObjectLOD(obj.position);
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
  
  return {
    lodEnabled,
    setLODEnabled,
  };
};

export default useLOD;
