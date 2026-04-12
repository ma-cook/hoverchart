import usePipelineStore from '../stores/pipelineStore';
import {
  TASK_STATUS,
  getNextQueuedTask,
  updateTaskStatus,
} from './pipelineTaskService';
import {
  createIssue,
  assignCopilotToIssue,
  findPullRequestForIssue,
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

  // Step 1: Create GitHub Issue if not yet created
  let issueNumber = task.merfolkData?.githubIssueNumber;
  if (!issueNumber) {
    const title = task.headerText || `Task #${task.merfolkData.planTaskIndex}`;
    const body = task.content || '';
    const result = await createIssue(token, owner, repo, { title, body });
    if (!result.ok) {
      console.error('[pipelineOrchestrator] Failed to create issue:', result.error);
      return false;
    }
    issueNumber = result.data.number;
  }

  // Step 2: Update status to in-progress with issue number
  await updateTaskStatus(spaceOwnerId, spaceId, objectId, cellId, TASK_STATUS.IN_PROGRESS, {
    githubIssueNumber: issueNumber,
  });

  // Step 3: Assign Copilot to the issue
  const assignResult = await assignCopilotToIssue(token, owner, repo, issueNumber);
  if (!assignResult.ok) {
    console.error('[pipelineOrchestrator] Failed to assign Copilot:', assignResult.error);
  }

  // Step 4: Poll for linked PR
  return new Promise((resolve) => {
    const pollForPR = async () => {
      const currentState = usePipelineStore.getState();
      if (!currentState.isRunning || currentState.isPaused) {
        resolve(false);
        return;
      }

      // Check for linked PR
      const prResult = await findPullRequestForIssue(token, owner, repo, issueNumber);
      if (prResult.ok && prResult.data) {
        const prNumber = prResult.data.number;

        // Update status to pr-open
        await updateTaskStatus(spaceOwnerId, spaceId, objectId, cellId, TASK_STATUS.PR_OPEN, {
          githubPrNumber: prNumber,
        });

        // Auto-approve if enabled
        if (currentState.autoApprove) {
          await approvePullRequest(token, owner, repo, prNumber);

          // Merge
          const mergeResult = await mergePullRequest(token, owner, repo, prNumber);
          if (mergeResult.ok) {
            await updateTaskStatus(spaceOwnerId, spaceId, objectId, cellId, TASK_STATUS.MERGED);
            resolve(true);
            return;
          }
        }

        // If not auto-approve, poll for merge
        const pollForMerge = async () => {
          const state2 = usePipelineStore.getState();
          if (!state2.isRunning || state2.isPaused) {
            resolve(false);
            return;
          }

          const prCheck = await getPullRequest(token, owner, repo, prNumber);
          if (prCheck.ok && prCheck.data?.merged) {
            await updateTaskStatus(spaceOwnerId, spaceId, objectId, cellId, TASK_STATUS.MERGED);
            resolve(true);
            return;
          }

          // Continue polling
          const mergeIntervalId = setTimeout(pollForMerge, POLL_INTERVAL_MS);
          usePipelineStore.getState().setPollIntervalId(mergeIntervalId);
        };

        const mergeIntervalId = setTimeout(pollForMerge, POLL_INTERVAL_MS);
        usePipelineStore.getState().setPollIntervalId(mergeIntervalId);
        return;
      }

      // No PR yet — keep polling
      const intervalId = setTimeout(pollForPR, POLL_INTERVAL_MS);
      usePipelineStore.getState().setPollIntervalId(intervalId);
    };

    // Start first poll
    const initialId = setTimeout(pollForPR, POLL_INTERVAL_MS);
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
