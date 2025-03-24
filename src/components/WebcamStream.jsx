import { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';

const WebcamStream = ({ meshRef, active }) => {
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef(null);
  const textureRef = useRef(null);

  useEffect(() => {
    if (!active || !meshRef.current) return;

    // Create video element
    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    videoRef.current = video;

    // Start webcam stream
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: false,
      })
      .then((stream) => {
        video.srcObject = stream;
        video.play();

        // Create video texture with corrected format
        const texture = new THREE.VideoTexture(video);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        // Fix: Use RGB format instead of RGBFormat (which is deprecated)
        texture.format = THREE.RGBAFormat; // Change from RGBFormat to RGBAFormat
        texture.colorSpace = THREE.SRGBColorSpace; // Add proper color space

        textureRef.current = texture;

        // Apply texture to plane material
        if (meshRef.current) {
          const material = meshRef.current.material;
          material.map = texture;
          material.transparent = true;
          material.opacity = 1;
          material.needsUpdate = true;
        }
      })
      .catch((error) => {
        console.error('Error accessing webcam:', error);
        setHasError(true);
      });

    // Cleanup function
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }

      if (meshRef.current && textureRef.current) {
        const material = meshRef.current.material;
        material.map = null;
        material.needsUpdate = true;
        textureRef.current.dispose();
      }
    };
  }, [active, meshRef]);

  // Add error indicator when webcam access fails
  if (hasError) {
    return (
      <mesh position={[0, 0, 0.1]}>
        <planeGeometry args={[9, 9]} />
        <meshBasicMaterial color="black" transparent opacity={0.7} />
        <textSprite
          position={[0, 0, 0.1]}
          text="⚠️ Camera error"
          fontSize={0.7}
          color="red"
          backgroundColor="rgba(0,0,0,0.5)"
          padding={0.1}
        />
      </mesh>
    );
  }

  return null;
};

export default WebcamStream;
