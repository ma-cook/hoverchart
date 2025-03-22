import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

// Create a single instance of the loaders to be reused
const createLoaders = () => {
  // Create new manager with proper CORS handling
  const manager = new THREE.LoadingManager();
  manager.setURLModifier((url) => {
    // Log all URLs that are being loaded
    console.log('Loading resource from URL:', url);
    return url;
  });

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
  onUpdate,
  onMatrixChanged,
  checkPositionJitter,
}) => {
  const groupRef = useRef();
  const { id, position, rotation, scale, modelUrl } = obj;

  // State for the loaded model
  const [model, setModel] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingError, setLoadingError] = useState(null);

  // State for tracking transformations
  const [isDragging, setIsDragging] = useState(false);
  const startPositionRef = useRef(null);

  // Load model with error handling
  useEffect(() => {
    if (!modelUrl) {
      console.error('No model URL provided');
      return;
    }

    setLoadingError(null);
    setLoadingProgress(0);

    // Use the enhanced loader with DRACO support
    const loader = createLoaders();

    // Track if component is still mounted
    let isMounted = true;

    console.log(`Loading model from URL:`, modelUrl);

    // Add timestamps to URL to prevent caching issues
    const urlWithNoCache = `${modelUrl}${
      modelUrl.includes('?') ? '&' : '?'
    }_t=${Date.now()}`;

    // Load the model
    loader.load(
      urlWithNoCache,
      (gltf) => {
        if (!isMounted) return;

        console.log('Model loaded successfully', gltf);

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

                // Ensure materials get updated
                child.material.needsUpdate = true;
              }
            }
          });

          // Center the model if it's not centered already
          const box = new THREE.Box3().setFromObject(clonedScene);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());

          console.log('Model bounds:', {
            center: center.toArray(),
            size: size.toArray(),
          });

          // Adjust position to center if significantly off-center
          if (center.length() > 0.1) {
            clonedScene.position.sub(center);
            console.log('Centered model at:', center.toArray());
          }

          // Log the model after centering
          console.log('Model processed and centered', clonedScene);

          // Set the model in state
          setModel(clonedScene);
          setLoadingProgress(100);
        } catch (error) {
          console.error('Error processing model:', error);
          setLoadingError(`Error processing model: ${error.message}`);
        }
      },
      (progress) => {
        if (!isMounted) return;

        // Update loading progress
        if (progress.total > 0) {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          setLoadingProgress(percent);
          console.log(`Loading model: ${percent}%`);
        }
      },
      (error) => {
        if (!isMounted) return;

        console.error('Error loading model:', error);
        setLoadingError(`Failed to load model: ${error.message}`);
      }
    );

    // Clean up function
    return () => {
      isMounted = false;
    };
  }, [modelUrl]);

  // Add scene lighting specifically for this model
  useEffect(() => {
    if (!groupRef.current || !model) return;

    // Add a point light to the model to ensure it's visible
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(0, 5, 0);
    groupRef.current.add(pointLight);

    return () => {
      if (groupRef.current) {
        groupRef.current.remove(pointLight);
      }
    };
  }, [model]);

  // Update matrix on each frame
  useFrame(() => {
    if (groupRef.current && id) {
      // Update matrix
      groupRef.current.updateMatrixWorld();
      // Report matrix changes - only if id is defined
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
      position.x,
      position.y,
      position.z
    );
    onTranformStart && onTranformStart(id);
  };

  const handlePointerUp = (e) => {
    if (isDragging) {
      setIsDragging(false);
      onTransformEnd && onTransformEnd(id);
    }
  };

  return (
    <group
      ref={groupRef}
      position={[position.x, position.y, position.z]}
      rotation={[rotation?.x || 0, rotation?.y || 0, rotation?.z || 0]}
      scale={[scale.x, scale.y, scale.z]}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
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

      {/* Loading indicator */}
      {loadingProgress < 100 && !loadingError && (
        <group>
          <mesh>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial color="white" wireframe={true} />
          </mesh>
          <mesh position={[0, -2, 0]}>
            <boxGeometry args={[2, 0.2, 0.2]} />
            <meshBasicMaterial color="white" />
          </mesh>
        </group>
      )}

      {/* Error indicator */}
      {loadingError && (
        <group>
          <mesh>
            <boxGeometry args={[1.5, 1.5, 1.5]} />
            <meshBasicMaterial color="red" wireframe={true} />
          </mesh>
          <spotLight position={[0, 5, 0]} intensity={1} color="red" />
        </group>
      )}

      {/* Actual model with loader debug */}
      {model ? (
        <>
          <primitive object={model} />
          {/* Add a debug sphere to verify positioning */}
          <mesh visible={isSelected} position={[0, 0, 0]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshBasicMaterial color="yellow" />
          </mesh>
        </>
      ) : (
        // Show a placeholder while loading
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="gray" transparent opacity={0.5} />
        </mesh>
      )}

      {/* Debug helpers - only show when selected */}
      {isSelected && (
        <>
          {/* Axes helper to visualize orientation */}
          <axesHelper args={[3]} />
          {/* Grid helper to visualize ground plane */}
          <gridHelper args={[10, 10]} />
        </>
      )}
    </group>
  );
};

export default ModelObject;
