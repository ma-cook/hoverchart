import { api } from '../api-client';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']);
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_MODEL_SIZE = 50 * 1024 * 1024;

const uploadFileGeneric = async (file, userId, spaceId, folder, progressCallback = null) => {
  const fileExtension = file.name?.split('.').pop() || 'bin';
  const fileName = `${uuidv4()}.${fileExtension}`;

  const { signedUrl, path } = await api.post('/api/storage/upload', {
    fileName,
    contentType: file.type || 'application/octet-stream',
  });

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', signedUrl, true);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && progressCallback) {
        progressCallback({ bytesTransferred: e.loaded, totalBytes: e.total });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(`${window.location.origin}/api/storage/${path}`);
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.send(file);
  });
};

export const uploadImageToStorage = async (file, userId, spaceId) => {
  if (!file || !userId) throw new Error('File and userId are required for upload');
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) throw new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed');
  if (file.size > MAX_IMAGE_SIZE) throw new Error('File size must be less than 10MB');
  return uploadFileGeneric(file, userId, spaceId, 'images', (snapshot) => {
    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    console.log('Image upload is ' + progress + '% done');
  });
};

export const uploadModelToStorage = async (file, userId, spaceId) => {
  if (!file || !userId) throw new Error('File and userId are required for upload');
  return uploadFileGeneric(file, userId, spaceId, 'models', (snapshot) => {
    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    console.log('Model upload is ' + progress + '% done');
  });
};

export const uploadMarkdownToStorage = async (markdown, userId, spaceId, fileName) => {
  if (!markdown || !userId) throw new Error('Markdown content and userId are required for upload');
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
