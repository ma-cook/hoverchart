import { TransformControls as DreiTransform } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useTransformControlsStore } from '../stores';

const TransformControls = ({ id, object, onDrag, scale }) => {
  const { camera, gl, scene, invalidate } = useThree();

  // Generate a unique ID if not provided
  const controlId = useMemo(() => {
    if (id) return id;
    // Generate ID from object properties if available
    if (object?.uuid) return `transform_${object.uuid}`;
    return `transform_${Math.random().toString(36).substr(2, 9)}`;
  }, [id, object?.uuid]);

  // Use transform controls store
  const getTransformControl = useTransformControlsStore(
    (state) => state.getTransformControl
  );
  const updateTransformControlProperty = useTransformControlsStore(
    (state) => state.updateTransformControlProperty
  );

  // Get store state
  const transformControl = getTransformControl(controlId);
  const {
    isInitialized,
    isDragging,
    lastPosition,
    lastReportedTime,
    appliedScale,
  } = transformControl;

  // Store setters
  const setIsInitialized = useCallback(
    (value) => {
      updateTransformControlProperty(controlId, 'isInitialized', value);
    },
    [controlId, updateTransformControlProperty]
  );

  const setIsDragging = useCallback(
    (value) => {
      updateTransformControlProperty(controlId, 'isDragging', value);
    },
    [controlId, updateTransformControlProperty]
  );

  const setLastPosition = useCallback(
    (value) => {
      updateTransformControlProperty(controlId, 'lastPosition', value);
    },
    [controlId, updateTransformControlProperty]
  );

  const setLastReportedTime = useCallback(
    (value) => {
      updateTransformControlProperty(controlId, 'lastReportedTime', value);
    },
    [controlId, updateTransformControlProperty]
  );

  const setAppliedScale = useCallback(
    (value) => {
      updateTransformControlProperty(controlId, 'appliedScale', value);
    },
    [controlId, updateTransformControlProperty]
  );

  // Refs for internal use
  const transformRef = useRef();

  // Super aggressive scale initialization
  useEffect(() => {
    if (!object || !scale) return;

    // Function to apply scale with validation
    const applyScale = () => {
      if (!object) return;

      // Check if object has stored scale from TextObject
      const storedScale = object?.userData?.scaleBeforeTransform || scale;

      // Always prefer userData scale if available (from TextObject)
      const targetScale = storedScale || scale; // Only apply if scale has changed
      if (
        !appliedScale ||
        appliedScale[0] !== targetScale[0] ||
        appliedScale[1] !== targetScale[1] ||
        appliedScale[2] !== targetScale[2]
      ) {
        // Apply the scale
        object.scale.set(targetScale[0], targetScale[1], targetScale[2]);
        setAppliedScale([...targetScale]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [object, scale, invalidate]);

  // Additional hook to initialize on first render
  useEffect(() => {
    if (!isInitialized && object && scale) {
      // Initialize on first render
      object.scale.set(scale[0], scale[1], scale[2]);
      setIsInitialized(true);
      setAppliedScale([...scale]);
      invalidate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        if (onDrag && e.target.object && isDragging) {
          const pos = e.target.object.position;

          // Throttle position updates during drag to reduce processing
          const now = Date.now();
          const minUpdateInterval = 50; // Only report position every 50ms during drag

          // Skip tiny movements and throttle updates by time
          if (lastPosition && now - lastReportedTime < minUpdateInterval) {
            return;
          }

          // Check if movement is significant enough to report
          if (lastPosition) {
            const lastPos = lastPosition;
            const epsilon = 0.001;
            const hasMoved =
              Math.abs(pos.x - lastPos.x) > epsilon ||
              Math.abs(pos.y - lastPos.y) > epsilon ||
              Math.abs(pos.z - lastPos.z) > epsilon;

            if (!hasMoved) return;
          }

          // Update position tracking
          setLastPosition({ x: pos.x, y: pos.y, z: pos.z });
          setLastReportedTime(now);

          // Pass the object position and drag state
          onDrag(
            pos,
            false, // Not start during drag
            false // Not end during drag
          );
          invalidate();
        }
      }}
      onChange={() => {
        // Always ensure correct scale at the beginning of transform
        if (scale && !isDragging) {
          const targetScale = object?.userData?.scaleBeforeTransform || scale;
          object.scale.set(targetScale[0], targetScale[1], targetScale[2]);
        }
        invalidate();
      }}
      onMouseDown={() => {
        const controls = scene.userData.controls;
        if (controls) controls.enabled = false;

        // Set dragging flag
        setIsDragging(true);

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
        if (isDragging && onDrag && object) {
          setIsDragging(false);
          setLastPosition(null);
          setLastReportedTime(0);
          onDrag(object.position, false, true); // isDragStart=false, isDragEnd=true
        }
      }}
    />
  );
};

export default TransformControls;
