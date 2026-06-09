import React, { useRef, useEffect } from 'react';
import { Line } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

export function OrderHeader(props) {
  const groupRef = useRef();
  const { viewport } = useThree();

  // Set static position without animation
  useEffect(() => {
    if (groupRef.current) {
      // Static positioning - no animation
      // Make positioning responsive to screen size
      const isMobile = viewport.width < 5; // Adjust threshold as needed
      const positionX = isMobile ? -viewport.width / 3 : -viewport.width / 12.8;
      const positionY = viewport.height / 2.5;
      const scale = Math.max(3, Math.min(1.0, viewport.width / 2000));

      groupRef.current.position.set(positionX, positionY, -0);
      groupRef.current.scale.set(scale, scale, scale);
    }
  }, [viewport.width, viewport.height]);

  // Define wireframe letters for "VOLSCAPE"
  const letterSpacing = 12;
  const letterHeight = 10;
  const strokeWidth = 1;

  // Letter V
  const letterV = [
    [0, letterHeight, 0],
    [4, 0, 0],
    [4, 0, 0],
    [8, letterHeight, 0],
  ];

  // Letter O
  const letterO = [
    [0, 0, 0],
    [0, letterHeight, 0],
    [0, letterHeight, 0],
    [6, letterHeight, 0],
    [6, letterHeight, 0],
    [6, 0, 0],
    [6, 0, 0],
    [0, 0, 0],
  ];

  // Letter L
  const letterL = [
    [0, letterHeight, 0],
    [0, 0, 0],
    [0, 0, 0],
    [5, 0, 0],
  ];

  // Letter S
  const letterS = [
    [5, letterHeight, 0],
    [0, letterHeight, 0],
    [0, letterHeight, 0],
    [0, letterHeight / 2, 0],
    [0, letterHeight / 2, 0],
    [5, letterHeight / 2, 0],
    [5, letterHeight / 2, 0],
    [5, 0, 0],
    [5, 0, 0],
    [0, 0, 0],
  ];

  // Letter C
  const letterC = [
    [6, letterHeight, 0],
    [0, letterHeight, 0],
    [0, letterHeight, 0],
    [0, 0, 0],
    [0, 0, 0],
    [6, 0, 0],
  ];

  // Letter A
  const letterA = [
    [0, 0, 0],
    [0, letterHeight, 0],
    [0, letterHeight, 0],
    [6, letterHeight, 0],
    [6, letterHeight, 0],
    [6, 0, 0],
    [0, letterHeight / 2, 0],
    [6, letterHeight / 2, 0],
  ];

  // Letter P
  const letterP = [
    [0, 0, 0],
    [0, letterHeight, 0],
    [0, letterHeight, 0],
    [5, letterHeight, 0],
    [5, letterHeight, 0],
    [5, letterHeight / 2, 0],
    [5, letterHeight / 2, 0],
    [0, letterHeight / 2, 0],
  ];

  // Letter E
  const letterE = [
    [0, 0, 0],
    [0, letterHeight, 0],
    [0, letterHeight, 0],
    [5, letterHeight, 0],
    [0, letterHeight / 2, 0],
    [4, letterHeight / 2, 0],
    [0, 0, 0],
    [5, 0, 0],
  ];

  return (
    <group ref={groupRef} {...props}>
      {/* V */}
      <Line points={letterV} color="#333333" lineWidth={strokeWidth} />

      {/* O */}
      <group position={[letterSpacing * 1, 0, 0]}>
        <Line points={letterO} color="#333333" lineWidth={strokeWidth} />
      </group>

      {/* L */}
      <group position={[letterSpacing * 2, 0, 0]}>
        <Line points={letterL} color="#333333" lineWidth={strokeWidth} />
      </group>

      {/* S */}
      <group position={[letterSpacing * 3, 0, 0]}>
        <Line points={letterS} color="#333333" lineWidth={strokeWidth} />
      </group>

      {/* C */}
      <group position={[letterSpacing * 4, 0, 0]}>
        <Line points={letterC} color="#333333" lineWidth={strokeWidth} />
      </group>

      {/* A */}
      <group position={[letterSpacing * 5, 0, 0]}>
        <Line points={letterA} color="#333333" lineWidth={strokeWidth} />
      </group>

      {/* P */}
      <group position={[letterSpacing * 6, 0, 0]}>
        <Line points={letterP} color="#333333" lineWidth={strokeWidth} />
      </group>

      {/* E */}
      <group position={[letterSpacing * 7, 0, 0]}>
        <Line points={letterE} color="#333333" lineWidth={strokeWidth} />
      </group>
    </group>
  );
}
