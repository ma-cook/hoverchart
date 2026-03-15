import React, { useMemo } from 'react';
import * as THREE from 'three';

const WhitePlane = React.memo(() => {
  const planeWidth = 3000;
  const planeHeight = 3000;

  const planeGeometry = useMemo(
    () => <planeGeometry args={[planeWidth, planeHeight]} />,
    [planeWidth, planeHeight]
  );

  // Create a grid texture
  const gridTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // Set canvas size
    canvas.width = 256;
    canvas.height = 256;

    // Fill with white background
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    context.strokeStyle = '#cccccc';
    context.lineWidth = 2;

    const gridSize = 32; // Size of each grid square

    // Draw vertical lines
    for (let x = 0; x <= canvas.width; x += gridSize) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, canvas.height);
      context.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y <= canvas.height; y += gridSize) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(canvas.width, y);
      context.stroke();
    }

    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(50, 50); // Adjust repetition as needed

    return texture;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2.1, 0, 0]} position={[0, 10, 0]}>
      {planeGeometry}
      <meshBasicMaterial map={gridTexture} transparent={false} />
    </mesh>
  );
});

export default WhitePlane;
