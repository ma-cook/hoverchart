import React, { useRef, useState, useEffect } from 'react';
import { Line, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const CubeOutline = ({
  size = 1,
  color = 'white',
  position = [0, 0, 0],
  targetPosition = null,
  onAnimationComplete = () => {},
  visible = true,
  textLabel = '3D',
  isLastObject = false,
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
  const lineRef = useRef();

  // Define individual cube edges to prevent any diagonal connections
  const edges = [
    // Bottom face edges
    [
      [-size, -size, -size],
      [-size, -size, size],
    ], // front bottom edge
    [
      [-size, -size, size],
      [size, -size, size],
    ], // right bottom edge
    [
      [size, -size, size],
      [size, -size, -size],
    ], // back bottom edge
    [
      [size, -size, -size],
      [-size, -size, -size],
    ], // left bottom edge

    // Top face edges
    [
      [-size, size, -size],
      [-size, size, size],
    ], // front top edge
    [
      [-size, size, size],
      [size, size, size],
    ], // right top edge
    [
      [size, size, size],
      [size, size, -size],
    ], // back top edge
    [
      [size, size, -size],
      [-size, size, -size],
    ], // left top edge

    // Vertical edges
    [
      [-size, -size, -size],
      [-size, size, -size],
    ], // front-left vertical
    [
      [size, -size, -size],
      [size, size, -size],
    ], // back-left vertical
    [
      [-size, -size, size],
      [-size, size, size],
    ], // front-right vertical
    [
      [size, -size, size],
      [size, size, size],
    ], // back-right vertical
  ];

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
  }, [visible, onAnimationComplete]);

  // Animation logic using useFrame (only for fade effects)
  useFrame(() => {
    // Handle dissolve-in effect for the wireframe
    if (dissolveStartTimeRef.current && opacity < 1) {
      const dissolveElapsedTime =
        (Date.now() - dissolveStartTimeRef.current) / 1000;
      const dissolveDuration = 1.0; // 1 second to fade in

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
      const textDissolveDuration = 0.8; // 0.8 seconds to fade in text

      if (textDissolveElapsed < textDissolveDuration) {
        setTextOpacity(textDissolveElapsed / textDissolveDuration);
      } else {
        setTextOpacity(1);
      }
    }
  });

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
          position={[0, size * 2, 0]}
          fontSize={size * 1.0}
          color={color}
          anchorX="center"
          anchorY="middle"
          material-toneMapped={false}
          material-transparent={true}
          material-opacity={textOpacity}
          letterSpacing={0.1}
          font={undefined}
        >
          {textLabel}
        </Text>
      )}
    </group>
  );
};

export default CubeOutline;
