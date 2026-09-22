/**
 * durableScan.js
 *
 * Shared orchestration for server-side (durable) repository scans. The scan
 * itself runs in the scanner Cloud Run service; this module handles the
 * browser side: enqueueing the job, persisting a resumable session, polling
 * with throttled-timer rescue (visibilitychange), and hydrating the finished
 * diagram (including best-effort content-store repopulation).
 *
 * Design decisions:
 *  - 401/429 on job creation means "server scans unavailable right now" →
 *    callers fall back to the existing in-browser local scan (never block).
 *  - rescan jobs are diff-only (the server compares base..head and merges).
 */

import { fetchStoredMarkdown } from './storageService';
import { populateContentStoreWorker } from './zenService';
import { saveRepoFileContents, loadRepoFileContents } from './context/contentStorePersistence';
import useCodeStore from '../stores/codeStore';
import { saveScanSession, clearScanSession } from './scanJobSession';

export const ACTIVE_JOB_STATUSES = ['queued', 'fetching', 'parsing', 'generating', 'uploading'];

/** Normalize a repo object (GitHub API shape or plain {owner,name}). */
export const repoIdentity = (repo) => ({
  repoOwner:
    repo?.owner?.login ??
    (typeof repo?.owner === 'string' ? repo.owner : repo?.full_name?.split('/')[0]) ??
    null,
  repoName: repo?.name ?? repo?.full_name?.split('/')[1] ?? null,
  branch: repo?.default_branch ?? repo?.branch ?? null,
});

export const buildJobPayload = (spaceId, repo, rescan = false) => ({
  spaceId,
  ...repoIdentity(repo),
  rescan,
});

export const makeSession = (job, kind, repo) => ({
  jobId: job.id,
  kind,
  ...repoIdentity(repo),
  status: job.status || 'queued',
  progress: job.progress || (job.status === 'queued' ? 1 : 0),
  stage: job.stage || null,
  updatedAt: Date.now(),
});

/** api() errors carry status inside the message ("401: ..."). */
export const getErrorStatus = (err) => {
  const m = String(err?.message || '').match(/^(\d{3}):/);
  return m ? Number(m[1]) : null;
};

/** True when the server refused to run a scan (no token / tier-full). */
export const isLocalFallbackError = (err) => {
  const status = getErrorStatus(err);
  return status === 401 || status === 429;
};

/** Enqueue a server scan job. Throws the raw api error on failure. */
export const startScanJob = async ({ api, spaceId, repo, rescan = false }) =>
  api.post('/api/scan-jobs', buildJobPayload(spaceId, repo, rescan));

export const fetchScanJob = async ({ api, jobId }) => {
  if (!jobId) return null;
  try {
    return (await api.get(`/api/scan-jobs/${jobId}`)) || null;
  } catch {
    return null;
  }
};

export const cancelScanJob = async ({ api, jobId }) => {
  if (!jobId) return;
  try {
    await api.post(`/api/scan-jobs/${jobId}/cancel`);
  } catch {
    // best effort — the job may have finished meanwhile
  }
};

/**
 * Poll a scan job to completion. Timers fired while a tab is hidden get
 * throttled by the browser; a visibilitychange/focus listener rescues the
 * chain by flushing the pending timer and re-fetching immediately.
 *
 * @param {object} opts
 * @param {object} opts.api
 * @param {object} opts.session - saved session { jobId, kind, repoOwner, repoName, ... }
 * @param {string} opts.spaceId
 * @param {(p:{isScanning:boolean,progress:number,stage:string})=>void} opts.onProgress
 * @param {(job:object)=>Promise<void>} opts.hydrate - called once the job is `done`
 * @param {(job:object)=>void} [opts.onFailed] - called on failed/cancelled
 * @returns {() => void} cancel function; clears the session too
 */
export const pollScanJob = ({ api, session, spaceId, onProgress, hydrate, onFailed }) => {
  let cancelled = false;
  let inFlight = false;
  let armedTimer = null;
  let listener = null;

  const cleanup = () => {
    if (armedTimer) clearTimeout(armedTimer);
    if (listener) window.removeEventListener('visibilitychange', listener);
    armedTimer = null;
    listener = null;
  };

  const cancel = () => {
    cancelled = true;
    cleanup();
    clearScanSession(spaceId);
  };

  const persistActive = (job) => {
    saveScanSession(spaceId, {
      ...session,
      status: job.status,
      progress: job.progress || 0,
      stage: job.stage || null,
      updatedAt: Date.now(),
    });
  };

  const schedule = (delay) => {
    if (cancelled) return;
    armedTimer = setTimeout(() => {
      armedTimer = null;
      tick(delay);
    }, delay);
  };

  const tick = async (delay) => {
    if (cancelled || inFlight) return;
    inFlight = true;
    try {
      const job = await api.get(`/api/scan-jobs/${session.jobId}`);
      if (cancelled) return;
      if (!job) {
        schedule(Math.min(delay * 1.5, 15000));
        return;
      }

      if (job.status === 'done') {
        cleanup();
        clearScanSession(spaceId);
        onProgress({ isScanning: false, progress: 100, stage: 'Complete' });
        try {
          await hydrate(job);
        } catch (err) {
          console.error('[durableScan] hydration failed:', err.message);
          onProgress({ isScanning: false, progress: 100, stage: 'Complete' });
        }
        return;
      }

      if (job.status === 'failed' || job.status === 'cancelled') {
        cleanup();
        clearScanSession(spaceId);
        onProgress({ isScanning: false, progress: 100, stage: job.status === 'cancelled' ? 'Cancelled' : 'Failed' });
        if (onFailed) onFailed(job);
        return;
      }

      persistActive(job);
      onProgress({
        isScanning: true,
        progress: job.progress || 0,
        stage: job.stage || `Background scan (${job.status})...`,
      });
      schedule(Math.min(delay * 1.5, 15000));
    } catch (err) {
      console.warn('[durableScan] poll failed:', err.message);
      onProgress({ isScanning: true, progress: session.progress || 0, stage: session.stage || 'Background scan...' });
      schedule(Math.min(delay * 1.5, 15000));
    } finally {
      inFlight = false;
    }
  };

  listener = () => {
    // Hidden-tab timers throttle hard; on visible, flush the pending poll so
    // progress (or completion) surfaces immediately on reopen.
    if (document.visibilityState === 'visible' && !inFlight) {
      if (armedTimer) {
        clearTimeout(armedTimer);
        armedTimer = null;
      }
      tick(0);
    }
  };
  window.addEventListener('visibilitychange', listener);

  tick(2000);

  return cancel;
};

async function repopulateRepoContext(spaceId, markdown) {
  let contents = useCodeStore.getState().repoFileContents;
  if (!contents || typeof contents !== 'object' || Object.keys(contents).length === 0) {
    contents = await loadRepoFileContents(spaceId);
  }
  if (!contents || typeof contents !== 'object' || Object.keys(contents).length === 0) return;
  useCodeStore.getState().setRepoFileContents(contents);
  saveRepoFileContents(spaceId, contents).catch(() => {});
  populateContentStoreWorker(contents, markdown);
}

/**
 * Fetch + apply a finished server scan's markdown: store it in memory/local
 * storage, update the storage URL, re-index the content store, then hydrate
 * the 3D store. Returns the markdown so callers can persist digests etc.
 *
 * @param {object} opts
 * @param {object} opts.job - finished scan job (has markdown_storage_url)
 * @param {string} opts.spaceId
 * @param {(md:string, spaceId?:string)=>void} [opts.storeMarkdown]
 * @param {(url:string)=>void} [opts.setLatestMarkdownUrl]
 */
export async function hydrateServerResult({ job, spaceId, storeMarkdown, setLatestMarkdownUrl }) {
  const markdown = await fetchStoredMarkdown(job.markdown_storage_url);
  if (!markdown) throw new Error('Scan finished but produced no markdown');
  if (storeMarkdown) storeMarkdown(markdown, spaceId);
  if (setLatestMarkdownUrl && job.markdown_storage_url) setLatestMarkdownUrl(job.markdown_storage_url);
  repopulateRepoContext(spaceId, markdown).catch((err) =>
    console.warn('[durableScan] content-store repopulation failed:', err.message)
  );
  return markdown;
}