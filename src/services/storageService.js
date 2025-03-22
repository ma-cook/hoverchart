import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

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
