import { Canvas } from '@react-three/fiber';

const GL_SETTINGS = {
  antialias: true,
  samples: 4,
  alpha: true,
  stencil: false,
  depth: true,
  logarithmicDepthBuffer: false,
  powerPreference: 'high-performance',
};

const SharedCanvas = ({ children, style, onPointerMissed }) => (
  <Canvas
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'white',
      ...style,
    }}
    gl={GL_SETTINGS}
    dpr={Math.min(window.devicePixelRatio, 2)}
    resize={{ scroll: false }}
    onPointerMissed={onPointerMissed}
  >
    {children}
  </Canvas>
);

export default SharedCanvas;
