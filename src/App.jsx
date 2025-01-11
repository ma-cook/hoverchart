import * as THREE from 'three';
import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
  Suspense,
  lazy,
} from 'react';
import './App.css';
import CustomCamera from './components/CustomCamera';
import WhitePlane from './components/WhitePlane';
import UIOverlay from './components/UIOverlay';
import { useFrame, Canvas } from '@react-three/fiber';
import Cube from './components/Cube';
import Sphere from './components/Sphere';

function App() {
  const [backgroundColor, setBackgroundColor] = useState('white');
  const [objects, setObjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const cameraRef = useRef();

  const handleCreateObject = (type) => {
    const camera = cameraRef.current;
    if (camera && camera.orbitControls) {
      // Get the actual PerspectiveCamera from OrbitControls
      const perspCamera = camera.orbitControls.object;
      const direction = new THREE.Vector3();
      const position = new THREE.Vector3();

      perspCamera.getWorldPosition(position);
      direction.set(0, 0, -1).applyQuaternion(perspCamera.quaternion);

      position.add(direction.multiplyScalar(50));

      setObjects([
        ...objects,
        {
          type,
          position: [position.x, position.y, position.z],
          id: Date.now(),
        },
      ]);
    }
  };

  const handleObjectClick = (id) => {
    console.log('Clicking object with id:', id);
    setSelectedId(id);
  };

  const handleObjectMove = useCallback((id, newPosition) => {
    setObjects((prev) =>
      prev.map((obj) =>
        obj.id === id
          ? {
              ...obj,
              position: [newPosition.x, newPosition.y, newPosition.z],
            }
          : obj
      )
    );
  }, []);

  return (
    <>
      <Canvas
        style={{
          background: backgroundColor,
          width: '100vw',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
        }}
        antialias="true"
        onPointerMissed={() => setSelectedId(null)}
      >
        <fog attach="fog" args={[backgroundColor, 200, 400]} />
        <CustomCamera ref={cameraRef} />
        <group onClick={(e) => e.stopPropagation()}>
          {objects.map((obj) => {
            if (obj.type === 'cube') {
              return (
                <Cube
                  key={obj.id}
                  position={obj.position}
                  selected={selectedId === obj.id}
                  onClick={() => handleObjectClick(obj.id)}
                  onMove={(newPosition) =>
                    handleObjectMove(obj.id, newPosition)
                  }
                />
              );
            }
            if (obj.type === 'sphere') {
              return <Sphere key={obj.id} position={obj.position} />;
            }
          })}
        </group>
      </Canvas>
      <UIOverlay onCreateObject={handleCreateObject} />
    </>
  );
}

export default App;
