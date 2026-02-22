import React from 'react';
import InstancedAtlasText from './InstancedAtlasText';

/**
 * PERFORMANCE: Renders connection text labels using InstancedMesh.
 *
 * Previous implementation mounted one AtlasTextSprite (= one Mesh) per label,
 * leading to ~1000 individual draw calls and 1000 useFrame callbacks for large
 * diagrams.  Switching to InstancedAtlasText collapses all labels sharing
 * the same atlas page into a SINGLE InstancedMesh draw call.
 *
 * Billboard orientation and distance-based visibility are handled inside the
 * instanced renderer at ~10 Hz, which is indistinguishable from 60 Hz for
 * slowly-rotating text labels.
 *
 * @param {Object}   props
 * @param {Array}    props.labels      - Array of { id, text, position, textStyle }
 * @param {number}   props.maxDistance  - Max camera distance (default 500)
 * @param {Function} props.onLabelClick - Click handler
 */
const DistanceFilteredTextLabels = ({
  labels,
  maxDistance = 500,
  onLabelClick,
}) => {
  return (
    <InstancedAtlasText
      labels={labels}
      maxDistance={maxDistance}
      onLabelClick={onLabelClick}
      renderOrder={20}
      scale={0.45}
    />
  );
};

export default React.memo(DistanceFilteredTextLabels);
