import { Router } from 'express';
import { Storage } from '@google-cloud/storage';
import pool from '../db.js';

export const router = Router();

const bucketName = process.env.GCS_BUCKET;
const storage = bucketName ? new Storage() : null;

router.get('/:path(*)', async (req, res) => {
  const { path } = req.params;
  if (!storage) return res.status(501).json({ error: 'Storage not configured' });
  try {
    const file = storage.bucket(bucketName).file(path);
    const [exists] = await file.exists();
    if (!exists) return res.status(404).json({ error: 'File not found' });
    const [stream] = await file.getStream();
    stream.pipe(res);
  } catch (err) {
    console.error('File read error:', err);
    res.status(500).json({ error: 'Failed to read file' });
  }
});

router.post('/upload', async (req, res) => {
  const userId = req.user.sub;
  if (!storage) return res.status(501).json({ error: 'Storage not configured' });
  const { fileName, contentType } = req.body;
  if (!fileName) return res.status(400).json({ error: 'fileName is required' });
  const destPath = `uploads/${userId}/${Date.now()}_${fileName}`;
  res.json({ path: destPath });
});

router.put('/proxy-upload', async (req, res) => {
  const userId = req.user.sub;
  if (!storage) return res.status(501).json({ error: 'Storage not configured' });

  const destPath = req.headers['x-file-path'];
  if (!destPath) return res.status(400).json({ error: 'X-File-Path header is required' });
  if (!destPath.startsWith(`uploads/${userId}/`)) {
    return res.status(403).json({ error: 'Path must start with your user ID prefix' });
  }

  try {
    const file = storage.bucket(bucketName).file(destPath);
    const stream = file.createWriteStream({
      resumable: false,
      metadata: {
        contentType: req.headers['x-content-type'] || 'application/octet-stream',
      },
    });

    await new Promise((resolve, reject) => {
      req.on('error', reject);
      req.pipe(stream);
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    res.json({ path: destPath });
  } catch (err) {
    console.error('Proxy upload error:', err);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});
