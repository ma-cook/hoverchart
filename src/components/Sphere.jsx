import React, { useRef } from 'react';
import { Line } from '@react-three/drei';
import ObjectUI from './ObjectUI';

const Sphere = ({ position, selected, onClick }) => {
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

  return (
    <group position={position}>
      <group ref={contentRef}>
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
            color={selected ? 'blue' : 'black'}
            lineWidth={1}
          />
        ))}
        {selected && (
          <ObjectUI position={[0, 10, 0]} followTarget={contentRef} />
        )}
      </group>
    </group>
  );
};

export default Sphere;
