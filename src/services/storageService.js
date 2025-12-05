import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

// Memoize storage instance to avoid repeated getStorage() calls
let _storageInstance = null;
const getStorageInstance = () => {
  if (!_storageInstance) {
    _storageInstance = getStorage();
  }
  return _storageInstance;
};

// Pre-defined allowed image types as a Set for O(1) lookup
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
]);

// Constants for file validation
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_MODEL_SIZE = 50 * 1024 * 1024; // 50MB for 3D models

/**
 * Generic upload function to reduce code duplication
 * @param {File|Blob} file - The file to upload
 * @param {string} userId - The ID of the current user
 * @param {string} spaceId - The ID of the current space
 * @param {string} folder - The subfolder to upload to (images, models, markdown)
 * @param {Function} progressCallback - Optional progress callback
 * @returns {Promise<string>} A promise that resolves to the download URL
 */
const uploadFileGeneric = (file, userId, spaceId, folder, progressCallback = null) => {
  const storage = getStorageInstance();
  const fileExtension = file.name?.split('.').pop() || 'bin';
  const fileName = `${uuidv4()}.${fileExtension}`;
  const filePath = `users/${userId}/spaces/${spaceId || 'default'}/${folder}/${fileName}`;

  const storageRef = ref(storage, filePath);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      progressCallback || (() => {}), // Use no-op if no callback
      (error) => {
        console.error(`Error uploading ${folder} file:`, error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          console.error('Error getting download URL:', error);
          reject(error);
        }
      }
    );
  });
};

/**
 * Uploads an image file to Firebase Storage and returns the download URL
 * @param {File} file - The image file to upload
 * @param {string} userId - The ID of the current user
 * @param {string} spaceId - The ID of the current space
 * @returns {Promise<string>} A promise that resolves to the download URL
 */
export const uploadImageToStorage = async (file, userId, spaceId) => {
  if (!file || !userId) {
    throw new Error('File and userId are required for upload');
  }

  // Validate file type using Set for O(1) lookup
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed');
  }

  // Validate file size
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('File size must be less than 10MB');
  }

  return uploadFileGeneric(file, userId, spaceId, 'images', (snapshot) => {
    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    console.log('Image upload is ' + progress + '% done');
  });
};

/**
 * Uploads a model file to Firebase Storage and returns the download URL
 * @param {File} file - The model file to upload
 * @param {string} userId - The ID of the current user
 * @param {string} spaceId - The ID of the current space
 * @returns {Promise<string>} A promise that resolves to the download URL
 */
export const uploadModelToStorage = async (file, userId, spaceId) => {
  if (!file || !userId) {
    throw new Error('File and userId are required for upload');
  }

  return uploadFileGeneric(file, userId, spaceId, 'models', (snapshot) => {
    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    console.log('Model upload is ' + progress + '% done');
  });
};

/**
 * Uploads a markdown file (or string) to Firebase Storage and returns the download URL
 * @param {File|string} markdown - The markdown File or string to upload
 * @param {string} userId - The ID of the current user
 * @param {string} spaceId - The ID of the current space
 * @param {string} [fileName] - Optional filename to use
 * @returns {Promise<string>} A promise that resolves to the download URL
 */
export const uploadMarkdownToStorage = async (
  markdown,
  userId,
  spaceId,
  fileName
) => {
  if (!markdown || !userId) {
    throw new Error('Markdown content and userId are required for upload');
  }

  let file;

  if (typeof markdown === 'string') {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const name = fileName || `${uuidv4()}.md`;
    file = new File([blob], name, { type: 'text/markdown' });
  } else if (markdown instanceof File) {
    file = markdown;
  } else {
    throw new Error('Markdown must be a string or File');
  }

  return uploadFileGeneric(file, userId, spaceId, 'markdown', (snapshot) => {
    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    console.log('Markdown upload is ' + progress + '% done');
  });
};
