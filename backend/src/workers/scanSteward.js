import pool from '../db.js';
import { triggerScanner } from '../scanner/trigger.js';

const STEWARD_INTERVAL_MS = 60_000;
const STALE_AFTER_SECONDS = 120;
// A job that is still `queued` this long after creation means every trigger
// attempt has bounced (bad auth, scanner unreachable, persistent 5xx). Rather
// than retry forever — which leaves the client spinning at "queued... 0%" —
// fail it with a terminal error the UI can surface and the user can retry.
const GIVE_UP_AFTER_SECONDS = 15 * 60;

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
      `SELECT id, EXTRACT(EPOCH FROM (NOW() - created_at))::int AS age_seconds
       FROM scan_jobs
       WHERE status = 'queued'
         AND created_at < NOW() - ($1::int || ' seconds')::interval
       ORDER BY created_at ASC
       LIMIT 10`,
      [STALE_AFTER_SECONDS]
    );
    for (const row of rows) {
      if (row.age_seconds >= GIVE_UP_AFTER_SECONDS) {
        await pool.query(
          `UPDATE scan_jobs
           SET status = 'failed', stage = 'Failed', progress = 100,
               error = COALESCE(error, $2), updated_at = NOW()
           WHERE id = $1 AND status = 'queued'`,
          [row.id, 'Background scan could not be started — please try again']
        );
        console.error(`[scanSteward] giving up on queued job ${row.id} after ${row.age_seconds}s`);
        continue;
      }
      await triggerScanner(row.id).catch((err) => console.error('[scanSteward] retrigger failed:', err.message));
    }
  } catch (err) {
    console.error('[scanSteward] error:', err.message);
  }
}