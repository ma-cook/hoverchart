import { rescanRepositoryForChanges, isGithubAuthenticated, fetchLatestCommitSha } from './githubRepoService';
import { uploadMarkdownToStorage, fetchStoredMarkdown } from './storageService';
import { markdownDiagramService } from './markdownDiagramService';
import { renderMerfolkMarkdownToScene } from './sceneRenderService';
import { loadScanSession } from './scanJobSession';
import { saveDiagramDigest } from './graphPersistence';
import { api } from '../api-client';
import useObjectsStore from '../stores/objectsStore';
import useCodeStore from '../stores/codeStore';
import useAuthStore from '../stores/authStore';
import useWorkflowStore from '../stores/workflowStore';

/**
 * Create an onCreateObject callback compatible with processMarkdownFile.
 * This wraps objectsStore.handleCreateObject without requiring a cameraRef.
 */
function makeCreateObject(spaceId) {
  const user = useAuthStore.getState().user;
  const storeCreate = useObjectsStore.getState().handleCreateObject;
  return (type, position = null, extraData = {}) => {
    return storeCreate(type, position, user, spaceId, null, extraData);
  };
}

/**
 * Server-first diff rescan for a merged PR. Posts a rescan job (base commit is
 * read server-side from the space's diagram_commit_sha), polls it to
 * completion, then hydrates the diagram from the uploaded markdown. Returns
 * true when the server handled the rescan; throws so the caller can fall back
 * to the in-browser rescan. Ticket-to-merged linking cannot run here because
 * the diff file list is not exposed by the scan-jobs API — the local fallback
 * keeps that step.
 */
async function tryServerRescan(repoSlug, spaceId) {
  const user = useAuthStore.getState().user;
  if (!user?.uid || user.isGuest) return false;

  const [owner, name] = repoSlug.split('/');
  const job = await api.post('/api/scan-jobs', {
    spaceId,
    repoOwner: owner,
    repoName: name,
    rescan: true,
  });

  for (let i = 0; i < 200; i++) {
    const j = await api.get(`/api/scan-jobs/${job.id}`);
    if (!j) continue;
    if (j.status === 'done') {
      const markdown = await fetchStoredMarkdown(j.markdown_storage_url);
      if (!markdown) throw new Error('Server rescan produced no markdown');
      await markdownDiagramService.hydrateStoreFromMarkdown(markdown);
      // Materialize the new/changed nodes as 3D objects too — the server only
      // produces markdown, so without this step a merged PR's objects never
      // appear in the scene. Existing objects are pinned to their current
      // positions, so the diagram stays where it was first created.
      try {
        const sceneResult = await renderMerfolkMarkdownToScene(markdown, spaceId, user);
        console.log(
          `[mergeRescan] Scene updated — ${sceneResult.objectsCreated} object(s),`,
          `${sceneResult.connectionsCreated} connection(s)`
        );
      } catch (sceneErr) {
        console.warn('[mergeRescan] Scene materialization failed:', sceneErr.message);
      }
      setTimeout(() => saveDiagramDigest(spaceId), 0);
      if (j.sha) localStorage.setItem(`diagramCommitSha_${spaceId}`, j.sha);
      localStorage.setItem(`diagramMarkdownText_${spaceId}`, markdown);
      console.log(
        `[mergeRescan] Server diff-rescan complete — ${j.changed_file_count ?? 0} file(s) changed,`,
        `${j.objects_created ?? 0} nodes, ${j.connections_created ?? 0} edges`
      );
      return true;
    }
    if (j.status === 'failed' || j.status === 'cancelled') {
      throw new Error(`server rescan ${j.status}: ${j.error || 'unknown'}`);
    }
    await new Promise((r) => setTimeout(r, 2500));
  }
  throw new Error('server rescan timed out');
}

/**
 * Trigger a silent background rescan when a pipeline task PR is merged.
 * Integrates new objects into the existing merfolk diagram.
 * The durable server-side diff rescan is preferred; the in-browser rescan is
 * the fallback (guest account, 401/429, or no server-side base commit).
 *
 * @param {string} repoSlug - "owner/repo" format
 * @param {string} spaceId  - the current space ID
 */
export async function rescanAfterMerge(repoSlug, spaceId) {
  if (!repoSlug || !spaceId) return;

  const [owner, name] = repoSlug.split('/');
  if (!owner || !name) {
    console.warn('[mergeRescan] Invalid repo slug:', repoSlug);
    return;
  }

  try {
    if (await tryServerRescan(repoSlug, spaceId)) return;
  } catch (err) {
    console.warn('[mergeRescan] Server path failed — falling back to local rescan:', err.message);
  }

  try {
    if (!isGithubAuthenticated()) {
      console.warn('[mergeRescan] GitHub not connected — skipping background rescan');
      return;
    }

    const lastCommitSha = localStorage.getItem(`diagramCommitSha_${spaceId}`);
    if (!lastCommitSha) {
      console.warn('[mergeRescan] No previous commit SHA — skipping (repo not yet scanned)');
      return;
    }

    const existingMarkdown = localStorage.getItem(`diagramMarkdownText_${spaceId}`);
    if (!existingMarkdown) {
      console.warn('[mergeRescan] No existing markdown — skipping (repo not yet scanned)');
      return;
    }

    const repo = { owner: { login: owner }, name };

    const rescanResult = await rescanRepositoryForChanges(
      repo,
      lastCommitSha,
      existingMarkdown,
      null,
    );

    if (rescanResult.noChanges) {
      console.log('[mergeRescan] No new changes after merge');
      return;
    }

    const user = useAuthStore.getState().user;

    // Upload merged markdown to storage (fire-and-forget)
    if (user?.uid && spaceId) {
      uploadMarkdownToStorage(
        rescanResult.mergedMarkdown,
        user.uid,
        spaceId,
        `${name}-diagram.md`,
      ).catch(() => {});
    }

    // Process the merged markdown to create new scene objects and update existing ones
    const onCreateObject = makeCreateObject(spaceId);
    const mergedBlob = new Blob([rescanResult.mergedMarkdown], { type: 'text/markdown' });
    const mergedFile = new File([mergedBlob], `${name}-merged.md`, { type: 'text/markdown' });

    await markdownDiagramService.processMarkdownFile(
      mergedFile,
      onCreateObject,
      spaceId,
      user,
    );

    // Update stored state
    localStorage.setItem(`diagramCommitSha_${spaceId}`, rescanResult.commitSha);

    // Persist the new markdown text for future rescan comparisons
    const mdText = rescanResult.mergedMarkdown;
    localStorage.setItem(`diagramMarkdownText_${spaceId}`, mdText);

    // Update code store with new content index, file sizes, import graph
    if (rescanResult.contentIndex) useCodeStore.getState().setContentIndex(rescanResult.contentIndex);
    if (rescanResult.fileSizes) useCodeStore.getState().setFileSizes(rescanResult.fileSizes);
    if (rescanResult.importGraph) useCodeStore.getState().setImportGraph(rescanResult.importGraph);

    const codeStoreState = useCodeStore.getState();
    const baseContents = codeStoreState.repoFileContents;
    if (baseContents && typeof baseContents === 'object' && rescanResult.repoFileContents) {
      const mergedContents = { ...baseContents };
      for (const [p, c] of Object.entries(rescanResult.repoFileContents)) {
        if (c) mergedContents[p] = c;
      }
      codeStoreState.setRepoFileContents(mergedContents);
    }

    // Link workflow tickets that touch the changed files to "merged" status
    const { tickets, updateTicket } = useWorkflowStore.getState();
    const changedFiles = new Set([
      ...(rescanResult.addedFiles || []),
      ...(rescanResult.modifiedFiles || []),
    ]);
    for (const ticket of tickets) {
      if (ticket.status !== 'committed') continue;
      const overlap = (ticket.filesTouched || []).some((f) => changedFiles.has(f));
      if (overlap) {
        updateTicket({ ...ticket, status: 'merged' });
      }
    }

    console.log(
      `[mergeRescan] Complete — ${rescanResult.changedFileCount} file(s) changed,`,
      `${rescanResult.addedFiles} added, ${rescanResult.modifiedFiles} modified`,
    );
  } catch (err) {
    console.warn('[mergeRescan] Background rescan failed:', err.message);
  }
}

// Multi-tab guard for the on-open staleness check: the first tab to detect
// staleness runs the rescan; other tabs see the fresh lock and skip. The TTL
// outlives the longest expected rescan so an abandoned tab can't lock a space
// forever.
const AUTO_RESCAN_LOCK_TTL_MS = 15 * 60 * 1000;
const autoRescanLockKey = (spaceId) => `autoRescanLock_${spaceId}`;

/**
 * On-open staleness check: compare the connected repo's latest commit SHA
 * against the space's stored diagram SHA and silently rescan when they
 * differ. Runs the standard rescan pipeline (server diff rescan preferred,
 * in-browser fallback) so new objects are materialized at the existing
 * diagram location.
 *
 * Cheap path: a single GitHub API call when the space is up to date.
 * Never throws, never blocks space opening — every failure is logged + skipped.
 *
 * Skips when: the space has no repo / no stored SHA (never scanned), a scan
 * is already in progress, another tab holds a fresh auto-rescan lock, or
 * GitHub is not connected.
 *
 * @param {string} spaceId
 */
export async function checkSpaceForRepoUpdates(spaceId) {
  if (!spaceId) return;
  try {
    // Another tab recently started (or is running) the auto-rescan.
    const lockRaw = localStorage.getItem(autoRescanLockKey(spaceId));
    if (lockRaw && Date.now() - (Number(lockRaw) || 0) < AUTO_RESCAN_LOCK_TTL_MS) {
      return;
    }

    // A scan is already in progress for this space — the durable re-attach
    // flow will hydrate its result, no need to start another.
    const session = loadScanSession(spaceId);
    if (session?.jobId && !['done', 'failed', 'cancelled'].includes(session.status)) {
      return;
    }

    // Authoritative repo + SHA come from the server space record (works
    // cross-browser); localStorage is the offline/guest fallback.
    let repo = null;
    let storedSha = null;
    try {
      const space = await api.get(`/api/spaces/${spaceId}`);
      if (space?.diagramRepo) repo = space.diagramRepo;
      if (space?.diagramCommitSha) storedSha = space.diagramCommitSha;
    } catch { /* fall through to local state */ }
    if (!repo) {
      try {
        repo = JSON.parse(localStorage.getItem(`diagramRepo_${spaceId}`) || 'null');
      } catch { repo = null; }
    }
    if (!storedSha) {
      storedSha = localStorage.getItem(`diagramCommitSha_${spaceId}`) || null;
    }

    const owner = repo?.owner?.login;
    const name = repo?.name;
    if (!owner || !name) return;   // space is not connected to a repository
    if (!storedSha) return;        // never scanned — nothing to diff against
    if (!isGithubAuthenticated()) return;

    // One-call staleness check. Uses the same HEAD the rescan diff is based
    // on, so "equal" reliably means "nothing would change".
    let headSha = null;
    try {
      headSha = await fetchLatestCommitSha(owner, name);
    } catch (err) {
      console.warn('[autoRescan] HEAD check failed:', err.message);
      return;
    }
    if (!headSha || headSha === storedSha) {
      console.log('[autoRescan] Space diagram is up to date');
      return;
    }

    console.log(
      `[autoRescan] New commits detected (${storedSha.slice(0, 7)} → ${headSha.slice(0, 7)}) — rescanning`
    );
    localStorage.setItem(autoRescanLockKey(spaceId), String(Date.now()));
    try {
      await rescanAfterMerge(`${owner}/${name}`, spaceId);
    } finally {
      localStorage.removeItem(autoRescanLockKey(spaceId));
    }
  } catch (err) {
    console.warn('[autoRescan] Update check failed:', err.message);
  }
}
