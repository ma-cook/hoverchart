import { useRef, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { create } from 'zustand';

/**
 * Global Animation Manager Store
 * Centralized registry for all animated connection lines
 * Instead of 500+ individual useFrame callbacks, we have ONE global callback
 */
const useAnimationManagerStore = create((set, get) => ({
  // Map of connectionId -> { materialRef, speed, direction }
  animatedLines: new Map(),
  
  // Register an animated line
  registerLine: (connectionId, materialRef, speed = 1, direction = 1) => {
    set((state) => {
      const newMap = new Map(state.animatedLines);
      newMap.set(connectionId, { 
        materialRef, 
        speed, 
        direction,
        offset: 0 
      });
      return { animatedLines: newMap };
    });
  },
  
  // Unregister an animated line
  unregisterLine: (connectionId) => {
    set((state) => {
      const newMap = new Map(state.animatedLines);
      newMap.delete(connectionId);
      return { animatedLines: newMap };
    });
  },
  
  // Update animation properties
  updateLine: (connectionId, updates) => {
    const state = get();
    const line = state.animatedLines.get(connectionId);
    if (line) {
      const newMap = new Map(state.animatedLines);
      newMap.set(connectionId, { ...line, ...updates });
      set({ animatedLines: newMap });
    }
  },
  
  // Get all registered lines (for the global update loop)
  getAnimatedLines: () => get().animatedLines,
}));

/**
 * Global Animation Manager Component
 * Place this ONCE in your scene to handle all connection line animations
 * Replaces individual useFrame callbacks in each AnimatedConnectionLine
 */
export const ConnectionAnimationManager = () => {
  const offsetsRef = useRef(new Map()); // connectionId -> current offset
  
  useFrame((state, delta) => {
    const animatedLines = useAnimationManagerStore.getState().animatedLines;
    
    // Skip if no animated lines
    if (animatedLines.size === 0) return;
    
    // Batch update all animated lines in a single frame callback
    animatedLines.forEach((lineData, connectionId) => {
      const { materialRef, speed, direction } = lineData;
      const material = materialRef?.current;
      
      if (!material?.uniforms?.dashOffset) return;
      
      // Get or initialize offset for this connection
      let offset = offsetsRef.current.get(connectionId) || 0;
      
      // Update offset based on direction and speed
      const animationSpeed = speed * direction * 2;
      offset += delta * animationSpeed;
      
      // Keep offset in reasonable range to prevent floating point issues
      if (offset > 100) offset -= 100;
      if (offset < -100) offset += 100;
      
      // Store the updated offset
      offsetsRef.current.set(connectionId, offset);
      
      // Update the material uniform
      material.uniforms.dashOffset.value = offset;
    });
  });
  
  // Clean up offsets for unregistered lines periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      const animatedLines = useAnimationManagerStore.getState().animatedLines;
      const currentOffsets = offsetsRef.current;
      
      // Remove offsets for lines that are no longer registered
      currentOffsets.forEach((_, connectionId) => {
        if (!animatedLines.has(connectionId)) {
          currentOffsets.delete(connectionId);
        }
      });
    }, 5000); // Clean up every 5 seconds
    
    return () => clearInterval(cleanup);
  }, []);
  
  return null; // This component doesn't render anything
};

/**
 * Hook for registering an animated line with the global manager
 * Use this instead of useFrame in AnimatedConnectionLine
 */
export const useAnimatedLine = (connectionId, materialRef, shouldAnimate, speed = 1, direction = 1) => {
  // Use getState() for store actions — avoids 3 subscriptions per animated connection
  
  // Register/unregister based on shouldAnimate
  useEffect(() => {
    if (shouldAnimate && connectionId && materialRef) {
      useAnimationManagerStore.getState().registerLine(connectionId, materialRef, speed, direction);
      
      return () => {
        useAnimationManagerStore.getState().unregisterLine(connectionId);
      };
    }
  }, [connectionId, shouldAnimate, materialRef, speed, direction]);
  
  // Update animation properties when they change
  useEffect(() => {
    if (shouldAnimate && connectionId) {
      useAnimationManagerStore.getState().updateLine(connectionId, { speed, direction });
    }
  }, [connectionId, shouldAnimate, speed, direction]);
};

/**
 * Hook to get animation manager stats (for debugging)
 */
export const useAnimationStats = () => {
  return useAnimationManagerStore((state) => ({
    count: state.animatedLines.size,
  }));
};

export default useAnimationManagerStore;
