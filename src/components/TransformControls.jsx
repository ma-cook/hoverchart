import { TransformControls as DreiTransform } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useRef } from 'react';

const TransformControls = ({ object, onDrag }) => {
  const { camera, gl, scene, invalidate } = useThree();
  const isDraggingRef = useRef(false);
  const lastPositionRef = useRef(null);
  const lastReportedTimeRef = useRef(0); // Track time of last position report

  if (!object) return null;

  return (
    <DreiTransform
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
      onChange={invalidate}
      onMouseDown={() => {
        const controls = scene.userData.controls;
        if (controls) controls.enabled = false;

        // Set dragging flag
        isDraggingRef.current = true;

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
