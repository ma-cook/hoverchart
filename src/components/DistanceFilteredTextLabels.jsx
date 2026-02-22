import React, { useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import AtlasTextSprite from './AtlasTextSprite';

/**
 * PERFORMANCE: Filters text labels based on camera distance.
 * Renders ALL labels immediately with correct positions, then toggles
 * visibility per-label via group.visible (imperative, no React state).
 *
 * BUGFIX: The previous implementation used useState inside useFrame to
 * track visibleLabels. This caused a 1+ frame delay between label data
 * arriving and labels actually rendering — during progressive mounting
 * the delay meant some labels never appeared at the right position until
 * a manual zoom-in/out forced a re-render.
 *
 * The new approach mirrors DistanceFilteredConnectionText: ALL labels are
 * mounted in the React tree from the start (so positions are immediately
 * correct), and a single useFrame callback toggles group.visible based on
 * camera distance. No useState, no timing races.
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
  const groupRefsRef = useRef(new Map());
  const lastCheckRef = useRef(0);
  const maxDistanceSquared = maxDistance * maxDistance;

  // Ref callback to register/unregister group refs for each label
  const getRefCallback = useCallback((labelId) => {
    return (el) => {
      if (el) {
        groupRefsRef.current.set(labelId, el);
      } else {
        groupRefsRef.current.delete(labelId);
      }
    };
  }, []);

  useFrame(({ camera }) => {
    // Throttle visibility checks to ~5 Hz (every 200ms)
    const now = Date.now();
    if (now - lastCheckRef.current < 200) return;
    lastCheckRef.current = now;

    const groups = groupRefsRef.current;
    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      const group = groups.get(label.id);
      if (!group || !label.position) continue;

      const dx = camera.position.x - label.position[0];
      const dy = camera.position.y - label.position[1];
      const dz = camera.position.z - label.position[2];
      const distanceSquared = dx * dx + dy * dy + dz * dz;

      group.visible = distanceSquared <= maxDistanceSquared;
    }
  });
  
  return (
    <>
      {labels.map(label => (
        <group key={`grp-${label.id}`} ref={getRefCallback(label.id)}>
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
        </group>
      ))}
    </>
  );
};

export default React.memo(DistanceFilteredTextLabels);
