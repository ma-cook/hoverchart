import * as THREE from 'three';

export const loadTextureFromFirebaseUrl = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error('Failed to fetch image');
    const blob = await response.blob();

    const blobUrl = URL.createObjectURL(blob);

    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        try {
          const texture = new THREE.Texture(img);
          texture.needsUpdate = true;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.format = THREE.RGBAFormat;
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.flipY = false;

          URL.revokeObjectURL(blobUrl);

          resolve(texture);
        } catch (error) {
          URL.revokeObjectURL(blobUrl);
          reject(error);
        }
      };

      img.onerror = (error) => {
        URL.revokeObjectURL(blobUrl);
        reject(error);
      };

      img.src = blobUrl;
    });
  } catch (error) {
    console.error('Error loading texture from Firebase URL:', error);
    throw error;
  }
};

export const loadTextureFromBlob = async (blob) => {
  return new Promise((resolve, reject) => {
    const blobUrl = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      try {
        const texture = new THREE.Texture(img);
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.format = THREE.RGBAFormat;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.flipY = false;

        URL.revokeObjectURL(blobUrl);

        resolve(texture);
      } catch (error) {
        URL.revokeObjectURL(blobUrl);
        reject(error);
      }
    };

    img.onerror = (error) => {
      URL.revokeObjectURL(blobUrl);
      reject(error);
    };

    img.src = blobUrl;
  });
};
