import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

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

  // Validate file type
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed');
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('File size must be less than 10MB');
  }

  const storage = getStorage();
  const fileExtension = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExtension}`;
  const filePath = `users/${userId}/spaces/${
    spaceId || 'default'
  }/images/${fileName}`;

  const storageRef = ref(storage, filePath);

  // Create the upload task
  const uploadTask = uploadBytesResumable(storageRef, file);

  // Return a promise that resolves with the download URL
  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      // Progress function
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Image upload is ' + progress + '% done');
      },
      // Error function
      (error) => {
        console.error('Error uploading image:', error);
        reject(error);
      },
      // Complete function
      async () => {
        try {
          // Get the download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log('Image available at', downloadURL);
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

  const storage = getStorage();
  const fileExtension = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExtension}`;
  const filePath = `users/${userId}/spaces/${
    spaceId || 'default'
  }/models/${fileName}`;

  const storageRef = ref(storage, filePath);

  // Create the upload task
  const uploadTask = uploadBytesResumable(storageRef, file);

  // Return a promise that resolves with the download URL
  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      // Progress function
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload is ' + progress + '% done');
      },
      // Error function
      (error) => {
        console.error('Error uploading file:', error);
        reject(error);
      },
      // Complete function
      async () => {
        try {
          // Get the download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log('File available at', downloadURL);
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

  const storage = getStorage();

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

  const fileExtension = file.name.split('.').pop();
  const finalFileName = `${uuidv4()}.${fileExtension}`;
  const filePath = `users/${userId}/spaces/${
    spaceId || 'default'
  }/markdown/${finalFileName}`;

  const storageRef = ref(storage, filePath);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Markdown upload is ' + progress + '% done');
      },
      (error) => {
        console.error('Error uploading markdown file:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log('Markdown available at', downloadURL);
          resolve(downloadURL);
        } catch (error) {
          console.error('Error getting markdown download URL:', error);
          reject(error);
        }
      }
    );
  });
};
