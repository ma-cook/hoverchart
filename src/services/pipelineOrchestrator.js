import usePipelineStore from '../stores/pipelineStore';
import {
  TASK_STATUS,
  getNextQueuedTask,
  updateTaskStatus,
} from './pipelineTaskService';
import {
  getRepoInfo,
  getBranchRef,
  createBranchRef,
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

    // Create a new branch for this task
    const branchName = `copilot/task-${taskIndex}`;
    const branchResult = await createBranchRef(token, owner, repo, branchName, baseSha);
    if (!branchResult.ok) {
      console.error('[pipelineOrchestrator] Failed to create branch:', branchResult.error);
      return false;
    }

    // Create a task spec file to give the PR a diff
    const taskSpec = `# Task: ${title}\n\n${body}`;
    const fileResult = await createFileOnBranch(
      token, owner, repo,
      `.github/copilot-tasks/task-${taskIndex}.md`,
      taskSpec,
      branchName,
      `task(${taskIndex}): ${title}`
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

  // Step 2: Update status to in-progress with PR number
  await updateTaskStatus(spaceOwnerId, spaceId, objectId, cellId, TASK_STATUS.IN_PROGRESS, {
    githubPrNumber: prNumber,
  });

  // Step 3: Update status to pr-open
  await updateTaskStatus(spaceOwnerId, spaceId, objectId, cellId, TASK_STATUS.PR_OPEN, {
    githubPrNumber: prNumber,
  });

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
        await updateTaskStatus(spaceOwnerId, spaceId, objectId, cellId, TASK_STATUS.MERGED);
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
      if (currentState.autoApprove && prCheck.data.commits > 1) {
        await approvePullRequest(token, owner, repo, prNumber);
        const mergeResult = await mergePullRequest(token, owner, repo, prNumber);
        if (mergeResult.ok) {
          await updateTaskStatus(spaceOwnerId, spaceId, objectId, cellId, TASK_STATUS.MERGED);
          resolve(true);
          return;
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

export async function startPipeline(spaceOwnerId, spaceId, tasks) {
  const store = usePipelineStore.getState();
  const { connectedRepo } = store;

  if (!connectedRepo?.owner || !connectedRepo?.repo) {
    console.error('[pipelineOrchestrator] No repo connected');
    return;
  }

  store.startPipeline();
  store.setTaskOrder(tasks.map((t) => t.id));

  const { owner, repo } = connectedRepo;

  let currentTask = getNextQueuedTask(tasks);
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

    const success = await processTask(spaceOwnerId, spaceId, currentTask, owner, repo);
    if (!success) {
      // Task failed or paused — check if we should continue
      const state = usePipelineStore.getState();
      if (!state.isRunning) break;
      if (state.isPaused) continue;
      break;
    }

    // Re-fetch tasks to get updated statuses
    // The caller should re-read objects from the store
    // For now, just find the next queued task from the original list
    currentTask = getNextQueuedTask(
      tasks.filter((t) => t.id !== currentTask.id)
    );
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

export function stopPipeline() {
  usePipelineStore.getState().stopPipeline();
}
