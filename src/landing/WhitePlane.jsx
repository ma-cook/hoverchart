import React, { useMemo } from 'react';
import * as THREE from 'three';

const vertexShader = `
  varying vec2 vWorldPos;
  varying float vViewDist;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xz;
    vec4 viewPos = modelViewMatrix * vec4(position, 1.0);
    vViewDist = length(viewPos.xyz);
    gl_Position = projectionMatrix * viewPos;
  }
`;

const fragmentShader = `
  varying vec2 vWorldPos;
  varying float vViewDist;

  float gridLine(float coord, float lineWidth) {
    float f = abs(fract(coord) - 0.5);
    float df = fwidth(coord);
    return 1.0 - smoothstep(lineWidth - df, lineWidth + df, f);
  }

  void main() {
    float cellSize = 60.0;
    float lineWidth = 0.04;

    float gx = gridLine(vWorldPos.x / cellSize, lineWidth);
    float gy = gridLine(vWorldPos.y / cellSize, lineWidth);
    float grid = clamp(gx + gy, 0.0, 1.0);

    // Fade: fade out near camera and far away
    float farFade  = 1.0 - smoothstep(400.0, 1200.0, vViewDist);
    float nearFade = smoothstep(60.0, 280.0, vViewDist);
    float fade = farFade * nearFade;

    vec3 lineColor = vec3(0.75, 0.75, 0.75);
    vec3 color = mix(vec3(1.0), lineColor, grid * fade);
    gl_FragColor = vec4(color, 1.0);
  }
`;

const WhitePlane = React.memo(() => {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: false,
        extensions: { derivatives: true },
      }),
    []
  );

  return (
    <mesh rotation={[-Math.PI / 2.1, 0, 0]} position={[0, 10, 0]}>
      <planeGeometry args={[3000, 3000, 1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
});

export default WhitePlane;

