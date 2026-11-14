import { Canvas } from '@react-three/fiber';

import * as THREE from 'three';
import useRenderQualityStore from '../stores/renderQualityStore';

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

const SharedCanvas = ({ children, style, onPointerMissed }) => {
  const dpr = useRenderQualityStore((state) => state.dpr);

  return (
    <Canvas
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'var(--canvas-bg)',
        ...style,
      }}
      gl={GL_SETTINGS}
      dpr={dpr}
      resize={{ scroll: false }}
      frameloop="demand"
      onPointerMissed={onPointerMissed}
    >
      {children}
    </Canvas>
  );
};

export default SharedCanvas;
