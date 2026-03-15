import React, { useRef, useState, useEffect } from 'react';
import { Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

const DodecahedronWireframe2 = ({
  size = 10,
  color = 'white',
  position = [0, 0, 0],
  targetPosition = null,
  visible = true,
  onAnimationComplete = () => {},
}) => {
  const groupRef = useRef();
  // Use targetPosition if provided, otherwise use initial position
  const finalPosition = targetPosition || position;
  const [showText, setShowText] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const [textOpacity, setTextOpacity] = useState(0);
  const dissolveStartTimeRef = useRef(null);
  const textDissolveStartTimeRef = useRef(null);
  const animationCompletedRef = useRef(false);

  // Initialize fade-in effect when component becomes visible
  useEffect(() => {
    if (visible) {
      // Start with zero opacity and begin fade-in
      setOpacity(0);
      dissolveStartTimeRef.current = Date.now();

      // Show text immediately and start its fade-in
      setShowText(true);
      textDissolveStartTimeRef.current = Date.now();

      // Call animation complete callback immediately
      if (!animationCompletedRef.current) {
        animationCompletedRef.current = true;
        onAnimationComplete();
      }
    }
  }, [visible]);

  // Generate individual edge lines for a dodecahedron wireframe
  const generateDodecahedronEdges = () => {
    // Create a dodecahedron geometry
    const geometry = new THREE.DodecahedronGeometry(size);

    // Use a much higher threshold to only get the most prominent structural edges
    const edges = new THREE.EdgesGeometry(geometry, 60); // Very high threshold
    const edgeLines = [];

    // Extract the positions of the vertices for each edge as separate line segments
    for (let i = 0; i < edges.attributes.position.count; i += 2) {
      const x1 = edges.attributes.position.array[i * 3];
      const y1 = edges.attributes.position.array[i * 3 + 1];
      const z1 = edges.attributes.position.array[i * 3 + 2];

      const x2 = edges.attributes.position.array[(i + 1) * 3];
      const y2 = edges.attributes.position.array[(i + 1) * 3 + 1];
      const z2 = edges.attributes.position.array[(i + 1) * 3 + 2];

      // Store each edge as a separate line segment
      edgeLines.push([
        [x1, y1, z1],
        [x2, y2, z2],
      ]);
    }

    return edgeLines;
  };

  // Animation logic using useFrame (only for fade effects)
  useFrame(() => {
    // Handle dissolve-in effect for the wireframe
    if (dissolveStartTimeRef.current && opacity < 1) {
      const dissolveElapsedTime =
        (Date.now() - dissolveStartTimeRef.current) / 1000;
      const dissolveDuration = 0.5; // 0.5 seconds to fade in

      if (dissolveElapsedTime < dissolveDuration) {
        setOpacity(dissolveElapsedTime / dissolveDuration);
      } else {
        setOpacity(1);
      }
    }

    // Handle text dissolve-in effect
    if (showText && textDissolveStartTimeRef.current && textOpacity < 1) {
      const textDissolveElapsed =
        (Date.now() - textDissolveStartTimeRef.current) / 1000;
      const textDissolveDuration = 0.5; // 0.5 seconds to fade in text

      if (textDissolveElapsed < textDissolveDuration) {
        setTextOpacity(textDissolveElapsed / textDissolveDuration);
      } else {
        setTextOpacity(1);
      }
    }
  });

  const edges = generateDodecahedronEdges();

  if (!visible) return null;

  return (
    <group ref={groupRef} position={finalPosition}>
      {/* Render each edge as a separate Line to prevent diagonal connections */}
      {edges.map((edge, index) => (
        <Line
          key={index}
          points={edge}
          color={color}
          lineWidth={1}
          dashed={false}
          transparent={true}
          opacity={opacity}
        />
      ))}

      {/* Text that appears when animation completes with fade-in */}
      {showText && (
        <Text
          position={[0, size * 1.5, 0]} // Position above the dodecahedron
          fontSize={size * 0.5}
          color={color}
          anchorX="center"
          anchorY="middle"
          material-toneMapped={false}
          material-transparent={true}
          material-opacity={textOpacity}
          letterSpacing={0.1}
          font={undefined} // Use default font
        >
          Collaborate
        </Text>
      )}
    </group>
  );
};

export default DodecahedronWireframe2;
