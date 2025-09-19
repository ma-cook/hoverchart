import { useEffect, useRef } from 'react';

/**
 * Unified texture update utility using requestAnimationFrame with throttling
 * Replaces duplicate patterns in WebcamStream and ScreenShareStream
 *
 * @param {Object} options Configuration options
 * @param {boolean} options.active Whether the texture updating should be active
 * @param {React.RefObject} options.textureRef Reference to the Three.js texture
 * @param {React.RefObject} options.meshRef Reference to the mesh containing the texture
 * @param {number} options.throttleMs Throttling interval in milliseconds (default: 16ms for ~60fps)
 * @returns {void}
 */
export const useTextureUpdater = ({
  active,
  textureRef,
  meshRef,
  throttleMs = 16, // Default to ~60fps
}) => {
  const frameIdRef = useRef(null);

  useEffect(() => {
    if (!active || !textureRef || !meshRef) {
      return;
    }

    let lastUpdateTime = 0;

    const updateTexture = (currentTime) => {
      // Throttle updates based on configured interval
      if (currentTime - lastUpdateTime >= throttleMs) {
        if (
          textureRef.current &&
          meshRef.current?.material?.map === textureRef.current
        ) {
          textureRef.current.needsUpdate = true;
        }
        lastUpdateTime = currentTime;
      }

      // Continue the animation loop
      frameIdRef.current = requestAnimationFrame(updateTexture);
    };

    // Start the animation loop
    frameIdRef.current = requestAnimationFrame(updateTexture);

    // Cleanup function
    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      }
    };
  }, [active, textureRef, meshRef, throttleMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      }
    };
  }, []);
};

export default useTextureUpdater;
