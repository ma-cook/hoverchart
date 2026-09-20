import { v4 as uuidv4 } from 'uuid';
import { loadTokens } from '../api-client';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']);
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const uploadFileGeneric = async (file, userId, spaceId, folder, progressCallback = null) => {
  const fileExtension = file.name?.split('.').pop() || 'bin';
  const fileName = `${uuidv4()}.${fileExtension}`;
  const contentType = file.type || 'application/octet-stream';

  const { accessToken } = loadTokens();
  const { path: destPath } = await fetch(`${API_BASE}/api/storage/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ fileName, contentType }),
  }).then(r => r.json());

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', `${API_BASE}/api/storage/proxy-upload`, true);
    xhr.setRequestHeader('X-File-Path', destPath);
    xhr.setRequestHeader('X-Content-Type', contentType);
    if (accessToken) xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && progressCallback) {
        progressCallback({ bytesTransferred: e.loaded, totalBytes: e.total });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(`${window.location.origin}/api/storage/${destPath}`);
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

/**
 * Fetches stored diagram markdown text. The backend storage routes live behind
 * `authenticate`, so any URL pointing at our /api/storage endpoints must carry
 * the Bearer access token. Accepts a full/fetchable URL, a our-own full
 * same-origin URL (from storageService), or a bare rel path (`uploads/...`,
 * as produced by background scans).
 */
export const fetchStoredMarkdown = async (urlOrPath) => {
  if (!urlOrPath) return null;
  let url = urlOrPath;
  if (url.startsWith('uploads/')) {
    url = `${window.location.origin}/api/storage/${url}`;
  }
  const ourEndpoint = url.includes('/api/storage/uploads/');
  const { accessToken } = loadTokens();
  const resp = await fetch(url, {
    headers: ourEndpoint && accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  if (!resp.ok) throw new Error(`Markdown fetch failed: ${resp.status}`);
  return resp.text();
};
