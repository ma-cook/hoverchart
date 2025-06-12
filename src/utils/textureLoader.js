import { getStorage, ref, getBlob } from 'firebase/storage';
import * as THREE from 'three';

/**
 * Loads an image texture from Firebase Storage using blob approach to avoid CORS issues
 * @param {string} imageUrl - The Firebase Storage download URL
 * @returns {Promise<THREE.Texture>} A promise that resolves to a Three.js texture
 */
export const loadTextureFromFirebaseUrl = async (imageUrl) => {
  try {
    // Extract the storage path from the Firebase Storage URL
    const url = new URL(imageUrl);
    const pathSegments = url.pathname.split('/');

    // Find the 'o' segment and get everything after it
    const oIndex = pathSegments.indexOf('o');
    if (oIndex === -1) {
      throw new Error('Invalid Firebase Storage URL');
    }

    const storagePath = decodeURIComponent(
      pathSegments.slice(oIndex + 1).join('/')
    );

    // Get reference to the file in Firebase Storage
    const storage = getStorage();
    const imageRef = ref(storage, storagePath);

    // Download the blob
    const blob = await getBlob(imageRef);

    // Create blob URL
    const blobUrl = URL.createObjectURL(blob);

    // Create and return texture
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

          // Clean up blob URL
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

/**
 * Loads an image texture directly from a file blob
 * @param {Blob} blob - The image blob
 * @returns {Promise<THREE.Texture>} A promise that resolves to a Three.js texture
 */
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

        // Clean up blob URL
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
