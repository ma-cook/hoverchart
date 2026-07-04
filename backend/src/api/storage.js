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
  try {
    const destPath = `uploads/${userId}/${Date.now()}_${fileName}`;
    const file = storage.bucket(bucketName).file(destPath);
    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000,
      contentType: contentType || 'application/octet-stream',
    });
    res.json({ signedUrl, path: destPath });
  } catch (err) {
    console.error('Upload URL error:', err);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});
