import { Canvas } from '@react-three/fiber';

import * as THREE from 'three';

const GL_SETTINGS = {
  antialias: true,
  samples: 4,
  alpha: true,
  stencil: false,
  depth: true,
  logarithmicDepthBuffer: false,
  powerPreference: 'high-performance',
  toneMapping: THREE.ACESFilmicToneMapping,
  toneMappingExposure: 1.0,
};

const SharedCanvas = ({ children, style, onPointerMissed }) => (
  <Canvas
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: '#f0f2f5',
      ...style,
    }}
    gl={GL_SETTINGS}
    dpr={Math.min(window.devicePixelRatio, 2)}
    resize={{ scroll: false }}
    frameloop="demand"
    onPointerMissed={onPointerMissed}
  >
    {children}
  </Canvas>
);

export default SharedCanvas;
