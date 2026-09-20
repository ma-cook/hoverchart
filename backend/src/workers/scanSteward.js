import pool from '../db.js';
import { triggerScanner } from '../scanner/trigger.js';

const STEWARD_INTERVAL_MS = 60_000;
const STALE_AFTER_SECONDS = 120;

/**
 * Re-triggers queued jobs whose first trigger never landed (crashed instance,
 * scale-to-zero race, transient 5xx). Only *queued* rows older than STALE_AFTER
 * are considered, so a healthy in-flight scan (status != queued) is never
 * duplicated. No-op when SCANNER_SERVICE_URL is unset (local/dev).
 */
export function startScanSteward() {
  if (!process.env.SCANNER_SERVICE_URL) {
    console.log('[scanSteward] SCANNER_SERVICE_URL not set — background pickup disabled');
    return;
  }
  setInterval(tick, STEWARD_INTERVAL_MS);
  setTimeout(tick, 5_000);
}

async function tick() {
  try {
    const { rows } = await pool.query(
      `SELECT id FROM scan_jobs
       WHERE status = 'queued'
         AND created_at < NOW() - ($1::int || ' seconds')::interval
       LIMIT 10`,
      [STALE_AFTER_SECONDS]
    );
    for (const row of rows) {
      await triggerScanner(row.id).catch((err) => console.error('[scanSteward] retrigger failed:', err.message));
    }
  } catch (err) {
    console.error('[scanSteward] error:', err.message);
  }
}