import { rescanRepositoryForChanges } from './githubRepoService';
import { uploadMarkdownToStorage } from './storageService';
import { markdownDiagramService } from './markdownDiagramService';
import useObjectsStore from '../stores/objectsStore';
import useCodeStore from '../stores/codeStore';
import useAuthStore from '../stores/authStore';
import useWorkflowStore from '../stores/workflowStore';

function getGithubToken() {
  return localStorage.getItem('github_token');
}

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
 * Trigger a silent background rescan when a pipeline task PR is merged.
 * Integrates new objects into the existing merfolk diagram.
 *
 * @param {string} repoSlug - "owner/repo" format
 * @param {string} spaceId  - the current space ID
 */
export async function rescanAfterMerge(repoSlug, spaceId) {
  if (!repoSlug || !spaceId) return;

  try {
    const token = getGithubToken();
    if (!token) {
      console.warn('[mergeRescan] No GitHub token — skipping background rescan');
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

    const [owner, name] = repoSlug.split('/');
    if (!owner || !name) {
      console.warn('[mergeRescan] Invalid repo slug:', repoSlug);
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
