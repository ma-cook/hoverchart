import React, { useState, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import AtlasTextSprite from './AtlasTextSprite';

/**
 * PERFORMANCE: Filters text labels based on camera distance.
 * Only renders text labels within the specified maxDistance.
 * Uses a single useFrame callback for all labels instead of one per label.
 * 
 * @param {Object} props
 * @param {Array} props.labels - Array of label objects with id, text, position, textStyle
 * @param {number} props.maxDistance - Maximum distance from camera to render labels (default 500)
 * @param {Function} props.onLabelClick - Click handler for labels
 */
const DistanceFilteredTextLabels = ({ 
  labels, 
  maxDistance = 500, 
  onLabelClick 
}) => {
  const [visibleLabels, setVisibleLabels] = useState([]);
  const lastCameraHashRef = useRef(null);
  const maxDistanceSquared = maxDistance * maxDistance;
  
  useFrame(({ camera }) => {
    // PERFORMANCE: Discretize camera position to reduce updates
    // Round to nearest 10 units to prevent updates on every tiny movement
    const cameraHash = `${Math.round(camera.position.x / 10)},${Math.round(camera.position.y / 10)},${Math.round(camera.position.z / 10)}`;
    
    if (cameraHash === lastCameraHashRef.current) {
      return; // Camera hasn't moved significantly
    }
    lastCameraHashRef.current = cameraHash;
    
    // Filter labels by distance
    const filtered = labels.filter(label => {
      if (!label.position) return false;
      
      // Calculate squared distance (avoid sqrt for performance)
      const dx = camera.position.x - label.position[0];
      const dy = camera.position.y - label.position[1];
      const dz = camera.position.z - label.position[2];
      const distanceSquared = dx * dx + dy * dy + dz * dz;
      
      return distanceSquared <= maxDistanceSquared;
    });
    
    // Only update state if the visible labels changed
    if (filtered.length !== visibleLabels.length || 
        filtered.some((label, i) => visibleLabels[i]?.id !== label.id)) {
      setVisibleLabels(filtered);
    }
  });
  
  return (
    <>
      {visibleLabels.map(label => (
        <AtlasTextSprite
          key={`text-${label.id}`}
          text={label.text}
          position={label.position}
          style={{
            fontSize: (label.textStyle?.fontSize || 1.5) * 10,
            color: label.textStyle?.color || 'black',
            underline: label.textStyle?.underline || false,
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (onLabelClick) {
              onLabelClick(e, label.id);
            }
          }}
          billboard={true}
          skipBillboardUpdates={true}
          renderOrder={20}
          scale={0.45}
        />
      ))}
    </>
  );
};

export default React.memo(DistanceFilteredTextLabels);
