import { ArrowHelper } from 'three';
import { extend } from '@react-three/fiber';
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

// Extend will make ArrowHelper available as a JSX primitive
extend({ ArrowHelper });

const ResizeArrows = ({
  onResize,
  disableOrbitControls,
  enableOrbitControls,
}) => {
  const arrowRefs = {
    x: useRef(),
    y: useRef(),
    z: useRef(),
  };

  const [draggingAxis, setDraggingAxis] = useState(null); // null or 'x', 'y', 'z'

  const handlePointerDown = (axis, event) => {
    event.stopPropagation();

    /* Check if preventDefault exists before calling it */
    if (typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    disableOrbitControls?.();
    setDraggingAxis(axis);

    /* Capture the pointer to ensure all events are handled by the arrow */
    if (event.target && typeof event.target.setPointerCapture === 'function') {
      event.target.setPointerCapture(event.pointerId);
    }
  };

  const handlePointerMove = (axis, event) => {
    // Only resize if draggingAxis matches the current axis
    if (draggingAxis !== axis) return;

    event.stopPropagation();

    /* Check if preventDefault exists before calling it */
    if (typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    const delta = event.movementX || event.movementY || 0;
    const resizeAmount = delta * 0.01; // Adjust sensitivity as needed
    onResize(axis, resizeAmount);
  };

  const handlePointerUp = (axis, event) => {
    // Only handle if the current axis is being dragged
    if (draggingAxis !== axis) return;

    event.stopPropagation();

    /* Check if preventDefault exists before calling it */
    if (typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    setDraggingAxis(null);
    enableOrbitControls?.();

    /* Release the pointer capture */
    if (
      event.target &&
      typeof event.target.releasePointerCapture === 'function'
    ) {
      event.target.releasePointerCapture(event.pointerId);
    }
  };

  /* Add a global pointerup listener to reset draggingAxis */
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (draggingAxis !== null) {
        setDraggingAxis(null);
        enableOrbitControls?.();
      }
    };

    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [draggingAxis, enableOrbitControls]);

  return (
    <>
      {/* X Axis Arrow */}
      <arrowHelper
        ref={arrowRefs.x}
        args={[
          new THREE.Vector3(1, 0, 0), // Direction vector for X-axis
          new THREE.Vector3(0, 0, 0), // Origin
          10, // Length
          new THREE.Color('red'), // Color
        ]}
        onPointerDown={(e) => handlePointerDown('x', e)}
        onPointerMove={(e) => handlePointerMove('x', e)}
        onPointerUp={(e) => handlePointerUp('x', e)}
        cursor="pointer"
        // Enable pointer events
        pointerEvents="auto"
      />
      {/* Y Axis Arrow */}
      <arrowHelper
        ref={arrowRefs.y}
        args={[
          new THREE.Vector3(0, 1, 0), // Direction vector for Y-axis
          new THREE.Vector3(0, 0, 0), // Origin
          10, // Length
          new THREE.Color('green'), // Color
        ]}
        onPointerDown={(e) => handlePointerDown('y', e)}
        onPointerMove={(e) => handlePointerMove('y', e)}
        onPointerUp={(e) => handlePointerUp('y', e)}
        cursor="pointer"
        pointerEvents="auto"
      />
      {/* Z Axis Arrow */}
      <arrowHelper
        ref={arrowRefs.z}
        args={[
          new THREE.Vector3(0, 0, 1), // Direction vector for Z-axis
          new THREE.Vector3(0, 0, 0), // Origin
          10, // Length
          new THREE.Color('blue'), // Color
        ]}
        onPointerDown={(e) => handlePointerDown('z', e)}
        onPointerMove={(e) => handlePointerMove('z', e)}
        onPointerUp={(e) => handlePointerUp('z', e)}
        cursor="pointer"
        pointerEvents="auto"
      />
    </>
  );
};

export default ResizeArrows;
