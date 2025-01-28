import * as THREE from 'three';
import { useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei'; // Add this import
import './App.css';
import CustomCamera from './components/CustomCamera';
import UIOverlay from './components/UIOverlay';
import Cube from './components/Cube';
import Sphere from './components/Sphere';
import Plane from './components/Plane'; // Add this import

// New component to handle connection updates
const ConnectionUpdater = ({
  connections,
  setConnections,
  calculateFacePosition,
}) => {
  useFrame(() => {
    if (connections.length > 0) {
      setConnections((prev) =>
        prev.map((conn) => ({
          ...conn,
          start: {
            ...conn.start,
            position: calculateFacePosition(conn.start),
          },
          end: {
            ...conn.end,
            position: calculateFacePosition(conn.end),
          },
        }))
      );
    }
  });
  return null;
};

const App = () => {
  const [backgroundColor] = useState('black');
  const [objects, setObjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const cameraRef = useRef();

  const [showAllCubesIndicators, setShowAllCubesIndicators] = useState(false);
  const [activeIndicator, setActiveIndicator] = useState(null);
  const [indicatorMode, setIndicatorMode] = useState('none'); // 'none', 'single', 'all'
  const [connections, setConnections] = useState([]);
  const [selectedIndicators, setSelectedIndicators] = useState([]);

  // Add ref to store connection updates
  const connectionsRef = useRef(connections);
  connectionsRef.current = connections;

  const [activeTextStyleUI, setActiveTextStyleUI] = useState(null);

  useEffect(() => {
    // Once cameraRef is ready, store it in a global variable
    if (cameraRef.current?.orbitControls) {
      window.orbitControls = cameraRef.current.orbitControls;
    }
  }, []);

  // Add functions to disable and enable OrbitControls
  const disableOrbitControls = useCallback(() => {
    if (cameraRef.current?.orbitControls) {
      cameraRef.current.orbitControls.enabled = false;
    }
  }, []);

  const enableOrbitControls = useCallback(() => {
    if (cameraRef.current?.orbitControls) {
      cameraRef.current.orbitControls.enabled = true;
    }
  }, []);

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

    cameraPos.add(direction.multiplyScalar(75));

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

  // Helper function to calculate face position
  const calculateFacePosition = (indicator) => {
    const cube = indicator.cube;
    if (!cube) return [0, 0, 0];

    const worldPos = new THREE.Vector3();
    cube.getWorldPosition(worldPos);
    const worldScale = new THREE.Vector3();
    cube.getWorldScale(worldScale);

    // Get offset based on face name and apply world scale
    const getScaledOffset = (faceName) => {
      const baseScale = 5;
      switch (faceName) {
        case 'front':
          return [0, 0, baseScale * worldScale.z];
        case 'back':
          return [0, 0, -baseScale * worldScale.z];
        case 'top':
          return [0, baseScale * worldScale.y, 0];
        case 'bottom':
          return [0, -baseScale * worldScale.y, 0];
        case 'right':
          return [baseScale * worldScale.x, 0, 0];
        case 'left':
          return [-baseScale * worldScale.x, 0, 0];
        default:
          return [0, 0, 0];
      }
    };

    const offset = getScaledOffset(indicator.face);
    return [
      worldPos.x + offset[0],
      worldPos.y + offset[1],
      worldPos.z + offset[2],
    ];
  };

  // Update connection positions after cube moves
  const handleObjectMove = useCallback((id, newPosition) => {
    setObjects((prev) =>
      prev.map((obj) =>
        obj.id === id
          ? { ...obj, position: [newPosition.x, newPosition.y, newPosition.z] }
          : obj
      )
    );
  }, []);

  const handleFaceIndicatorClick = (indicator) => {
    if (selectedIndicators.length === 0) {
      // When first indicator is selected, show all indicators on all cubes
      setSelectedIndicators([indicator]);
      setShowAllCubesIndicators(true);
      setIndicatorMode('all');
    } else if (selectedIndicators.length === 1) {
      const startIndicator = selectedIndicators[0];

      // Create the connection
      const startPos = calculateFacePosition(startIndicator);
      const endPos = calculateFacePosition(indicator);

      setConnections((prev) => [
        ...prev,
        {
          start: { ...startIndicator, position: startPos },
          end: { ...indicator, position: endPos },
          id: Date.now(),
        },
      ]);

      // Reset selection state but keep connections visible
      setSelectedIndicators([]);
      setShowAllCubesIndicators(false);
      setIndicatorMode('connections');
    }
  };

  // Update handleFaceClick to not hide other indicators
  const handleFaceClick = (faceInfo) => {
    // When face is clicked, only highlight that face's indicator
    setIndicatorMode('single');
    setActiveIndicator(faceInfo);
    // Remove this line to keep indicators visible
    // setShowAllCubesIndicators(false);
  };

  const handleCanvasClick = (event) => {
    // Close TextStyleUI when clicking empty space
    if (!event.object) {
      setActiveTextStyleUI(null);
    }
    setSelectedId(null);
  };

  const handleToggleIndicators = (mode = 'all') => {
    if (mode === 'connection') {
      // Set up for connection mode
      setShowAllCubesIndicators(true);
      setIndicatorMode('indicators'); // Changed from 'all' to 'indicators'
      setSelectedId(null); // Deselect any selected cube
      setSelectedIndicators([]); // Clear any existing selections
    } else {
      setShowAllCubesIndicators((prev) => !prev);
      setIndicatorMode((prev) => (prev === 'all' ? 'none' : 'all'));
    }
  };

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
        onPointerMissed={handleCanvasClick} // Updated handler
      >
        <CustomCamera ref={cameraRef} />
        {/* Removed onClick handler to allow event propagation */}
        <group>
          <ConnectionUpdater
            connections={connections}
            setConnections={setConnections}
            calculateFacePosition={calculateFacePosition}
          />
          {/* Render connections */}
          {connections.map((connection) => (
            <Line
              key={connection.id}
              points={[connection.start.position, connection.end.position]}
              color="white"
              lineWidth={2}
            />
          ))}

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
                  disableOrbitControls={disableOrbitControls} // Pass disable function
                  enableOrbitControls={enableOrbitControls} // Pass enable function
                  onFaceIndicatorClick={handleFaceIndicatorClick}
                  onFaceClick={handleFaceClick}
                  showAllIndicators={showAllCubesIndicators}
                  activeIndicator={activeIndicator}
                  indicatorMode={indicatorMode}
                  connections={connections}
                  selectedIndicators={selectedIndicators}
                  activeTextStyleUI={activeTextStyleUI}
                  setActiveTextStyleUI={setActiveTextStyleUI}
                />
              );
            }
            if (obj.type === 'sphere') {
              return (
                <Sphere
                  key={obj.id}
                  position={obj.position}
                  selected={selectedId === obj.id}
                  onClick={() => handleObjectClick(obj.id)}
                />
              );
            }
            if (obj.type === 'plane') {
              return (
                <Plane
                  key={obj.id}
                  position={obj.position}
                  selected={selectedId === obj.id}
                  onClick={() => handleObjectClick(obj.id)}
                />
              );
            }
            return null; // Add a fallback to prevent undefined returns
          })}
        </group>
      </Canvas>
      <UIOverlay
        onCreateObject={handleCreateObject}
        onToggleIndicators={handleToggleIndicators}
      />
    </>
  );
};

export default App;
