import express from 'express';
import { Storage } from '@google-cloud/storage';
import { fileURLToPath } from 'node:url';
import pool from '../db.js';
import { decryptSecret } from '../security/crypto.js';
import { runBackgroundScan, runBackgroundRescan, DiffTooLargeError } from './runScan.js';
import {
  buildRepoContentsArtifact,
  mergeRepoFileContents,
  parseRepoContentsArtifact,
  serializeRepoContentsArtifact,
} from './repoContentsArtifact.js';

const bucketName = process.env.GCS_BUCKET;
const storage = bucketName ? new Storage() : null;
const internalKey = process.env.SCAN_INTERNAL_KEY;
const GCS_SIMPLE_UPLOAD_LIMIT = 5 * 1024 * 1024;

// Node definitions emitted by the scan generator. The 3d-ast parser accepts
// `id` characters followed by a type bracket, so the counting rule has to
// match it exactly or the reported counts drift from what the client builds:
//   id{Component: X}  id[Function: X]  id[Hook: X]  id((Service: X))
//   id<Library: X>    id[[Store: X]]    id[[Class: X]]  id[[Interface: X]]
//   id[Endpoint: GET /path]
const MERFOLK_NODE_RE = /^[A-Za-z0-9_/.-]+[[{(<~]/;
// Connection lines: `src --> tgt : "label"` / `src -.-> tgt : "label"`.
const MERFOLK_EDGE_RE = /^\s*(\S+)\s*(-->|-\.->|---|==>|==|\*-->|\.\.>|<--)\s*(\S+)/;

function countMerfolk(markdown) {
  const body = markdown.match(/```merfolk\n([\s\S]*?)```/)?.[1] || markdown;
  const lines = body.split('\n');

  let nodes = 0;
  const nodeIds = new Set();
  const edgePairs = new Set();
  let inPropertyBlock = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('%%')) continue;

    // Node properties are emitted as a `{ ... }` block on the lines AFTER the
    // node definition — they are not nodes.
    if (inPropertyBlock) {
      if (line === '}') inPropertyBlock = false;
      continue;
    }
    if (line === '{') {
      inPropertyBlock = true;
      continue;
    }

    const edge = line.match(MERFOLK_EDGE_RE);
    if (edge) {
      edgePairs.add(`${edge[1]}|${edge[3]}`);
      continue;
    }

    if (MERFOLK_NODE_RE.test(line)) {
      nodes++;
      nodeIds.add(line.match(/^[A-Za-z0-9_/.-]+/)[0]);
    }
  }

  // Only count connections whose endpoints are both real nodes — a connection
  // to an undefined node is never materialised in the 3D scene.
  let edges = 0;
  for (const pair of edgePairs) {
    const [source, target] = pair.split('|');
    if (source === target) continue;
    if (nodeIds.has(source) && nodeIds.has(target)) edges++;
  }

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

function repoContentsPath(job) {
  return `uploads/${job.owner_id}/${job.space_id}-repo-contents.json.gz`;
}

async function uploadRepoContents(relPath, artifact) {
  if (!storage) throw new Error('GCS_BUCKET not configured');
  const body = await serializeRepoContentsArtifact(artifact);
  await storage.bucket(bucketName).file(relPath).save(body, {
    contentType: 'application/gzip',
    resumable: body.length > GCS_SIMPLE_UPLOAD_LIMIT,
    metadata: { cacheControl: 'no-cache' },
  });
}

async function loadRepoContents(relPath) {
  if (!storage || !relPath) return null;
  try {
    const [body] = await storage.bucket(bucketName).file(relPath).download();
    return await parseRepoContentsArtifact(body);
  } catch (err) {
    console.warn(`[repo contents] unreadable ${relPath}: ${err.message}`);
    return null;
  }
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
    let rescanSpace = null;
    let previousContents = null;

    if (job.is_rescan) {
      const spaceRows = await pool.query(
        `SELECT markdown_storage_url, diagram_commit_sha, repo_contents_storage_url
         FROM spaces WHERE id = $1`,
        [job.space_id]
      );
      rescanSpace = spaceRows.rows[0];

      const artifactUrl = rescanSpace?.repo_contents_storage_url || job.repo_contents_storage_url;
      const previousArtifact = await loadRepoContents(artifactUrl);

      if (!previousArtifact) {
        console.warn(`[rescan ${job.id}] repo contents artifact missing; escalating to full scan`);
        escalatedToFull = true;
        await setJob(job.id, { stage: 'Full rescan (repo contents unavailable)', progress: 1 });
        result = await runBackgroundScan(options);
      } else {
        previousContents = previousArtifact.fileContents || {};

        let existingMarkdown = null;
        if (storage && rescanSpace?.markdown_storage_url) {
          try {
            const [file] = await storage.bucket(bucketName).file(rescanSpace.markdown_storage_url).download();
            existingMarkdown = file.toString('utf8');
          } catch (e) {
            console.warn(`[rescan ${job.id}] existing markdown unreadable: ${e.message}`);
          }
        }

        try {
          result = await runBackgroundRescan({
            ...options,
            baseCommitSha: job.base_commit_sha || rescanSpace?.diagram_commit_sha,
            existingMarkdown,
          });
        } catch (err) {
          // Diff un-computable or no previous diagram — rebuild from HEAD.
          if (err instanceof DiffTooLargeError) {
            console.warn(`[rescan ${job.id}] escalated to full scan: ${err.message}`);
            escalatedToFull = true;
            previousContents = null;
            await setJob(job.id, { stage: 'Full rescan (diff too large)', progress: 1 });
            result = await runBackgroundScan(options);
          } else {
            throw err;
          }
        }
      }

      if (result.noChanges) {
        const newSha = result.commitSha;
        let contentsUrl =
          rescanSpace?.repo_contents_storage_url || job.repo_contents_storage_url || null;

        if (previousContents && result.deletedFiles?.length > 0) {
          const artifact = buildRepoContentsArtifact({
            repoOwner: job.repo_owner,
            repoName: job.repo_name,
            branch: job.branch,
            commitSha: newSha,
            fileContents: mergeRepoFileContents(previousContents, {}, result.deletedFiles),
          });
          const artifactPath = repoContentsPath(job);
          try {
            await uploadRepoContents(artifactPath, artifact);
            contentsUrl = artifactPath;
          } catch (artifactErr) {
            console.warn(`[rescan ${job.id}] repo contents update failed: ${artifactErr.message}`);
          }
        }

        await setJob(job.id, {
          status: 'done',
          stage: 'Complete',
          progress: 100,
          sha: newSha,
          base_commit_sha: newSha,
          changed_file_count: result.changedFileCount ?? 0,
          markdown_storage_url: rescanSpace?.markdown_storage_url || null,
          repo_contents_storage_url: contentsUrl,
        });
        await pool.query(
          `UPDATE spaces SET diagram_commit_sha = $1, repo_contents_storage_url = $2, updated_at = NOW() WHERE id = $3`,
          [newSha, contentsUrl, job.space_id]
        );
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
    const mergedContents = previousContents
      ? mergeRepoFileContents(previousContents, result.repoFileContents, result.deletedFiles)
      : (result.repoFileContents || {});
    let contentsUrl =
      job.is_rescan
        ? rescanSpace?.repo_contents_storage_url || job.repo_contents_storage_url || null
        : null;

    if (Object.keys(mergedContents).length > 0) {
      const artifactPath = repoContentsPath(job);
      try {
        await setJob(job.id, { stage: 'Uploading repo context', progress: 98 });
        await uploadRepoContents(
          artifactPath,
          buildRepoContentsArtifact({
            repoOwner: job.repo_owner,
            repoName: job.repo_name,
            branch: job.branch,
            commitSha: headSha,
            fileContents: mergedContents,
          })
        );
        contentsUrl = artifactPath;
      } catch (artifactErr) {
        console.warn(`[scan ${job.id}] repo contents artifact upload failed: ${artifactErr.message}`);
      }
    }

    await setJob(job.id, {
      status: 'done',
      stage: 'Complete',
      progress: 100,
      markdown_storage_url: relPath,
      repo_contents_storage_url: contentsUrl,
      sha: headSha,
      base_commit_sha: headSha,
      changed_file_count: job.is_rescan ? result.changedFileCount ?? null : null,
      objects_created: counts.nodes,
      connections_created: counts.edges,
    });

    // `diagram_repo` is JSONB — it must receive a JSON value, not a bare
    // "owner/repo" string (which Postgres rejects with "invalid input syntax
    // for type json").  Store the same GitHub-repo-shaped object the client
    // uses for `diagramRepo` so cross-device hydration matches.
    const diagramRepo = {
      owner: { login: job.repo_owner },
      name: job.repo_name,
      full_name: `${job.repo_owner}/${job.repo_name}`,
      default_branch: job.branch || null,
      branch: job.branch || null,
    };
    await pool.query(
      `UPDATE spaces SET markdown_storage_url = $1, repo_contents_storage_url = $2,
       diagram_commit_sha = $3, diagram_repo = $4, updated_at = NOW() WHERE id = $5`,
      [relPath, contentsUrl, headSha, diagramRepo, job.space_id]
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