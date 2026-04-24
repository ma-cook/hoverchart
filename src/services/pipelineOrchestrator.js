import usePipelineStore from '../stores/pipelineStore';
import useObjectsStore from '../stores/objectsStore';
import {
  TASK_STATUS,
  getNextActionableTask,
  getPipelineTasks,
  getPipelineTasksForRepo,
  updateTaskStatus,
} from './pipelineTaskService';
import { repositionAllTasks } from './repoContainerService';
import {
  getRepoInfo,
  getBranchRef,
  createBranchRef,
  deleteBranchRef,
  getFileContents,
  createFileOnBranch,
  createPullRequest,
  addComment,
  approvePullRequest,
  mergePullRequest,
  getPullRequest,
} from './githubIssuesService';

const POLL_INTERVAL_MS = 30_000;

function getGithubToken() {
  return localStorage.getItem('github_token');
}

async function processTask(spaceOwnerId, spaceId, task, owner, repo) {
  const token = getGithubToken();
  if (!token) {
    console.error('[pipelineOrchestrator] No GitHub token found');
    return false;
  }

  const store = usePipelineStore.getState();
  const objectId = task.id;
  const cellId = task.cellId || '0,0,0';

  store.setCurrentTaskId(objectId);

  const title = task.headerText || `Task #${task.merfolkData.planTaskIndex}`;
  const body = task.content || task.text || '';

  // Step 1: Create branch + PR + @copilot comment (if no PR yet)
  let prNumber = task.merfolkData?.githubPrNumber;
  if (!prNumber) {
    // Get default branch SHA
    const repoInfo = await getRepoInfo(token, owner, repo);
    if (!repoInfo.ok) {
      console.error('[pipelineOrchestrator] Failed to get repo info:', repoInfo.error);
      return false;
    }
    const defaultBranch = repoInfo.data.default_branch;

    const branchRef = await getBranchRef(token, owner, repo, defaultBranch);
    if (!branchRef.ok) {
      console.error('[pipelineOrchestrator] Failed to get branch ref:', branchRef.error);
      return false;
    }
    const baseSha = branchRef.data.object.sha;

    const taskIndex = task.merfolkData.planTaskIndex;

    // Create a new branch for this task (delete stale branch from previous runs if it exists)
    const branchName = `copilot/task-${taskIndex}`;
    let branchResult = await createBranchRef(token, owner, repo, branchName, baseSha);
    if (!branchResult.ok && branchResult.status === 422) {
      // Branch already exists — delete it and retry
      console.log('[pipelineOrchestrator] Branch already exists, deleting and recreating:', branchName);
      await deleteBranchRef(token, owner, repo, branchName);
      branchResult = await createBranchRef(token, owner, repo, branchName, baseSha);
    }
    if (!branchResult.ok) {
      console.error('[pipelineOrchestrator] Failed to create branch:', branchResult.error);
      return false;
    }

    // Create/update a task spec file to give the PR a diff
    const taskSpec = `# Task: ${title}\n\n${body}`;
    const taskFilePath = `.github/copilot-tasks/task-${taskIndex}.md`;
    // Check if file already exists on the new branch (inherited from default branch)
    const existingFile = await getFileContents(token, owner, repo, taskFilePath, branchName);
    const existingSha = existingFile.ok ? existingFile.data.sha : undefined;
    const fileResult = await createFileOnBranch(
      token, owner, repo,
      taskFilePath,
      taskSpec,
      branchName,
      `task(${taskIndex}): ${title}`,
      existingSha
    );
    if (!fileResult.ok) {
      console.error('[pipelineOrchestrator] Failed to create task file:', fileResult.error);
      return false;
    }

    // Open a PR from the branch
    const prResult = await createPullRequest(token, owner, repo, {
      title,
      body,
      head: branchName,
      base: defaultBranch,
    });
    if (!prResult.ok) {
      console.error('[pipelineOrchestrator] Failed to create PR:', prResult.error);
      return false;
    }
    prNumber = prResult.data.number;

    // Comment @copilot on the PR to trigger implementation
    const copilotPrompt = `@copilot Please implement the changes described in this PR.\n\n**Task:** ${title}\n\n${body}`;
    await addComment(token, owner, repo, prNumber, copilotPrompt);
  }

  // Step 2/3: Update status to in-progress then pr-open with PR number.
  // Skip these writes when resuming an existing PR so we don't overwrite a
  // status (e.g. MERGED / CLOSED) that the polling branch below is about to
  // reconcile on its first tick.
  const existingStatus = task.merfolkData?.status;
  const isResumingExistingPr =
    task.merfolkData?.githubPrNumber &&
    (existingStatus === TASK_STATUS.IN_PROGRESS ||
      existingStatus === TASK_STATUS.PR_OPEN);
  if (!isResumingExistingPr) {
    await updateTaskStatus(spaceOwnerId, spaceId, objectId, cellId, TASK_STATUS.IN_PROGRESS, {
      githubPrNumber: prNumber,
    });
    await updateTaskStatus(spaceOwnerId, spaceId, objectId, cellId, TASK_STATUS.PR_OPEN, {
      githubPrNumber: prNumber,
    });
  } else {
    // Immediately check PR state once before entering the 30s poll loop so
    // an already-merged PR is reconciled right away rather than after a full
    // poll interval. This is the common case after a refresh where GitHub
    // merged the PR while the app was closed.
    const immediate = await getPullRequest(token, owner, repo, prNumber);
    if (immediate.ok) {
      if (immediate.data.merged) {
        await updateTaskStatus(spaceOwnerId, spaceId, objectId, cellId, TASK_STATUS.MERGED, {
          mergeCommitSha: immediate.data.merge_commit_sha,
        });
        const taskRepoSlug = task.merfolkData?.repoSlug;
        if (taskRepoSlug) repositionAllTasks(taskRepoSlug);
        return true;
      }
      if (immediate.data.state === 'closed') {
        await updateTaskStatus(spaceOwnerId, spaceId, objectId, cellId, TASK_STATUS.CLOSED);
        return true;
      }
    }
  }

  // Step 4: Poll for Copilot to push commits and/or for merge
  return new Promise((resolve) => {
    const pollPR = async () => {
      const currentState = usePipelineStore.getState();
      if (!currentState.isRunning || currentState.isPaused) {
        resolve(false);
        return;
      }

      const prCheck = await getPullRequest(token, owner, repo, prNumber);
      if (!prCheck.ok) {
        const intervalId = setTimeout(pollPR, POLL_INTERVAL_MS);
        usePipelineStore.getState().setPollIntervalId(intervalId);
        return;
      }

      // PR was merged
      if (prCheck.data.merged) {
        await updateTaskStatus(spaceOwnerId, spaceId, objectId, cellId, TASK_STATUS.MERGED, { mergeCommitSha: prCheck.data.merge_commit_sha });
        // Reposition tasks so merged task moves to back layer
        const taskRepoSlug = task.merfolkData?.repoSlug;
        if (taskRepoSlug) {
          repositionAllTasks(taskRepoSlug);
        }
        resolve(true);
        return;
      }

      // PR was closed without merging
      if (prCheck.data.state === 'closed') {
        await updateTaskStatus(spaceOwnerId, spaceId, objectId, cellId, TASK_STATUS.CLOSED);
        resolve(true);
        return;
      }

      // Auto-approve if enabled and Copilot has pushed commits (more than our initial one)
      if (currentState.autoApprove && prCheck.data.commits > 1 && !prCheck.data.merged) {
        await approvePullRequest(token, owner, repo, prNumber);
        // Merge the PR directly via REST API (works on all plans)
        const mergeResult = await mergePullRequest(token, owner, repo, prNumber);
        if (!mergeResult.ok) {
          console.warn('[pipelineOrchestrator] Merge not available, will keep polling:', mergeResult.error);
        }
      }

      // Continue polling
      const intervalId = setTimeout(pollPR, POLL_INTERVAL_MS);
      usePipelineStore.getState().setPollIntervalId(intervalId);
    };

    // Start first poll
    const initialId = setTimeout(pollPR, POLL_INTERVAL_MS);
    usePipelineStore.getState().setPollIntervalId(initialId);
  });
}

export async function startPipeline(spaceOwnerId, spaceId, tasks, repoSlug) {
  const store = usePipelineStore.getState();

  // Resolve owner/repo from repoSlug or fallback to connectedRepo
  let owner, repo;
  if (repoSlug) {
    const repoEntry = store.getRepo(repoSlug);
    if (repoEntry) {
      owner = repoEntry.owner;
      repo = repoEntry.repo;
    }
  }
  if (!owner || !repo) {
    const { connectedRepo } = store;
    if (!connectedRepo?.owner || !connectedRepo?.repo) {
      console.error('[pipelineOrchestrator] No repo connected');
      return;
    }
    owner = connectedRepo.owner;
    repo = connectedRepo.repo;
  }

  store.startPipeline();
  store.setTaskOrder(tasks.map((t) => t.id));

  // Re-read tasks from the live store each iteration so status changes written
  // to Firestore (and synced back into the objects store) are respected. This
  // also lets the pipeline resume IN_PROGRESS / PR_OPEN tasks that were left
  // in-flight before a refresh.
  const getLatestTasks = () => {
    const objs = useObjectsStore.getState().objects || [];
    return repoSlug
      ? getPipelineTasksForRepo(objs, repoSlug)
      : getPipelineTasks(objs);
  };

  // One-shot reconciliation: before the main loop, check every PR_OPEN /
  // IN_PROGRESS task against GitHub. This catches PRs that were merged while
  // the app was closed or the pipeline was stopped, so their status flips to
  // MERGED before the loop picks a task to work on.
  await reconcilePendingTasks(spaceOwnerId, spaceId, getLatestTasks(), owner, repo);

  const processed = new Set();
  let currentTask = getNextActionableTask(getLatestTasks());
  while (currentTask) {
    const currentState = usePipelineStore.getState();
    if (!currentState.isRunning) break;

    if (currentState.isPaused) {
      // Wait for resume
      await new Promise((resolve) => {
        const checkResume = () => {
          const s = usePipelineStore.getState();
          if (!s.isPaused || !s.isRunning) {
            resolve();
            return;
          }
          setTimeout(checkResume, 1000);
        };
        setTimeout(checkResume, 1000);
      });
      const afterPause = usePipelineStore.getState();
      if (!afterPause.isRunning) break;
    }

    processed.add(currentTask.id);
    const success = await processTask(spaceOwnerId, spaceId, currentTask, owner, repo);
    if (!success) {
      // Task failed or paused — check if we should continue
      const state = usePipelineStore.getState();
      if (!state.isRunning) break;
      if (state.isPaused) continue;
      break;
    }

    // Re-read tasks from the store to pick up merged/closed statuses that the
    // polling loop just wrote. Skip tasks we've already processed this run to
    // avoid re-opening a PR that we just resolved.
    const latest = getLatestTasks().filter((t) => !processed.has(t.id));
    currentTask = getNextActionableTask(latest);
  }

  // Pipeline complete
  usePipelineStore.getState().stopPipeline();
}

export function pausePipeline() {
  usePipelineStore.getState().pausePipeline();
}

export function resumePipeline() {
  usePipelineStore.getState().resumePipeline();
}

/**
 * Check every PR_OPEN / IN_PROGRESS task with a githubPrNumber against GitHub
 * and update its status if the PR has since been merged or closed. Safe to
 * call without the pipeline running; used for background reconciliation when
 * GitHub auto-merges a PR while hoverchart isn't actively polling.
 */
export async function reconcilePendingTasks(spaceOwnerId, spaceId, tasks, owner, repo) {
  const token = getGithubToken();
  if (!token || !owner || !repo) return;

  const pending = (tasks || []).filter((t) => {
    const s = t.merfolkData?.status;
    return (
      t.merfolkData?.githubPrNumber &&
      (s === TASK_STATUS.PR_OPEN || s === TASK_STATUS.IN_PROGRESS)
    );
  });

  const repoSlugsToReposition = new Set();
  for (const task of pending) {
    const prNumber = task.merfolkData.githubPrNumber;
    const prCheck = await getPullRequest(token, owner, repo, prNumber);
    if (!prCheck.ok) continue;
    const cellId = task.cellId || '0,0,0';
    if (prCheck.data.merged) {
      await updateTaskStatus(spaceOwnerId, spaceId, task.id, cellId, TASK_STATUS.MERGED, {
        mergeCommitSha: prCheck.data.merge_commit_sha,
      });
      if (task.merfolkData?.repoSlug) repoSlugsToReposition.add(task.merfolkData.repoSlug);
    } else if (prCheck.data.state === 'closed') {
      await updateTaskStatus(spaceOwnerId, spaceId, task.id, cellId, TASK_STATUS.CLOSED);
    }
  }
  for (const slug of repoSlugsToReposition) {
    repositionAllTasks(slug);
  }
}

export function stopPipeline() {
  usePipelineStore.getState().stopPipeline();
}
