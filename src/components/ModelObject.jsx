import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

// Create a single instance of the loaders to be reused
const createLoaders = () => {
  const manager = new THREE.LoadingManager();
  const gltfLoader = new GLTFLoader(manager);
  const dracoLoader = new DRACOLoader(manager);
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
  gltfLoader.setDRACOLoader(dracoLoader);

  return gltfLoader;
};

const ModelObject = ({
  obj,
  isSelected,
  onClick,
  onTranformStart,
  onTransformEnd,
  onMatrixChanged,
}) => {
  const groupRef = useRef();
  const { id, position, rotation, scale, modelUrl } = obj;
  // State for the loaded model
  const [model, setModel] = useState(null);

  // State for tracking transformations
  const [isDragging, setIsDragging] = useState(false);
  const startPositionRef = useRef(null); // Load model with error handling
  useEffect(() => {
    if (!modelUrl) {
      return;
    }

    const loader = createLoaders();
    let isMounted = true;

    // Add timestamps to URL to prevent caching issues
    const urlWithNoCache = `${modelUrl}${
      modelUrl.includes('?') ? '&' : '?'
    }_t=${Date.now()}`;

    loader.load(
      urlWithNoCache,
      (gltf) => {
        if (!isMounted) return;

        try {
          // Clone the scene to avoid sharing the same mesh across instances
          const clonedScene = gltf.scene.clone();

          // Traverse the model to enable shadows and fix materials
          clonedScene.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;

              // Ensure materials are properly configured
              if (child.material) {
                // Force materials to be properly lit
                if (child.material.isMeshStandardMaterial) {
                  child.material.roughness = 0.7;
                  child.material.metalness = 0.3;
                  child.material.envMapIntensity = 1.0;
                }

                // Make sure material side is set correctly
                child.material.side = THREE.DoubleSide;

                // Fix transparency
                if (child.material.transparent) {
                  child.material.alphaTest = 0.1;
                }

                child.material.needsUpdate = true;
              }
            }
          });

          // Center the model if it's not centered already
          const box = new THREE.Box3().setFromObject(clonedScene);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());

          // Adjust position to center if significantly off-center
          if (center.length() > 0.1) {
            clonedScene.position.sub(center);
          }

          // Auto-scale the model to a reasonable size
          const maxDimension = Math.max(size.x, size.y, size.z);
          if (maxDimension > 0) {
            const desiredSize = 10; // Target size of 10 units
            const scaleFactor = desiredSize / maxDimension;
            clonedScene.scale.setScalar(scaleFactor);
          }
          setModel(clonedScene);
        } catch {
          // Silently fail - model just won't appear
        }
      },
      () => {
        // Progress tracking removed
      },
      () => {
        // Silently fail - model just won't appear
      }
    );

    return () => {
      isMounted = false;
    };
  }, [modelUrl]);

  // Update matrix on each frame
  useFrame(() => {
    if (groupRef.current && id) {
      // Update matrix
      groupRef.current.updateMatrixWorld();
      // Report matrix changes
      onMatrixChanged && onMatrixChanged(id, groupRef.current.matrixWorld);
    }
  });

  // Handle click
  const handleClick = (e) => {
    e.stopPropagation();
    onClick && onClick(id);
  };
  // Setup drag handlers
  const handlePointerDown = (e) => {
    e.stopPropagation();
    setIsDragging(true);
    startPositionRef.current = new THREE.Vector3(
      position[0],
      position[1],
      position[2]
    );
    onTranformStart && onTranformStart(id);
  };
  const handlePointerUp = () => {
    if (isDragging) {
      setIsDragging(false);
      onTransformEnd && onTransformEnd(id);
    }
  };
  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation || [0, 0, 0]}
      scale={scale}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {' '}
      {/* Selection indicator */}
      {isSelected && (
        <mesh>
          <boxGeometry args={[2.2, 2.2, 2.2]} />
          <meshBasicMaterial
            color="skyblue"
            transparent={true}
            opacity={0.3}
            wireframe={true}
          />
        </mesh>
      )}
      {/* Actual model */}
      {model && <primitive object={model} />}
    </group>
  );
};

export default ModelObject;
