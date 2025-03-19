import { TransformControls as DreiTransform } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useRef, useEffect, useState } from 'react';

const TransformControls = ({ object, onDrag, scale }) => {
  const { camera, gl, scene, invalidate } = useThree();
  const isDraggingRef = useRef(false);
  const lastPositionRef = useRef(null);
  const lastReportedTimeRef = useRef(0);
  const transformRef = useRef();
  const [isInitialized, setIsInitialized] = useState(false);
  const appliedScaleRef = useRef(null);

  // Super aggressive scale initialization
  useEffect(() => {
    if (!object || !scale) return;

    // Function to apply scale with validation
    const applyScale = () => {
      if (!object) return;

      // Check if object has stored scale from TextObject
      const storedScale = object?.userData?.scaleBeforeTransform || scale;

      // Always prefer userData scale if available (from TextObject)
      const targetScale = storedScale || scale;

      // Only apply if scale has changed
      if (
        !appliedScaleRef.current ||
        appliedScaleRef.current[0] !== targetScale[0] ||
        appliedScaleRef.current[1] !== targetScale[1] ||
        appliedScaleRef.current[2] !== targetScale[2]
      ) {
        // Apply the scale
        object.scale.set(targetScale[0], targetScale[1], targetScale[2]);
        appliedScaleRef.current = [...targetScale];
        invalidate();
      }
    };

    // Apply scale immediately
    applyScale();

    // And after a delay to ensure it's applied after React rendering
    const t1 = setTimeout(applyScale, 0);
    const t2 = setTimeout(applyScale, 50);
    const t3 = setTimeout(applyScale, 100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [object, scale, invalidate]);

  // Additional hook to initialize on first render
  useEffect(() => {
    if (!isInitialized && object && scale) {
      // Initialize on first render
      object.scale.set(scale[0], scale[1], scale[2]);
      setIsInitialized(true);
      appliedScaleRef.current = [...scale];
      invalidate();
    }
  }, [isInitialized, object, scale, invalidate]);

  if (!object) return null;

  return (
    <DreiTransform
      ref={transformRef}
      object={object}
      camera={camera}
      domElement={gl.domElement}
      mode="translate"
      space="world"
      size={1}
      onObjectChange={(e) => {
        if (onDrag && e.target.object && isDraggingRef.current) {
          const pos = e.target.object.position;

          // Throttle position updates during drag to reduce processing
          const now = Date.now();
          const minUpdateInterval = 50; // Only report position every 50ms during drag

          // Skip tiny movements and throttle updates by time
          if (
            lastPositionRef.current &&
            now - lastReportedTimeRef.current < minUpdateInterval
          ) {
            return;
          }

          // Check if movement is significant enough to report
          if (lastPositionRef.current) {
            const lastPos = lastPositionRef.current;
            const epsilon = 0.001;
            const hasMoved =
              Math.abs(pos.x - lastPos.x) > epsilon ||
              Math.abs(pos.y - lastPos.y) > epsilon ||
              Math.abs(pos.z - lastPos.z) > epsilon;

            if (!hasMoved) return;
          }

          // Update position tracking
          lastPositionRef.current = { x: pos.x, y: pos.y, z: pos.z };
          lastReportedTimeRef.current = now;

          // Pass the object position and drag state
          onDrag(
            pos,
            false, // Not start during drag
            false // Not end during drag
          );
          invalidate();
        }
      }}
      onChange={(e) => {
        // Always ensure correct scale at the beginning of transform
        if (scale && !isDraggingRef.current) {
          const targetScale = object?.userData?.scaleBeforeTransform || scale;
          object.scale.set(targetScale[0], targetScale[1], targetScale[2]);
        }
        invalidate();
      }}
      onMouseDown={() => {
        const controls = scene.userData.controls;
        if (controls) controls.enabled = false;

        // Set dragging flag
        isDraggingRef.current = true;

        // Final chance to set scale correctly before drag starts
        if (object && scale) {
          const targetScale = object?.userData?.scaleBeforeTransform || scale;
          object.scale.set(targetScale[0], targetScale[1], targetScale[2]);
          invalidate();
        }

        // Notify start of drag operation
        if (onDrag && object) {
          onDrag(object.position, true, false); // isDragStart=true, isDragEnd=false
        }
      }}
      onMouseUp={() => {
        const controls = scene.userData.controls;
        if (controls) controls.enabled = true;

        // Reset dragging flag and notify end of drag
        if (isDraggingRef.current && onDrag && object) {
          isDraggingRef.current = false;
          lastPositionRef.current = null;
          lastReportedTimeRef.current = 0;
          onDrag(object.position, false, true); // isDragStart=false, isDragEnd=true
        }
      }}
    />
  );
};

export default TransformControls;
