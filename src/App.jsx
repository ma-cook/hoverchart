import * as THREE from 'three';
import { useRef, useState, useCallback } from 'react';
import './App.css';
import CustomCamera from './components/CustomCamera';
import UIOverlay from './components/UIOverlay';
import { Canvas } from '@react-three/fiber';
import Cube from './components/Cube';
import Sphere from './components/Sphere';

function App() {
  const [backgroundColor] = useState('white');
  const [objects, setObjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const cameraRef = useRef();

  const handleCreateObject = (type) => {
    // Ensure cameraRef.current and cameraRef.current.camera are defined
    if (!cameraRef.current || !cameraRef.current.camera) {
      console.warn('Camera ref or camera object not ready; aborting.');
      return;
    }

    const cameraPos = cameraRef.current.camera.position.clone();
    const euler = new THREE.Euler().setFromQuaternion(
      cameraRef.current.camera.quaternion
    );
    const direction = new THREE.Vector3(0, 0, -1).applyEuler(euler);

    cameraPos.add(direction.multiplyScalar(50));

    setObjects((prevObjects) => [
      ...prevObjects,
      {
        type,
        position: [cameraPos.x, cameraPos.y, cameraPos.z],
        id: Date.now(),
      },
    ]);
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
        {/* Removed onClick handler to allow event propagation */}
        <group>
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
            return null; // Add a fallback to prevent undefined returns
          })}
        </group>
      </Canvas>
      <UIOverlay onCreateObject={handleCreateObject} />
    </>
  );
}

export default App;
