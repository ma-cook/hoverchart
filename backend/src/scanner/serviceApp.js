import express from 'express';
import { Storage } from '@google-cloud/storage';
import { fileURLToPath } from 'node:url';
import pool from '../db.js';
import { decryptSecret } from '../security/crypto.js';
import { runBackgroundScan, runBackgroundRescan, DiffTooLargeError } from './runScan.js';

const bucketName = process.env.GCS_BUCKET;
const storage = bucketName ? new Storage() : null;
const internalKey = process.env.SCAN_INTERNAL_KEY;

function countMerfolk(markdown) {
  const body = markdown.match(/```merfolk\n([\s\S]*?)```/)?.[1] || markdown;
  const nodes = (body.match(/%%\s+\S.*\[\[/g) || []).length;
  const edges = (body.match(/-->|-.->/g) || []).length;
  return { nodes, edges };
}

async function setJob(jobId, patch) {
  const sets = [];
  const params = [jobId];
  for (const [key, value] of Object.entries(patch)) {
    params.push(value ?? null);
    sets.push(`${key} = $${params.length}`);
  }
  sets.push('updated_at = NOW()');
  await pool.query(`UPDATE scan_jobs SET ${sets.join(', ')} WHERE id = $1`, params);
}

async function uploadMarkdown(relPath, markdown) {
  if (!storage) throw new Error('GCS_BUCKET not configured');
  await storage.bucket(bucketName).file(relPath).save(markdown, {
    contentType: 'text/markdown',
    resumable: false,
    metadata: { cacheControl: 'no-cache' },
  });
}

/**
 * Loads a queued job, decrypts the owner's GitHub token, and runs the shared
 * scan core end-to-end: fetch structure/files -> parse (tree-sitter + TS) ->
 * generate merfolk markdown -> upload to GCS -> persist markdown_storage_url on
 * the space -> mark the job done. Any transition from the active states lands on
 * failed with the error text.
 */
export async function runJob(jobId) {
  const { rows } = await pool.query('SELECT * FROM scan_jobs WHERE id = $1', [jobId]);
  const job = rows[0];
  if (!job || job.status !== 'queued') return { skipped: true }; // already handled or unknown

  const tokenRows = await pool.query(
    'SELECT encrypted_token FROM github_tokens WHERE owner_id = $1',
    [job.owner_id]
  );
  const token = tokenRows.rows[0] ? decryptSecret(tokenRows.rows[0].encrypted_token) : null;
  if (!token) {
    await setJob(job.id, { status: 'failed', stage: 'Failed', progress: 100, error: 'GitHub not connected' });
    return { ok: false };
  }

  try {
    const options = {
      token,
      owner: job.repo_owner,
      repo: job.repo_name,
      ref: job.branch || null,
      onProgress: async (pct, stage) => {
        await setJob(job.id, { progress: pct, stage: String(stage).slice(0, 200) });
      },
    };

    let result;
    let escalatedToFull = false;

    if (job.is_rescan) {
      const spaceRows = await pool.query(
        'SELECT markdown_storage_url, diagram_commit_sha FROM spaces WHERE id = $1',
        [job.space_id]
      );
      const space = spaceRows.rows[0];

      let existingMarkdown = null;
      if (storage && space?.markdown_storage_url) {
        try {
          const [file] = await storage.bucket(bucketName).file(space.markdown_storage_url).download();
          existingMarkdown = file.toString('utf8');
        } catch (e) {
          console.warn(`[rescan ${job.id}] existing markdown unreadable: ${e.message}`);
        }
      }

      try {
        result = await runBackgroundRescan({
          ...options,
          baseCommitSha: job.base_commit_sha || space?.diagram_commit_sha,
          existingMarkdown,
        });
      } catch (err) {
        // Diff un-computable or no previous diagram — rebuild from HEAD.
        if (err instanceof DiffTooLargeError) {
          console.warn(`[rescan ${job.id}] escalated to full scan: ${err.message}`);
          escalatedToFull = true;
          await setJob(job.id, { stage: 'Full rescan (diff too large)', progress: 1 });
          result = await runBackgroundScan(options);
        } else {
          throw err;
        }
      }

      if (result.noChanges) {
        const newSha = result.commitSha;
        await setJob(job.id, {
          status: 'done',
          stage: 'Complete',
          progress: 100,
          sha: newSha,
          base_commit_sha: newSha,
          changed_file_count: result.changedFileCount ?? 0,
        });
        await pool.query(`UPDATE spaces SET diagram_commit_sha = $1, updated_at = NOW() WHERE id = $2`, [
          newSha,
          job.space_id,
        ]);
        console.log(`[rescan ${job.repo_owner}/${job.repo_name}] no changes at ${newSha.slice(0, 8)}`);
        return { ok: true, noChanges: true, counts: { nodes: job.objects_created ?? 0, edges: job.connections_created ?? 0 } };
      }
    } else {
      result = await runBackgroundScan(options);
    }

    await setJob(job.id, { status: 'uploading', stage: 'Uploading diagram', progress: 95 });

    const relPath = `uploads/${job.owner_id}/${Date.now()}_${job.repo_name}-diagram.md`;
    await uploadMarkdown(relPath, result.markdown);

    const counts = countMerfolk(result.markdown);
    const headSha = result.commitSha || null;
    await setJob(job.id, {
      status: 'done',
      stage: 'Complete',
      progress: 100,
      markdown_storage_url: relPath,
      sha: headSha,
      base_commit_sha: headSha,
      changed_file_count: job.is_rescan ? result.changedFileCount ?? null : null,
      objects_created: counts.nodes,
      connections_created: counts.edges,
    });
    await pool.query(
      `UPDATE spaces SET markdown_storage_url = $1, diagram_commit_sha = $2, diagram_repo = $3, updated_at = NOW() WHERE id = $4`,
      [relPath, headSha, `${job.repo_owner}/${job.repo_name}`, job.space_id]
    );

    console.log(`[scan ${job.repo_owner}/${job.repo_name}]${job.is_rescan ? ' (rescan)' : ''} done: ${counts.nodes} nodes, ${counts.edges} edges -> ${relPath}`);
    return { ok: true, counts, escalatedToFull, noChanges: false };
  } catch (err) {
    console.error(`Scan ${job.id} failed:`, err);
    await setJob(job.id, {
      status: 'failed',
      stage: 'Failed',
      progress: 100,
      error: String(err?.message || err).slice(0, 2000),
    });
    return { ok: false };
  }
}

export function createScannerApp() {
  const app = express();
  app.use(express.json({ limit: '8mb' }));

  app.get('/', (req, res) => res.json({ ok: true, service: 'hoverchart-scanner' }));
  app.get('/health', async (req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ ok: true, db: 'connected' });
    } catch {
      res.status(503).json({ ok: false, db: 'disconnected' });
    }
  });

  // Internal trigger endpoint — invoked by the main API (or the scan steward).
  app.post('/scan', async (req, res) => {
    if (internalKey && req.get('x-scan-key') !== internalKey) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { jobId } = req.body || {};
    if (!jobId) return res.status(400).json({ error: 'jobId required' });

    try {
      const outcome = await runJob(jobId);
      res.json({ ok: true, jobId, ...outcome });
    } catch (err) {
      console.error('Scanner job handler error:', err);
      res.status(500).json({ ok: false, error: String(err?.message || err).slice(0, 500) });
    }
  });

  return app;
}

export async function startScannerServer() {
  const app = createScannerApp();
  const port = Number(process.env.PORT || 8080);
  await new Promise((resolve, reject) => {
    const server = app.listen(port);
    server.once('listening', resolve);
    server.once('error', reject);
  });
  console.log(`Hoverchart scanner listening on port ${port}`);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  startScannerServer().catch((err) => {
    console.error('Scanner failed to start:', err);
    process.exit(1);
  });
}