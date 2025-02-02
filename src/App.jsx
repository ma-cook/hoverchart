import * as THREE from 'three';
import { useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import './App.css';
import CustomCamera from './components/CustomCamera';
import UIOverlay from './components/UIOverlay';
import Cube from './components/Cube';
import Sphere from './components/Sphere';
import Plane from './components/Plane';
import LineUI from './components/LineUI';

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
  const [indicatorMode, setIndicatorMode] = useState('none');
  const [connections, setConnections] = useState([]);
  const [selectedIndicators, setSelectedIndicators] = useState([]);

  const connectionsRef = useRef(connections);
  connectionsRef.current = connections;

  const [activeTextStyleUI, setActiveTextStyleUI] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);

  useEffect(() => {
    if (cameraRef.current?.orbitControls) {
      window.orbitControls = cameraRef.current.orbitControls;
    }
  }, []);

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

  const calculateFacePosition = (indicator) => {
    const cube = indicator.cube;
    if (!cube) return [0, 0, 0];

    const worldPos = new THREE.Vector3();
    cube.getWorldPosition(worldPos);
    const worldScale = new THREE.Vector3();
    cube.getWorldScale(worldScale);

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
      setSelectedIndicators([indicator]);
      setShowAllCubesIndicators(true);
      setIndicatorMode('all');
    } else if (selectedIndicators.length === 1) {
      const startIndicator = selectedIndicators[0];

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

      setSelectedIndicators([]);
      setShowAllCubesIndicators(false);
      setIndicatorMode('connections');
    }
  };

  const handleFaceClick = (faceInfo) => {
    setIndicatorMode('single');
    setActiveIndicator(faceInfo);
  };

  const handleCanvasClick = (event) => {
    if (!event.object) {
      setActiveTextStyleUI(null);
      setSelectedConnection(null);
    }
    setSelectedId(null);
  };

  const handleToggleIndicators = (mode = 'all') => {
    if (mode === 'connection') {
      setShowAllCubesIndicators(true);
      setIndicatorMode('indicators');
      setSelectedId(null);
      setSelectedIndicators([]);
    } else {
      setShowAllCubesIndicators((prev) => !prev);
      setIndicatorMode((prev) => (prev === 'all' ? 'none' : 'all'));
    }
  };

  const handleConnectionClick = (e, connectionId) => {
    e.stopPropagation();
    setSelectedConnection(connectionId);
    setSelectedId(null);
  };

  const calculateMidpoint = (start, end) => {
    return [
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2,
      (start[2] + end[2]) / 2,
    ];
  };

  const handleLineStyleChange = (connectionId, styleType) => {
    setConnections((prev) =>
      prev.map((conn) =>
        conn.id === connectionId ? { ...conn, lineStyle: styleType } : conn
      )
    );
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
        onPointerMissed={handleCanvasClick}
        gl={{
          antialias: true,
          alpha: true,
          stencil: true,
          depth: true,
          logarithmicDepthBuffer: true,
        }}
        dpr={[1, 2]} // Set minimum and maximum pixel ratio
      >
        <CustomCamera ref={cameraRef} />
        <group>
          <ConnectionUpdater
            connections={connections}
            setConnections={setConnections}
            calculateFacePosition={calculateFacePosition}
          />
          {connections.map((connection) => {
            const midpoint = calculateMidpoint(
              connection.start.position,
              connection.end.position
            );

            return (
              <group key={connection.id}>
                <Line
                  points={[connection.start.position, connection.end.position]}
                  color={
                    selectedConnection === connection.id ? '#ffff00' : 'white'
                  }
                  lineWidth={selectedConnection === connection.id ? 4 : 2}
                  dashed={
                    connection.lineStyle === 'dashed' ||
                    connection.lineStyle === 'dotted'
                  }
                  // Increased dash spacing for dashed lines
                  dashScale={connection.lineStyle === 'dotted' ? 2 : 1}
                  dashSize={connection.lineStyle === 'dotted' ? 0.1 : 4}
                  gapSize={connection.lineStyle === 'dotted' ? 1 : 10}
                />
                <Line
                  points={[connection.start.position, connection.end.position]}
                  color="white"
                  lineWidth={20}
                  onClick={(e) => handleConnectionClick(e, connection.id)}
                  onPointerOver={(e) => {
                    e.stopPropagation();
                    document.body.style.cursor = 'pointer';
                  }}
                  onPointerOut={(e) => {
                    e.stopPropagation();
                    document.body.style.cursor = 'auto';
                  }}
                  transparent
                  opacity={0}
                />
                {selectedConnection === connection.id && (
                  <LineUI
                    position={midpoint}
                    onColorChange={(color) => {
                      console.log('Color changed to:', color);
                    }}
                    onToggleDashed={(styleType) => {
                      handleLineStyleChange(connection.id, styleType);
                    }}
                    onTextClick={() => {
                      console.log('Text clicked');
                    }}
                  />
                )}
              </group>
            );
          })}

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
                  disableOrbitControls={disableOrbitControls}
                  enableOrbitControls={enableOrbitControls}
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
            return null;
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
