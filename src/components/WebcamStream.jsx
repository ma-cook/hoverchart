import { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';

const WebcamStream = ({ meshRef, active }) => {
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef(null);
  const textureRef = useRef(null);
  const streamRef = useRef(null);

  // Set up the webcam stream initially
  useEffect(() => {
    if (!active || !meshRef.current) return;

    // Create video element
    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    video.style.display = 'none'; // Hide video element but keep it in DOM for iOS
    document.body.appendChild(video); // Add to DOM to ensure proper playback
    videoRef.current = video;

    console.log('Attempting to access webcam...');

    // Start webcam stream with explicit constraints for better compatibility
    navigator.mediaDevices
      .getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: true, // Audio is explicitly disabled here
      })
      .then((stream) => {
        console.log('Webcam access granted', stream);
        video.srcObject = stream;
        streamRef.current = stream;

        // Use a promise to ensure video is actually playing before creating texture
        const playPromise = video.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Video is playing, creating texture');

              // Create video texture with corrected format
              const texture = new THREE.VideoTexture(video);
              texture.minFilter = THREE.LinearFilter;
              texture.magFilter = THREE.LinearFilter;
              texture.format = THREE.RGBAFormat;
              texture.colorSpace = THREE.SRGBColorSpace;

              // Important: explicitly set these properties for better compatibility
              texture.generateMipmaps = false;
              texture.wrapS = THREE.ClampToEdgeWrapping;
              texture.wrapT = THREE.ClampToEdgeWrapping;

              textureRef.current = texture;

              // Apply texture to plane material
              if (meshRef.current) {
                const material = meshRef.current.material;

                // Clone the material to avoid shared state issues
                const newMaterial = material.clone();
                newMaterial.map = texture;
                newMaterial.transparent = true;
                newMaterial.opacity = 1;
                newMaterial.depthWrite = true;
                newMaterial.needsUpdate = true;

                // Apply the new material
                meshRef.current.material = newMaterial;
                console.log('Texture applied to material', newMaterial);
              }
            })
            .catch((error) => {
              console.error('Error starting video playback:', error);
              setHasError(true);
            });
        }
      })
      .catch((error) => {
        console.error('Error accessing webcam:', error);
        setHasError(true);
      });

    // Cleanup function
    return () => {
      console.log('Cleaning up webcam resources');

      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach((track) => {
          console.log('Stopping track:', track.kind);
          track.stop();
        });
        streamRef.current = null;
      }

      if (meshRef.current && meshRef.current.material) {
        if (meshRef.current.material.map) {
          console.log('Disposing texture');
          meshRef.current.material.map.dispose();
          meshRef.current.material.map = null;
          meshRef.current.material.needsUpdate = true;
        }
      }

      if (textureRef.current) {
        console.log('Disposing texture reference');
        textureRef.current.dispose();
        textureRef.current = null;
      }

      if (videoRef.current) {
        console.log('Cleaning up video element');
        if (videoRef.current.srcObject) {
          videoRef.current.srcObject = null;
        }
        if (document.body.contains(videoRef.current)) {
          document.body.removeChild(videoRef.current);
        }
        videoRef.current = null;
      }
    };
  }, [active, meshRef]);

  // This effect ensures the texture stays applied during rerenders
  useEffect(() => {
    if (active && textureRef.current && meshRef.current) {
      // Check if the material lost its texture and reapply if needed
      const material = meshRef.current.material;
      if (!material.map || material.map !== textureRef.current) {
        console.log('Reapplying texture to material');
        material.map = textureRef.current;
        material.transparent = true;
        material.opacity = 1;
        material.depthWrite = true;
        material.needsUpdate = true;
      }
    }
  });

  // Add animation frame to keep texture updating
  useEffect(() => {
    if (!active || !textureRef.current) return;

    let frameId;
    const updateTexture = () => {
      if (
        textureRef.current &&
        meshRef.current?.material?.map === textureRef.current
      ) {
        textureRef.current.needsUpdate = true;
      }
      frameId = requestAnimationFrame(updateTexture);
    };

    frameId = requestAnimationFrame(updateTexture);

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [active, textureRef.current, meshRef.current]);

  // Add error indicator when webcam access fails
  if (hasError) {
    return (
      <mesh position={[0, 0, 0.1]}>
        <planeGeometry args={[9, 9]} />
        <meshBasicMaterial color="black" transparent opacity={0.7} />
        <mesh position={[0, 0, 0.1]}>
          <planeGeometry args={[8, 1]} />
          <meshBasicMaterial color="red" transparent opacity={0.8} />
          <Html center position={[0, 0, 0.1]}>
            <div
              style={{
                color: 'white',
                fontWeight: 'bold',
                textAlign: 'center',
                backgroundColor: 'rgba(0,0,0,0.5)',
                padding: '5px',
                borderRadius: '3px',
                whiteSpace: 'nowrap',
              }}
            >
              ⚠️ Camera access error
            </div>
          </Html>
        </mesh>
      </mesh>
    );
  }

  return null;
};

export default WebcamStream;
