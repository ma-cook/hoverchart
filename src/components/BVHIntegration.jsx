import { useEffect, memo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Component to integrate BVH raycasting with React Three Fiber's internal systems
 */
function BVHIntegration({ onObjectClick }) {
  const { raycaster, scene, gl, camera, size } = useThree();

  useEffect(() => {
    if (!raycaster || !window.bvhSystem || !gl || !camera) {
      return;
    }

    // Create our own mouse event handler that uses BVH
    const handleCanvasClick = (event) => {
      // Calculate mouse position in normalized device coordinates (-1 to +1)
      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      // Update the raycaster with mouse position and camera
      raycaster.setFromCamera(mouse, camera);

      // Use our BVH system for intersection testing
      if (window.bvhSystem) {
        try {
          const intersections = window.bvhSystem.intersectObjects(
            raycaster,
            true
          );

          // Filter valid intersections
          const validIntersections = intersections.filter(
            (i) => !isNaN(i.distance) && i.distance > 0
          );
          validIntersections.sort((a, b) => a.distance - b.distance);

          if (validIntersections.length > 0) {
            // Prevent default to use our BVH handling
            event.preventDefault();
            event.stopPropagation();

            // Handle the closest intersection
            const closest = validIntersections[0];

            // For virtual objects, we need to find the corresponding real Three.js object in the scene
            if (closest.object._isVirtualObject) {
              const virtualId = closest.object.id;

              // Call the object click handler directly with the virtual object ID
              if (onObjectClick) {
                onObjectClick(virtualId);
                return; // Successfully handled, don't fall back to normal events
              }
            } else {
              // Handle real Three.js objects

              if (closest.object.onClick) {
                closest.object.onClick(event);
                return; // Successfully handled
              } else if (
                closest.object.parent &&
                closest.object.parent.onClick
              ) {
                closest.object.parent.onClick(event);
                return; // Successfully handled
              }
            }
          }

          // If we get here, BVH didn't find valid intersections or couldn't handle them
        } catch (error) {
          console.warn('🎯 BVH click handling failed:', error);
        }
      }

      // Fall back to normal React Three Fiber event handling
      // Don't prevent default here - let R3F handle it normally
    };

    // Add our click interceptor to the canvas with high priority (capture phase)
    gl.domElement.addEventListener('click', handleCanvasClick, {
      capture: true,
    });

    // Also try adding to different event phases
    gl.domElement.addEventListener(
      'mousedown',

      { capture: true }
    );

    gl.domElement.addEventListener(
      'pointerdown',

      { capture: true }
    );

    // Cleanup function
    return () => {
      gl.domElement.removeEventListener('click', handleCanvasClick, {
        capture: true,
      });
      gl.domElement.removeEventListener('mousedown', () => {}, {
        capture: true,
      });
      gl.domElement.removeEventListener('pointerdown', () => {}, {
        capture: true,
      });
    };
  }, [raycaster, scene, gl, camera, size, onObjectClick]);

  // This component doesn't render anything
  return null;
}

export default memo(BVHIntegration);
