import { Storage } from '@google-cloud/storage';
import pool from '../db.js';

const SWEEP_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6h
const RETENTION_SECONDS = 30 * 24 * 60 * 60; // 30 days

const bucketName = process.env.GCS_BUCKET;
const storage = bucketName ? new Storage() : null;

/**
 * 30-day retention for background scan jobs: hard-deletes every scan_jobs row
 * older than 30 days (queued, done, failed and cancelled alike) and removes the
 * corresponding diagram markdown objects from GCS.
 */
export function startRetentionSweep() {
  setInterval(() => sweepExpiredScans().catch((e) => console.error('[retentionSweep] error:', e.message)), SWEEP_INTERVAL_MS);
  setTimeout(() => sweepExpiredScans().catch((e) => console.error('[retentionSweep] error:', e.message)), 30_000);
}

export async function sweepExpiredScans() {
  const { rows } = await pool.query(
    `DELETE FROM scan_jobs
     WHERE created_at < NOW() - ($1::int || ' seconds')::interval
     RETURNING markdown_storage_url`,
    [RETENTION_SECONDS]
  );
  if (rows.length === 0) return;

  let purged = 0;
  if (storage) {
    for (const row of rows) {
      const rel = row.markdown_storage_url;
      if (!rel || !rel.startsWith('uploads/')) continue;
      try {
        await storage.bucket(bucketName).file(rel).delete();
        purged += 1;
      } catch (err) {
        if (err?.code !== 404) console.error(`[retentionSweep] GCS delete failed for ${rel}:`, err.message);
      }
    }
  }
  console.log(`[retentionSweep] purged ${rows.length} scan job(s), ${purged} GCS object(s)`);
}