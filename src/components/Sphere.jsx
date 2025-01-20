import React, { useRef, useState, useEffect } from 'react';
import { Line } from '@react-three/drei';
import { TransformControls as DreiTransformControls } from '@react-three/drei';
import ObjectUI from './ObjectUI';
import TextSprite from './TextSprite';
import HeaderInput from './HeaderInput';
import ResizeArrows from './ResizeArrows';

const Sphere = ({ position, selected, onClick, onMove }) => {
  const [showTransform, setShowTransform] = useState(false);
  const [showHeader, setShowHeader] = useState(false);
  const [headerText, setHeaderText] = useState('');
  const [scale, setScale] = useState([1, 1, 1]);
  const [isResizing, setIsResizing] = useState(false);
  const contentRef = useRef();
  const points = React.useMemo(() => {
    const temp = [];
    // Create latitude lines
    for (let i = 0; i <= 5; i++) {
      const latitude = (Math.PI * i) / 5;
      const latitudePoints = [];
      for (let j = 0; j <= 36; j++) {
        const longitude = (2 * Math.PI * j) / 36;
        const x = 5 * Math.sin(latitude) * Math.cos(longitude);
        const y = 5 * Math.cos(latitude);
        const z = 5 * Math.sin(latitude) * Math.sin(longitude);
        latitudePoints.push([x, y, z]);
      }
      temp.push(latitudePoints);
    }

    // Create longitude lines
    for (let i = 0; i < 5; i++) {
      const longitude = (2 * Math.PI * i) / 5;
      const longitudePoints = [];
      for (let j = 0; j <= 18; j++) {
        const latitude = (Math.PI * j) / 18;
        const x = 5 * Math.sin(latitude) * Math.cos(longitude);
        const y = 5 * Math.cos(latitude);
        const z = 5 * Math.sin(latitude) * Math.sin(longitude);
        longitudePoints.push([x, y, z]);
      }
      temp.push(longitudePoints);
    }
    return temp;
  }, []);

  // Reset states when deselected
  useEffect(() => {
    if (!selected) {
      setShowTransform(false);
    }
  }, [selected]);

  // Store orbitControls when mounted
  useEffect(() => {
    if (contentRef.current && window.orbitControls) {
      contentRef.current.orbitControls = window.orbitControls;
    }
  }, []);

  const handleTransformToggle = () => {
    setShowTransform(!showTransform);
  };

  const handleHeaderToggle = () => {
    setShowHeader(!showHeader);
  };

  const handleHeaderSubmit = (text) => {
    setHeaderText(text);
    setShowHeader(false);
  };

  const handleResizeToggle = () => {
    setIsResizing(!isResizing);
  };

  const handleResize = (axis, delta) => {
    const axisIndex = { x: 0, y: 1, z: 2 }[axis];
    setScale((prevScale) => {
      const newScale = [...prevScale];
      newScale[axisIndex] = Math.max(newScale[axisIndex] + delta, 0.1);
      return newScale;
    });
  };

  const handleDrag = (newPosition) => {
    if (onMove) {
      onMove({
        x: newPosition.x,
        y: newPosition.y,
        z: newPosition.z,
      });
    }
  };

  // Calculate positions relative to sphere's scale
  const getUIPosition = () => {
    const sphereHeight = 10 * scale[1];
    const topEdgeOffset = sphereHeight / 2;
    return [position[0], position[1] + topEdgeOffset + 20, position[2]];
  };

  const getHeaderPosition = () => {
    const sphereHeight = 10 * scale[1];
    const topEdgeOffset = sphereHeight / 2;
    return [position[0], position[1] + topEdgeOffset + 15, position[2]];
  };

  return (
    <>
      <group position={position}>
        <group ref={contentRef} scale={scale}>
          <mesh
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <sphereGeometry args={[5, 32, 32]} />
            <meshBasicMaterial visible={false} />
          </mesh>
          {points.map((linePoints, idx) => (
            <Line
              key={idx}
              points={linePoints}
              color={selected ? 'blue' : 'white'}
              lineWidth={1}
            />
          ))}
        </group>

        {selected && !showHeader && (
          <ObjectUI
            position={getUIPosition()}
            onTransformToggle={handleTransformToggle}
            onHeaderToggle={handleHeaderToggle}
            onResizeToggle={handleResizeToggle}
            showTransform={showTransform}
            showHeader={showHeader}
            followTarget={contentRef}
          />
        )}

        {selected && showHeader && (
          <HeaderInput
            position={getHeaderPosition()}
            onTextSubmit={handleHeaderSubmit}
            followTarget={contentRef}
          />
        )}

        {headerText && (
          <TextSprite
            text={headerText}
            position={getHeaderPosition()}
            followTarget={contentRef}
          />
        )}

        {selected && isResizing && contentRef.current && (
          <ResizeArrows onResize={handleResize} object={contentRef.current} />
        )}
      </group>

      {selected && showTransform && contentRef.current && (
        <DreiTransformControls
          object={contentRef.current}
          onDrag={handleDrag}
          mode="translate"
          space="world"
          size={1}
          position={position}
        />
      )}
    </>
  );
};

export default Sphere;
