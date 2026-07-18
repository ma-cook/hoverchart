import { useEffect, useRef, useState, useCallback } from 'react';
import { onSocket, emitSocket } from '../api-client';
import { sendToZen, buildZenMessages, buildCodeGenMessages, fetchRepoContext, populateContentStore, finalizeContentStore } from '../services/zenService';
import { sendWithRetrieval, getBase64Store } from '../services/context';
import { extractMerfolkBlocks } from '../services/merfolkExtractor';
import { extractCodeBlocks, stripCodeBlocks } from '../services/codeExtractor';
import useObjectsStore from '../stores/objectsStore';
import useCodeStore from '../stores/codeStore';
import useLlmStore from '../stores/llmStore';
import useDiagramStore from '../stores/diagramStore';
import { PROVIDERS, fetchModels } from '../services/llmProviders';
import { getMarkdownLayoutWorker } from '../workers/markdownLayoutWorkerClient';
import { markdownDiagramService } from '../services/markdownDiagramService';
import {
  getGithubToken,
  isGithubAuthenticated,
  getGithubOAuthUrl,
  fetchRepositories,
} from '../services/githubRepoService';
import {
  getBranchRef,
  createBranchRef,
  createFileOnBranch,
  getFileContents,
} from '../services/githubIssuesService';
import { listBranches } from '../services/githubPushService';
import { scanRepositoryAndGenerateDiagram } from '../services/githubRepoService';
import { uploadMarkdownToStorage } from '../services/storageService';
import {
  findPlanContainer,
  findPlanTextObjects,
  createPlanContainer,
  createPlanTextObject,
  updatePlanText,
  generatePlanTitle,
} from '../services/planService';

const getGuestId = () => {
  let guestId = sessionStorage.getItem('guestPresenceId');
  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('guestPresenceId', guestId);
  }
  return guestId;
};

const senderInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

async function renderMerfolkToScene(merfolkBlocks, spaceId, user) {
  if (!merfolkBlocks || merfolkBlocks.length === 0) return false;

  const markdown = merfolkBlocks
    .map(block => '```merfolk\n' + block + '\n```')
    .join('\n\n');

  const basePosition = markdownDiagramService.getCameraBasedPosition();

  let workerResult = null;
  try {
    const layoutWorker = getMarkdownLayoutWorker();
    workerResult = await layoutWorker.computeLayout(markdown, basePosition);
  } catch (err) {
    console.warn('[SpaceChat] Layout worker failed:', err.message);
    return false;
  }

  if (!workerResult || !workerResult.diagramLayouts || workerResult.diagramLayouts.length === 0) {
    return false;
  }

  const diagrams = workerResult.diagramLayouts.map((layout) => ({
    graph: {
      nodes: new Map(layout.graphNodes),
      connections: new Map(
        layout.rawConnections.map((c, i) => [
          `hc-${i}`,
          { source: c.source, target: c.target, label: c.label, type: c.connectionType, visual: c.visual || null },
        ])
      ),
    },
    errors: layout.errors || [],
  }));

  const connectionTags = new Map(
    workerResult.connectionTags.map(([key, tags]) => [key, new Set(tags)])
  );

  const nodeToObjectIdMap = new Map();
  const allConnectionsToSave = [];
  const allObjectsToSave = [];
  const currentSpaceId = spaceId;

  window._faceDistributionCounters = window._faceDistributionCounters || new Map();

  for (const diagram of diagrams) {
    if (diagram.errors && diagram.errors.length > 0) continue;

    await markdownDiagramService.createObjectsFromDiagram(
      diagram,
      () => {},
      nodeToObjectIdMap,
      basePosition,
      user,
      currentSpaceId,
      allObjectsToSave,
      null
    );

    markdownDiagramService.createConnectionsFromDiagram(
      diagram,
      nodeToObjectIdMap,
      allConnectionsToSave,
      connectionTags
    );
  }

  if (allConnectionsToSave.length > 0) {
    await markdownDiagramService.saveConnections(
      allConnectionsToSave,
      currentSpaceId,
      user,
      allObjectsToSave
    );
  }

  return allConnectionsToSave.length > 0 || allObjectsToSave.length > 0;
}

async function associateCodeWithScene(codeBlocks, spaceId, user) {
  if (!codeBlocks || codeBlocks.length === 0) return 0;

  const spatialPartitioning = await import('../services/spatialPartitioning');
  const getCellCoordinates = spatialPartitioning.getCellCoordinates;
  const getCellId = spatialPartitioning.getCellId;
  const { saveObjectToCell } = await import('../services/spatialObjectsService');

  const objectsStore = useObjectsStore.getState();
  const objects = objectsStore.objects;
  let associatedCount = 0;
  const newTextObjects = [];

  for (const block of codeBlocks) {
    if (block.nodeId) {
      const target = objects.find(o =>
        o.merfolkData?.nodeId === block.nodeId
      );
      if (target) {
        objectsStore.associateCodeWithObject(target.id, {
          code: block.code,
          language: block.language,
          filePath: block.filePath,
        });
        associatedCount++;

        const textId = `code-text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const belowPosition = [
          (target.position?.[0] || 0),
          (target.position?.[1] || 0) - 15,
          (target.position?.[2] || 0),
        ];
        const cellCoords = getCellCoordinates(belowPosition);
        const cellId = getCellId(cellCoords.x, cellCoords.y, cellCoords.z);

        const textObject = {
          id: textId,
          type: 'text',
          position: belowPosition,
          scale: [30, 20, 1],
          cellId,
          createdAt: Date.now(),
          text: block.code,
          textStyle: {
            fontSize: 16,
            color: '#d4d4d4',
            fontWeight: 'normal',
            fontFamily: 'Consolas, "Courier New", monospace',
          },
          metadata: {
            code: block.code,
            codeLanguage: block.language,
            codeFilePath: block.filePath,
          },
          merfolkData: {
            parentObjectId: target.id,
          },
        };

        newTextObjects.push(textObject);
        objectsStore.setObjects(current => [...current, textObject]);
        try {
          await saveObjectToCell(user?.uid || user, spaceId, textObject);
        } catch {}
      }
    }
  }

  return { count: associatedCount, newTextObjects };
}

async function pushCodeToGitHub(codeBlocks, owner, repo, branch, token) {
  if (!token || !owner || !repo || !branch) return { success: false, pushed: 0, errors: [] };

  let pushed = 0;
  const errors = [];

  for (const block of codeBlocks) {
    if (!block.code || !block.filePath) continue;
    try {
      const path = block.filePath;
      const message = `Code: ${block.nodeId ? `updated ${block.nodeId}` : `updated ${path}`}`;
      let sha = null;
      try {
        const existing = await getFileContents(token, owner, repo, path, branch);
        if (existing?.ok && existing?.data) sha = existing.data.sha;
      } catch {}
      const result = await createFileOnBranch(token, owner, repo, path, block.code, branch, message, sha);
      if (result.ok) {
        pushed++;
      } else {
        errors.push({ file: block.filePath, error: result.error || 'Unknown error' });
      }
    } catch (err) {
      errors.push({ file: block.filePath, error: err.message });
    }
  }

  return { success: errors.length === 0, pushed, errors };
}

async function getGithubFileContents(token, owner, repo, path, branch) {
  const baseUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const url = branch ? `${baseUrl}?ref=${branch}` : baseUrl;
  const res = await fetch(url, {
    headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' },
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}

const SPACE_CHAT_MIN_WIDTH = 240;
const SPACE_CHAT_MIN_HEIGHT = 200;
const SPACE_CHAT_DEFAULT_WIDTH = 300;
const SPACE_CHAT_DEFAULT_HEIGHT = 360;

const MAX_PERSISTED_MESSAGES = 50;

function loadPersistedMessages(spaceId, mode) {
  try {
    const raw = localStorage.getItem(`chat:${spaceId}:${mode}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function persistMessages(spaceId, mode, messages) {
  try {
    const toSave = messages.slice(-MAX_PERSISTED_MESSAGES);
    localStorage.setItem(`chat:${spaceId}:${mode}`, JSON.stringify(toSave));
  } catch {}
}

function loadPersistedMode(spaceId) {
  try {
    return localStorage.getItem(`chat:${spaceId}:mode`) || 'group';
  } catch { return 'group'; }
}

function persistMode(spaceId, mode) {
  try {
    localStorage.setItem(`chat:${spaceId}:mode`, mode);
  } catch {}
}

const SpaceChat = ({ spaceId, user, isOpen, onClose, onCreateObject }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [chatSize, setChatSize] = useState({ width: SPACE_CHAT_DEFAULT_WIDTH, height: SPACE_CHAT_DEFAULT_HEIGHT });
  const [userResized, setUserResized] = useState(false);
  const [resizing, setResizing] = useState(null);

  useEffect(() => {
    if (!resizing) return;
    const handleMove = (e) => {
      const dx = e.clientX - resizing.startX;
      const dy = e.clientY - resizing.startY;
      setChatSize((prev) => {
        const next = { ...prev };
        if (resizing.edge === 'right' || resizing.edge === 'corner') {
          const newWidth = Math.max(SPACE_CHAT_MIN_WIDTH, resizing.startWidth + dx);
          next.width = newWidth;
          next.userRight = 76 - dx;
        }
        if (resizing.edge === 'bottom' || resizing.edge === 'corner') {
          next.height = Math.max(SPACE_CHAT_MIN_HEIGHT, resizing.startHeight + dy);
        }
        return next;
      });
    };
    const handleUp = () => {
      setResizing(null);
      setUserResized(true);
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  }, [resizing]);

  const handleResizeStart = (edge, e) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing({ edge, startX: e.clientX, startY: e.clientY, startWidth: chatSize.width, startHeight: chatSize.height });
  };

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const textareaRef = useRef(null);
  const bottomRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const oldestTimestampRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const liveKeysRef = useRef(new Set());

  useEffect(() => {
    const el = textareaRef.current;
    if (!el || isExpanded) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [input, isExpanded]);

  const [chatMode, setChatMode] = useState(() => loadPersistedMode(spaceId));
  const [planMessages, setPlanMessages] = useState(() => loadPersistedMessages(spaceId, 'plan'));
  const [codeMessages, setCodeMessages] = useState(() => loadPersistedMessages(spaceId, 'code'));
  const [streaming, setStreaming] = useState(false);
  const [llmError, setLlmError] = useState(null);
  const streamingRef = useRef('');
  const streamingMsgKeyRef = useRef(0);
  const abortControllerRef = useRef(null);

  const githubConnected = useCodeStore(s => s.githubConnected);
  const selectedRepo = useCodeStore(s => s.selectedRepo);
  const selectedBranch = useCodeStore(s => s.selectedBranch);
  const branchStrategy = useCodeStore(s => s.branchStrategy);
  const techStack = useCodeStore(s => s.techStack);
  const llmStore = useLlmStore();

  useEffect(() => {
    useCodeStore.getState().setSpaceId(spaceId);
  }, [spaceId]);

  useEffect(() => {
    const handleObjectsCleared = () => {
      setGroupMessages([]);
      setPlanMessages([]);
      setCodeMessages([]);
    };
    window.addEventListener('space-objects-cleared', handleObjectsCleared);
    return () => window.removeEventListener('space-objects-cleared', handleObjectsCleared);
  }, []);

  const [showGithubPanel, setShowGithubPanel] = useState(false);
  const [repos, setRepos] = useState([]);
  const [showRepos, setShowRepos] = useState(false);
  const [showNewRepoInput, setShowNewRepoInput] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [showBranchPrompt, setShowBranchPrompt] = useState(false);
  const [branchNameInput, setBranchNameInput] = useState('');
  const [availableBranches, setAvailableBranches] = useState([]);
  const [branchFetching, setBranchFetching] = useState(false);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [providerModels, setProviderModels] = useState([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [modelFetchError, setModelFetchError] = useState(null);
  const [showManualModelInput, setShowManualModelInput] = useState(false);
  const [manualModelInput, setManualModelInput] = useState('');
  const [pendingProviderId, setPendingProviderId] = useState(null);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [showTechStackPrompt, setShowTechStackPrompt] = useState(false);
  const [techStackInput, setTechStackInput] = useState('');
  const [pushNotification, setPushNotification] = useState(null);
  const [associatedCount, setAssociatedCount] = useState(0);
  const [scanProgress, setScanProgress] = useState(null);
  const [planContainer, setPlanContainer] = useState(null);
  const [activePlanTextId, setActivePlanTextId] = useState(null);
  const [planTextObjects, setPlanTextObjects] = useState([]);
  const [showNewPlanPrompt, setShowNewPlanPrompt] = useState(false);
  const [planTitleInput, setPlanTitleInput] = useState('');

  const llmMessages = chatMode === 'plan' ? planMessages : codeMessages;

  useEffect(() => {
    if (!spaceId || !isOpen || chatMode !== 'group') return;

    setMessages([]);
    setHasMore(false);
    oldestTimestampRef.current = null;
    liveKeysRef.current = new Set();

    const unsubHistory = onSocket('chat:history', (msgs) => {
      const mapped = (msgs || []).map((m) => ({ key: m.id, ...m }));
      liveKeysRef.current = new Set(mapped.map((m) => m.key));
      setMessages(mapped);
      if (mapped.length > 0) {
        oldestTimestampRef.current = mapped[0].timestamp || null;
      }
    });

    const unsubMessage = onSocket('chat:message', (msg) => {
      const wrapped = { ...msg, key: msg.id };
      setMessages((prev) => {
        if (prev.some((m) => m.key === wrapped.key || m.key === msg._tempKey)) return prev;
        const next = [...prev, wrapped];
        if (next.length > 0) {
          oldestTimestampRef.current = next[0].timestamp || null;
        }
        return next;
      });
      liveKeysRef.current.add(msg.id);
    });

      emitSocket('chat:join', { spaceId });

    return () => {
      emitSocket('chat:leave', { spaceId });
      unsubHistory();
      unsubMessage();
      setMessages([]);
      liveKeysRef.current = new Set();
    };
  }, [spaceId, isOpen, chatMode]);

  useEffect(() => {
    if (isOpen && isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, planMessages, codeMessages, isOpen]);

  const handleScroll = useCallback(async () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (chatMode === 'group' && el.scrollTop < 60 && hasMore && !loadingMore) {
      setHasMore(false);
    }
  }, [spaceId, chatMode, hasMore, loadingMore]);

  useEffect(() => {
    if (chatMode !== 'plan') return;
    const container = findPlanContainer();
    setPlanContainer(container);
    if (container) {
      const plans = findPlanTextObjects(container.id);
      setPlanTextObjects(plans);
      setActivePlanTextId(current => {
        if (current && plans.some(p => p.id === current)) return current;
        if (plans.length > 0) return plans[plans.length - 1].id;
        return null;
      });
      if (plans.length === 0) {
        setShowNewPlanPrompt(true);
      }
    } else {
      setShowNewPlanPrompt(true);
    }
  }, [chatMode]);

  useEffect(() => {
    persistMessages(spaceId, 'plan', planMessages);
  }, [spaceId, planMessages]);

  useEffect(() => {
    persistMessages(spaceId, 'code', codeMessages);
  }, [spaceId, codeMessages]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !spaceId) return;
    const userId = user ? user.uid : getGuestId();
    const displayName = user ? (user.displayName || user.email || 'User') : 'Guest';
    const photoURL = user ? (user.photoURL || null) : null;
    setSending(true);
    try {
      emitSocket('chat:message', { spaceId, text });
      setInput('');
      isNearBottomRef.current = true;
    } catch (err) {
      console.warn('[chat] Failed to send message:', err.message);
    } finally {
      setSending(false);
    }
  }, [input, spaceId, user]);

  const handlePlanSend = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    setLlmError(null);
    setInput('');
    isNearBottomRef.current = true;

    const userMessage = { role: 'user', content: text };
    const updatedMessages = [...planMessages, userMessage];
    setPlanMessages(updatedMessages);

    await populateContentStore();
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => finalizeContentStore());
    } else {
      setTimeout(() => finalizeContentStore(), 100);
    }

    const sceneObjects = useObjectsStore.getState().objects;
    const zenMessages = await buildZenMessages({
      llmMessages: updatedMessages,
      sceneObjects,
      modelId: llmStore.selectedModel,
      signal: new AbortController().signal,
    });

    setStreaming(true);
    streamingRef.current = '';
    streamingMsgKeyRef.current = `llm-stream-${Date.now()}`;
    const currentStreamKey = streamingMsgKeyRef.current;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      await sendWithRetrieval({
        messages: zenMessages,
        signal: abortController.signal,
        onChunk: (delta, fullText) => {
          streamingRef.current = fullText;
          setPlanMessages((prev) => {
            const streamMsg = {
              key: currentStreamKey,
              role: 'assistant',
              content: fullText,
              streaming: true,
            };
            const withoutStreaming = prev.filter(m => m.key !== currentStreamKey);
            return [...withoutStreaming, streamMsg];
          });
        },
        onRetrieval: ({ chunkIds, round }) => {
          console.log(`[Context] Retrieval round ${round}: ${chunkIds.length} chunks`);
        },
      });

      const finalText = streamingRef.current;

      if (activePlanTextId) {
        const textObj = useObjectsStore.getState().objects.find(o => o.id === activePlanTextId);
        if (textObj) {
          updatePlanText(textObj, finalText, user, spaceId);
        }
      }

      const blocks = extractMerfolkBlocks(finalText);

      setPlanMessages((prev) => {
        const finalMsg = {
          key: currentStreamKey,
          role: 'assistant',
          content: finalText,
          streaming: false,
          diagramCreated: false,
        };
        const withoutStream = prev.filter(m => m.key !== currentStreamKey);
        return [...withoutStream, finalMsg];
      });

      if (blocks.length > 0) {
        const rendered = await renderMerfolkToScene(blocks, spaceId, user);
        if (rendered) {
          setPlanMessages((prev) =>
            prev.map(m =>
              m.key === currentStreamKey
                ? { ...m, diagramCreated: true }
                : m
            )
          );
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      const msg = err.message || 'Failed to reach LLM. Check your connection.';
      setLlmError(msg);
      if (/401|auth|invalid api key/i.test(msg)) {
        setAuthError(msg);
      }
      setPlanMessages((prev) => prev.filter(m => m.key !== currentStreamKey));
    } finally {
      setStreaming(false);
      streamingRef.current = '';
      abortControllerRef.current = null;
    }
  }, [input, streaming, planMessages, spaceId, user, activePlanTextId]);

  const handleCodeSend = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    setLlmError(null);
    setInput('');
    isNearBottomRef.current = true;

    const userMessage = { role: 'user', content: text };
    const updatedMessages = [...codeMessages, userMessage];
    setCodeMessages(updatedMessages);

    const sceneObjects = useObjectsStore.getState().objects;

    setStreaming(true);
    streamingRef.current = '';
    const currentStreamKey = `code-stream-${Date.now()}`;
    streamingMsgKeyRef.current = currentStreamKey;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      let repoContext = null;
      if (selectedRepo && selectedBranch) {
        const _cs = useCodeStore.getState();
        if (_cs.repoFileTree) {
          repoContext = { fileTree: _cs.repoFileTree, fileContents: _cs.repoFileContents || {} };
        } else {
          const token = getGithubToken();
          if (token) {
            const owner = selectedRepo.owner?.login || selectedRepo.owner;
            const repoName = selectedRepo.name;
            const branchName = selectedBranch;
            repoContext = await fetchRepoContext(token, owner, repoName, branchName);
            useCodeStore.getState().setRepoContext(repoContext.fileTree, repoContext.fileContents);
          }
        }
      }

      const codeGenMessages = await buildCodeGenMessages({
        userRequest: text,
        sceneObjects,
        techStack,
        repoContext,
      });

      await populateContentStore();
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(() => finalizeContentStore());
      } else {
        setTimeout(() => finalizeContentStore(), 100);
      }

      const codeResponse = await sendWithRetrieval({
        messages: codeGenMessages,
        signal: abortController.signal,
        onChunk: (delta, fullText) => {
          streamingRef.current = fullText;
          setCodeMessages((prev) => {
            const streamMsg = {
              key: currentStreamKey,
              role: 'assistant',
              content: fullText,
              streaming: true,
            };
            const withoutStreaming = prev.filter(m => m.key !== currentStreamKey);
            return [...withoutStreaming, streamMsg];
          });
        },
        onRetrieval: ({ chunkIds, round }) => {
          console.log(`[Context] Code retrieval round ${round}: ${chunkIds.length} chunks`);
        },
      });

      setCodeMessages((prev) => {
        const finalMsg = {
          key: currentStreamKey,
          role: 'assistant',
          content: codeResponse,
          streaming: false,
        };
        const withoutStream = prev.filter(m => m.key !== currentStreamKey);
        return [...withoutStream, finalMsg];
      });

      const codeBlocks = extractCodeBlocks(codeResponse);

      if (codeBlocks.length > 0 && selectedRepo && selectedBranch) {
        const token = getGithubToken();
        if (token) {
          const owner = selectedRepo.owner?.login || selectedRepo.owner;
          const repoName = selectedRepo.name;
          const branchName = selectedBranch;

          const { count } = await associateCodeWithScene(codeBlocks, spaceId, user);
          setAssociatedCount(count);

          const result = await pushCodeToGitHub(codeBlocks, owner, repoName, branchName, token);

          if (result.success) {
            const _cs2 = useCodeStore.getState();
            const updatedContents = { ...(_cs2.repoFileContents || {}) };
            for (const block of codeBlocks) {
              if (block.filePath && block.code) {
                updatedContents[block.filePath] = block.code;
              }
            }
            _cs2.setRepoContext(_cs2.repoFileTree, updatedContents);
          }

          const commitKey = `commit-${Date.now()}`;
          if (result.success) {
            setCodeMessages((prev) => [...prev, {
              key: commitKey,
              role: 'system',
              type: 'commit',
              content: `Committed ${result.pushed} file(s) to ${owner}/${repoName}:${branchName}`,
              branch: branchName,
            }]);
          } else {
            setCodeMessages((prev) => [...prev, {
              key: commitKey,
              role: 'system',
              type: 'commit-error',
              content: `Committed ${result.pushed}/${codeBlocks.length} file(s) to ${owner}/${repoName}:${branchName}${result.errors?.length ? ` — ${result.errors[0].error}` : ''}`,
              branch: branchName,
            }]);
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      const msg = err.message || 'Failed to reach LLM. Check your connection.';
      setLlmError(msg);
      if (/401|auth|invalid api key/i.test(msg)) {
        setAuthError(msg);
      }
      setCodeMessages((prev) => prev.filter(m => m.key !== currentStreamKey));
    } finally {
      setStreaming(false);
      streamingRef.current = '';
      abortControllerRef.current = null;
    }
  }, [input, streaming, codeMessages, spaceId, user, selectedRepo, selectedBranch, techStack]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (chatMode === 'group') handleSend();
        else if (chatMode === 'plan') handlePlanSend();
        else handleCodeSend();
      }
    },
    [chatMode, handleSend, handlePlanSend, handleCodeSend]
  );

  const handleModeSwitch = useCallback((mode) => {
    setChatMode(mode);
    persistMode(spaceId, mode);
    setLlmError(null);
    setAuthError(null);
    setAssociatedCount(0);
    setPushNotification(null);

    if (mode === 'code' && !techStack) {
      setShowTechStackPrompt(true);
    }
  }, [spaceId, techStack]);

  const handleCreatePlan = useCallback(async () => {
    let container = planContainer || await createPlanContainer(user, spaceId);
    if (!container) return;
    const existingPlans = findPlanTextObjects(container.id);
    const title = planTitleInput.trim() || generatePlanTitle(existingPlans.length);
    const result = await createPlanTextObject(container, title, user, spaceId);
    setActivePlanTextId(result.textObj.id);
    setPlanContainer(result.container);
    setPlanTextObjects(prev => [...prev, result.textObj]);
    setShowNewPlanPrompt(false);
    setPlanTitleInput('');
  }, [planContainer, user, spaceId, planTitleInput]);

  const handlePlanSelect = useCallback((e) => {
    setActivePlanTextId(e.target.value);
  }, []);

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  useEffect(() => {
    const isAuth = isGithubAuthenticated();
    if (isAuth !== githubConnected) {
      useCodeStore.getState().setGithubConnected(isAuth);
    }
  }, [githubConnected]);

  useEffect(() => {
    if (!showBranchPrompt) return;
    if (branchStrategy !== 'existing') return;

    const repo = selectedRepo;
    if (!repo) return;
    const owner = repo.owner?.login || repo.owner;
    const repoName = repo.name;
    const token = getGithubToken();
    if (!token) return;

    setBranchFetching(true);
    listBranches(token, owner, repoName)
      .then(branches => {
        setAvailableBranches(branches || []);
        if (branches?.length > 0) {
          setBranchNameInput(branches[0].name);
        }
      })
      .catch(() => setAvailableBranches([]))
      .finally(() => setBranchFetching(false));
  }, [showBranchPrompt, branchStrategy, selectedRepo]);

  const handleTechStackSubmit = () => {
    const stack = techStackInput.trim();
    if (stack) {
      useCodeStore.getState().setTechStack(stack, 'user');
    } else {
      useCodeStore.getState().setTechStack('Let the LLM decide what tech stack is best for this architecture', 'llm');
    }
    setShowTechStackPrompt(false);
    setTechStackInput('');
  };

  const handleApiKeySubmit = useCallback(async () => {
    const key = apiKeyInput.trim();
    if (!key || !pendingProviderId) return;
    setFetchingModels(true);
    setModelFetchError(null);
    try {
      const models = await fetchModels(pendingProviderId, key);
      llmStore.setProviderId(pendingProviderId);
      llmStore.setApiKey(key);
      setProviderModels(models);
      setShowApiKeyInput(false);
      setShowProviderModal(false);
      setAuthError(null);
      setLlmError(null);
      if (models.length > 0) {
        setShowModelDropdown(true);
      } else {
        setShowManualModelInput(true);
        setManualModelInput('');
      }
    } catch (err) {
      setModelFetchError(err.message);
    } finally {
      setFetchingModels(false);
    }
  }, [apiKeyInput, pendingProviderId]);

  const handleManualModelSubmit = () => {
    const model = manualModelInput.trim();
    if (model) {
      llmStore.setSelectedModel(model);
    }
    setShowManualModelInput(false);
    setManualModelInput('');
    setProviderModels([]);
    setShowProviderModal(false);
    setShowModelDropdown(false);
  };

  const handleModelSelect = (modelId) => {
    llmStore.setSelectedModel(modelId);
    setProviderModels([]);
    setShowModelDropdown(false);
  };

  const handleModelButtonClick = useCallback(async () => {
    if (!llmStore.providerId || !llmStore.apiKey) {
      setShowProviderModal(true);
      return;
    }
    if (showModelDropdown) {
      setShowModelDropdown(false);
      return;
    }
    setFetchingModels(true);
    setModelFetchError(null);
    try {
      const models = await fetchModels(llmStore.providerId, llmStore.apiKey);
      setProviderModels(models);
      setShowModelDropdown(true);
    } catch (err) {
      setModelFetchError(err.message);
      setShowProviderModal(true);
    } finally {
      setFetchingModels(false);
    }
  }, [llmStore.providerId, llmStore.apiKey, showModelDropdown]);

  const handleGithubLogin = () => {
    window.location.href = getGithubOAuthUrl();
  };

  const handleFetchRepos = async () => {
    const token = getGithubToken();
    if (!token) return;
    try {
      const reposData = await fetchRepositories(token);
      setRepos(reposData);
    } catch {}
  };

  const handleSelectRepo = async (repo) => {
    useCodeStore.getState().setSelectedRepo(repo);
    setShowRepos(false);
    setShowBranchPrompt(true);
    await scanRepoForDiagram(repo);
  };

  const scanRepoForDiagram = async (repo) => {
    if (!repo || !user || !spaceId || !onCreateObject) return;
    setScanProgress({ stage: 'Starting scan...', progress: 0 });
    let lastProgressTime = 0;
    try {
      const result = await scanRepositoryAndGenerateDiagram(
        repo,
        onCreateObject,
        user,
        spaceId,
        uploadMarkdownToStorage,
        markdownDiagramService,
        (progress, stage) => {
          const now = Date.now();
          if (now - lastProgressTime > 300) {
            lastProgressTime = now;
            setScanProgress({ stage, progress });
          }
        }
      );
      if (result.success) {
        setScanProgress(null);
        setPushNotification({
          type: 'success',
          message: `Diagram created: ${result.objectsCreated} objects, ${result.connectionsCreated} connections`,
        });
        setTimeout(() => setPushNotification(null), 5000);

        const token = getGithubToken();
        if (token) {
          const owner = repo.owner?.login || repo.owner;
          const repoName = repo.name;
          const branch = selectedBranch || repo.default_branch || 'main';
          fetchRepoContext(token, owner, repoName, branch)
            .then(ctx => {
              const applyContext = async () => {
                useCodeStore.getState().setRepoContext(ctx.fileTree, ctx.fileContents);
                await populateContentStore();
                if (typeof requestIdleCallback === 'function') {
                  requestIdleCallback(() => finalizeContentStore());
                } else {
                  setTimeout(() => finalizeContentStore(), 100);
                }
              };
              const waitForMount = () => {
                const progress = useDiagramStore.getState().renderProgress;
                if (progress && progress.mounted < progress.total) {
                  requestIdleCallback(waitForMount);
                } else {
                  applyContext();
                }
              };
              if (typeof requestIdleCallback === 'function') {
                requestIdleCallback(waitForMount);
              } else {
                setTimeout(waitForMount, 100);
              }
            })
            .catch(err => console.warn('[scan] fetchRepoContext failed:', err.message, err.stack));
        }
      } else {
        setScanProgress(null);
        setPushNotification({ type: 'error', message: 'Failed to create diagram from repo.' });
        setTimeout(() => setPushNotification(null), 5000);
      }
    } catch (err) {
      setScanProgress(null);
      setPushNotification({ type: 'error', message: `Scan error: ${err.message}` });
      setTimeout(() => setPushNotification(null), 5000);
    }
  };

  const handleCreateNewRepo = async () => {
    const name = newRepoName.trim();
    if (!name) return;
    const token = getGithubToken();
    if (!token) return;
    try {
      const res = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, private: false, auto_init: true }),
      });
      if (!res.ok) throw new Error(`Failed to create repo: ${res.status}`);
      const repo = await res.json();
      useCodeStore.getState().setSelectedRepo(repo);
      setShowNewRepoInput(false);
      setNewRepoName('');
      setShowBranchPrompt(true);
      setPushNotification({ type: 'success', message: `Created repo ${name}` });
      setTimeout(() => setPushNotification(null), 3000);
    } catch (err) {
      setPushNotification({ type: 'error', message: err.message });
      setTimeout(() => setPushNotification(null), 5000);
    }
  };

  const handleBranchConfirm = async () => {
    const repo = selectedRepo;
    if (!repo) return;
    const owner = repo.owner?.login || repo.owner;
    const repoName = repo.name;
    const token = getGithubToken();
    if (!token) return;

    const strategy = branchStrategy;
    let branch = 'main';

    if (strategy === 'new') {
      const newBranch = branchNameInput.trim();
      if (!newBranch) return;
      try {
        const mainRef = await getBranchRef(token, owner, repoName, repo.default_branch || 'main');
        const sha = mainRef.data?.object?.sha;
        if (sha) await createBranchRef(token, owner, repoName, newBranch, sha);
        branch = newBranch;
      } catch (err) {
        setPushNotification({ type: 'error', message: `Failed to create branch: ${err.message}` });
        setTimeout(() => setPushNotification(null), 5000);
        return;
      }
    } else if (strategy === 'existing') {
      branch = branchNameInput.trim() || repo.default_branch || 'main';
    } else {
      branch = repo.default_branch || 'main';
    }

    useCodeStore.getState().setSelectedBranch(branch);
    setShowBranchPrompt(false);
    setBranchNameInput('');
    setPushNotification({ type: 'success', message: `Working in ${owner}/${repoName}:${branch}` });
    setTimeout(() => setPushNotification(null), 3000);
  };

  const getInputPlaceholder = () => {
    if (chatMode === 'group') return 'Send a message…';
    if (chatMode === 'plan') return 'Describe architecture or ask a question…';
    return 'Describe what code to generate…';
  };

  const getSendButtonLabel = () => {
    if (chatMode === 'group') return 'Send';
    if (chatMode === 'plan') return 'Send';
    return 'Generate code';
  };

  if (!isOpen) return null;

  return (
    <div
      className={`space-chat-window${isExpanded ? ' expanded' : ''}`}
      onClick={(e) => e.stopPropagation()}
      style={isExpanded ? undefined : { width: chatSize.width, height: chatSize.height, ...(userResized && chatSize.userRight ? { right: chatSize.userRight } : {}) }}
    >
      <div className="space-chat-header">
        <div className="space-chat-mode-toggle">
          <button
            className={`space-chat-mode-btn ${chatMode === 'group' ? 'active' : ''}`}
            onClick={() => handleModeSwitch('group')}
          >
            Group
          </button>
          <button
            className={`space-chat-mode-btn ${chatMode === 'plan' ? 'active' : ''}`}
            onClick={() => handleModeSwitch('plan')}
          >
            Plan
          </button>
          <button
            className={`space-chat-mode-btn ${chatMode === 'code' ? 'active' : ''}`}
            onClick={() => handleModeSwitch('code')}
          >
            Code
          </button>
        </div>
        <div className="space-chat-header-actions">
          {chatMode === 'code' && (
            <button
              className="space-chat-github-btn"
              onClick={() => setShowGithubPanel(v => !v)}
              title="GitHub"
            >
              {githubConnected ? '◉' : '○'}
            </button>
          )}
          <button
            className="space-chat-expand"
            onClick={() => setIsExpanded(v => !v)}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '⤡' : '⤢'}
          </button>
          {onClose && (
            <button
              className="space-chat-close"
              onClick={onClose}
              title="Close chat"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {!isExpanded && (
        <>
          <div className="space-chat-resize-handle space-chat-resize-right" onMouseDown={(e) => handleResizeStart('right', e)} />
          <div className="space-chat-resize-handle space-chat-resize-bottom" onMouseDown={(e) => handleResizeStart('bottom', e)} />
          <div className="space-chat-resize-handle space-chat-resize-corner" onMouseDown={(e) => handleResizeStart('corner', e)} />
        </>
      )}

      {showTechStackPrompt && (
        <div className="space-chat-modal-overlay" onClick={() => {}}>
          <div className="space-chat-modal" onClick={e => e.stopPropagation()}>
            <div className="space-chat-modal-title">Select Tech Stack</div>
            <div className="space-chat-modal-body">
              <p>What language/framework should the code use?</p>
              <input
                className="space-chat-modal-input"
                type="text"
                placeholder="e.g., React + TypeScript, Python + FastAPI, Go"
                value={techStackInput}
                onChange={e => setTechStackInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleTechStackSubmit(); }}
                autoFocus
              />
              <div className="space-chat-modal-actions">
                <button className="space-chat-modal-btn" onClick={() => { useCodeStore.getState().setTechStack('', 'llm'); setShowTechStackPrompt(false); }}>
                  Let LLM decide
                </button>
                <button className="space-chat-modal-btn primary" onClick={handleTechStackSubmit}>
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNewPlanPrompt && chatMode === 'plan' && (
        <div className="space-chat-modal-overlay" onClick={() => {}}>
          <div className="space-chat-modal" onClick={e => e.stopPropagation()}>
            <div className="space-chat-modal-title">
              {planContainer ? 'New Plan' : 'Start Planning'}
            </div>
            <div className="space-chat-modal-body">
              <p>
                {planContainer
                  ? 'Enter a title for your new plan'
                  : 'Create your first architecture plan?'}
              </p>
              <input
                className="space-chat-modal-input"
                type="text"
                placeholder={generatePlanTitle(planTextObjects.length)}
                value={planTitleInput}
                onChange={e => setPlanTitleInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreatePlan(); }}
                autoFocus
              />
              <div className="space-chat-modal-actions">
                <button className="space-chat-modal-btn" onClick={() => setShowNewPlanPrompt(false)}>
                  Cancel
                </button>
                <button className="space-chat-modal-btn primary" onClick={handleCreatePlan}>
                  {planContainer ? 'Create' : 'Start Planning'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBranchPrompt && (
        <div className="space-chat-modal-overlay" onClick={() => {}}>
          <div className="space-chat-modal" onClick={e => e.stopPropagation()}>
            <div className="space-chat-modal-title">Commit Strategy</div>
            <div className="space-chat-modal-body">
              <p>How should code be committed to {selectedRepo?.name}?</p>
              <div className="space-chat-modal-options">
                <label className="space-chat-modal-option">
                  <input
                    type="radio"
                    name="branchStrategy"
                    checked={branchStrategy === 'main'}
                    onChange={() => useCodeStore.getState().setBranchStrategy('main')}
                  />
                  <span>Commit to main/master</span>
                </label>
                <label className="space-chat-modal-option">
                  <input
                    type="radio"
                    name="branchStrategy"
                    checked={branchStrategy === 'new'}
                    onChange={() => useCodeStore.getState().setBranchStrategy('new')}
                  />
                  <span>Create new branch</span>
                </label>
                <label className="space-chat-modal-option">
                  <input
                    type="radio"
                    name="branchStrategy"
                    checked={branchStrategy === 'existing'}
                    onChange={() => useCodeStore.getState().setBranchStrategy('existing')}
                  />
                  <span>Select existing branch</span>
                </label>
              </div>
              {branchStrategy === 'new' && (
                <input
                  className="space-chat-modal-input"
                  type="text"
                  placeholder="New branch name…"
                  value={branchNameInput}
                  onChange={e => setBranchNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleBranchConfirm(); }}
                  autoFocus
                />
              )}
              {branchStrategy === 'existing' && (
                <select
                  className="space-chat-modal-input space-chat-modal-select"
                  value={branchNameInput}
                  onChange={e => setBranchNameInput(e.target.value)}
                  disabled={branchFetching}
                  autoFocus
                >
                  {branchFetching ? (
                    <option value="">Loading branches…</option>
                  ) : availableBranches.length === 0 ? (
                    <option value="">No branches found</option>
                  ) : (
                    availableBranches.map(b => (
                      <option key={b.name} value={b.name}>{b.name}</option>
                    ))
                  )}
                </select>
              )}
              <div className="space-chat-modal-actions">
                <button className="space-chat-modal-btn primary" onClick={handleBranchConfirm}>
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GitHub Panel */}
      {showGithubPanel && chatMode === 'code' && (
        <div className="space-chat-github-panel">
          {!githubConnected ? (
            <button className="github-login-button" onClick={handleGithubLogin}>
              Connect to GitHub
            </button>
          ) : (
            <div className="space-chat-github-connected">
              {selectedRepo ? (
                <div className="space-chat-repo-info">
                  <span className="space-chat-repo-name">
                    {selectedRepo.full_name || selectedRepo.name}
                  </span>
                  <span className="space-chat-branch-name">:{selectedBranch}</span>
                  <button
                    className="space-chat-small-btn"
                    onClick={() => setShowBranchPrompt(true)}
                    title="Switch branch"
                  >
                    Switch
                  </button>
                </div>
              ) : (
                <div className="space-chat-repo-select">
                  <button
                    className="space-chat-small-btn"
                    onClick={() => { handleFetchRepos(); setShowRepos(v => !v); }}
                  >
                    {showRepos ? 'Hide repos' : 'Select repo'}
                  </button>
                  <button
                    className="space-chat-small-btn"
                    onClick={() => setShowNewRepoInput(v => !v)}
                  >
                    New repo
                  </button>
                  {showRepos && (
                    <div className="space-chat-repo-list">
                      {repos.map(repo => (
                        <button
                          key={repo.id}
                          className="space-chat-repo-item"
                          onClick={() => handleSelectRepo(repo)}
                        >
                          {repo.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {showNewRepoInput && (
                    <div className="space-chat-new-repo">
                      <input
                        type="text"
                        placeholder="Repository name"
                        value={newRepoName}
                        onChange={e => setNewRepoName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleCreateNewRepo(); }}
                      />
                      <button className="space-chat-small-btn" onClick={handleCreateNewRepo}>
                        Create
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div
        className="space-chat-messages"
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        {chatMode === 'group' && (
          <>
            {loadingMore && <div className="space-chat-load-more">Loading…</div>}
            {!loadingMore && !hasMore && messages.length > 0 && (
              <div className="space-chat-load-more">Beginning of chat</div>
            )}
            {messages.length === 0 && !loadingMore && (
              <div className="space-chat-empty">No messages yet. Say hello!</div>
            )}
            {messages.map((msg) => {
              const ownId = user ? user.uid : getGuestId();
              const isOwn = msg.userId === ownId;
              return (
                <div key={msg.key} className={`space-chat-message ${isOwn ? 'own' : ''}`}>
                  {!isOwn && (
                    <div className="space-chat-avatar" title={msg.displayName || 'User'}>
                      {msg.photoURL ? (
                        <img src={msg.photoURL} alt={msg.displayName} referrerPolicy="no-referrer"
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                      ) : null}
                      <span style={{ display: msg.photoURL ? 'none' : 'flex' }}>
                        {senderInitials(msg.displayName)}
                      </span>
                    </div>
                  )}
                  <div className="space-chat-bubble-wrap">
                    {!isOwn && <div className="space-chat-name">{msg.displayName || 'User'}</div>}
                    <div className="space-chat-bubble">{msg.text}</div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {(chatMode === 'plan' || chatMode === 'code') && (
          <>
            {llmMessages.length === 0 && !streaming && (
              <div className="space-chat-empty">
                {chatMode === 'plan' ? (
                  <>
                    Ask me about software architecture or create a diagram.
                    <br /><br />
                    Try: &quot;Create a microservices e-commerce architecture&quot;
                  </>
                ) : (
                  <>
                    Generate code from your architecture diagram.
                    <br /><br />
                    {techStack ? (
                      <>Tech stack: {techStack}</>
                    ) : (
                      <>I&apos;ll ask about your tech stack first.</>
                    )}
                  </>
                )}
              </div>
            )}
            {llmError && <div className="space-chat-error">{llmError}</div>}
            {authError && (
              <div className="space-chat-auth-error">
                <span>Invalid API key for {llmStore.providerId ? PROVIDERS.find(p => p.id === llmStore.providerId)?.name || llmStore.providerId : 'provider'}</span>
                <button
                  className="space-chat-auth-error-btn"
                  onClick={() => {
                    setAuthError(null);
                    setLlmError(null);
                    setShowProviderModal(true);
                  }}
                >
                  Configure
                </button>
                <button
                  className="space-chat-auth-error-dismiss"
                  onClick={() => setAuthError(null)}
                >
                  ✕
                </button>
              </div>
            )}
            {streaming && !llmMessages.some(m => m.streaming) && (
              <div className="space-chat-loading">
                <span className="space-chat-spinner" />
                <span>Thinking…</span>
              </div>
            )}
            {pushNotification && (
              <div className={`space-chat-notification ${pushNotification.type}`}>
                {pushNotification.message}
              </div>
            )}
            {scanProgress && (
              <div className="space-chat-notification info">
                <span className="space-chat-spinner" />
                <span>{scanProgress.stage} ({scanProgress.progress}%)</span>
              </div>
            )}
            {associatedCount > 0 && chatMode === 'code' && (
              <div className="space-chat-notification success">
                Associated {associatedCount} file(s) with objects
              </div>
            )}
            {llmMessages.map((msg) => {
              if (msg.role === 'system') {
                return (
                  <div key={msg.key} className={`space-chat-commit ${msg.type === 'commit-error' ? 'error' : ''}`}>
                    {msg.type === 'commit' ? '✓' : '✕'} {msg.content}
                  </div>
                );
              }
              const isUser = msg.role === 'user';
              return (
                <div key={msg.key} className={`space-chat-message ${isUser ? 'own llm-user' : 'llm-assistant'}`}>
                  <div className="space-chat-bubble-wrap">
                    <div className="space-chat-bubble">
                      {msg.content}
                      {msg.streaming && <span className="space-chat-streaming-cursor" />}
                    </div>
                    {msg.diagramCreated && (
                      <div className="space-chat-merfolk-badge">✦ 3D diagram created</div>
                    )}
                    {msg.codeCreated && (
                      <div className="space-chat-merfolk-badge">✦ Code generated</div>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {(chatMode === 'plan' || chatMode === 'code') && (
        <div className="space-chat-model-bar">
          {chatMode === 'plan' && (
            <>
              <button
                className="space-chat-plan-new-btn"
                onClick={() => setShowNewPlanPrompt(true)}
                disabled={streaming}
                title="New Plan"
              >
                + Plan
              </button>
              {planTextObjects.length > 0 && (
                <select
                  className="space-chat-plan-select"
                  value={activePlanTextId || ''}
                  onChange={handlePlanSelect}
                >
                  {planTextObjects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.merfolkData?.title || p.headerText || 'Plan'}
                    </option>
                  ))}
                </select>
              )}
            </>
          )}
          <button
            className="space-chat-model-btn"
            onClick={() => setShowProviderModal(true)}
            disabled={streaming}
          >
            {llmStore.providerId
              ? PROVIDERS.find(p => p.id === llmStore.providerId)?.name || llmStore.providerId
              : 'Provider'}
            <span className="space-chat-model-arrow">▼</span>
          </button>
          <button
            className="space-chat-model-btn"
            onClick={handleModelButtonClick}
            disabled={streaming || fetchingModels}
          >
            {fetchingModels
              ? 'Loading…'
              : llmStore.selectedModel || 'Model'}
            <span className="space-chat-model-arrow">▼</span>
          </button>
        </div>
      )}

      {/* Provider Selection Modal */}
      {showProviderModal && !showApiKeyInput && (
        <div className="space-chat-modal-overlay" onClick={() => setShowProviderModal(false)}>
          <div className="space-chat-modal" onClick={e => e.stopPropagation()}>
            <div className="space-chat-modal-title">Select Provider</div>
            <div className="space-chat-provider-list">
              {PROVIDERS.map(p => (
                <button
                  key={p.id}
                  className={`space-chat-provider-option ${llmStore.providerId === p.id ? 'selected' : ''}`}
                    onClick={() => {
                    setPendingProviderId(p.id);
                    setApiKeyInput(llmStore.providerId === p.id && llmStore.apiKey ? llmStore.apiKey : '');
                    setShowApiKeyInput(true);
                  }}
                >
                  {p.name}
                  {llmStore.providerId === p.id && llmStore.apiKey && <span className="space-chat-model-check">✓</span>}
                </button>
              ))}
            </div>
            <div className="space-chat-modal-actions">
              <button className="space-chat-modal-btn" onClick={() => setShowProviderModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* API Key Input Modal */}
      {showApiKeyInput && (
        <div className="space-chat-modal-overlay" onClick={() => { setShowApiKeyInput(false); setShowProviderModal(false); }}>
          <div className="space-chat-modal" onClick={e => e.stopPropagation()}>
            <div className="space-chat-modal-title">
              {PROVIDERS.find(p => p.id === pendingProviderId)?.name || 'Provider'} API Key
            </div>
            <div className="space-chat-modal-body">
              <input
                className="space-chat-modal-input"
                type="password"
                placeholder={`Enter your ${PROVIDERS.find(p => p.id === pendingProviderId)?.name || ''} API key…`}
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleApiKeySubmit(); }}
                autoFocus
              />
              {modelFetchError && <div className="space-chat-provider-error">{modelFetchError}</div>}
            </div>
            <div className="space-chat-modal-actions">
              <button className="space-chat-modal-btn" onClick={() => { setShowApiKeyInput(false); setShowProviderModal(false); setModelFetchError(null); }}>Back</button>
              <button className="space-chat-modal-btn primary" onClick={handleApiKeySubmit} disabled={!apiKeyInput.trim() || fetchingModels}>
                {fetchingModels ? 'Loading…' : 'Fetch Models'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Model Selection Modal (loading) */}
      {fetchingModels && !modelFetchError && (
        <div className="space-chat-modal-overlay">
          <div className="space-chat-modal">
            <div className="space-chat-modal-title">Loading models…</div>
          </div>
        </div>
      )}

      {/* Model Selection Dropdown */}
      {showModelDropdown && providerModels.length > 0 && (
        <div className="space-chat-modal-overlay" onClick={() => { setShowModelDropdown(false); setProviderModels([]); }}>
          <div className="space-chat-modal" onClick={e => e.stopPropagation()}>
            <div className="space-chat-modal-title">Select Model</div>
            <div className="space-chat-provider-list">
              {providerModels.map(m => (
                <button
                  key={m.id}
                  className={`space-chat-provider-option ${llmStore.selectedModel === m.id ? 'selected' : ''}`}
                  onClick={() => handleModelSelect(m.id)}
                >
                  {m.name}
                  {llmStore.selectedModel === m.id && <span className="space-chat-model-check">✓</span>}
                </button>
              ))}
            </div>
            <div className="space-chat-modal-actions">
              <button className="space-chat-modal-btn" onClick={() => { setShowModelDropdown(false); setProviderModels([]); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showManualModelInput && (
        <div className="space-chat-modal-overlay" onClick={() => setShowManualModelInput(false)}>
          <div className="space-chat-modal" onClick={e => e.stopPropagation()}>
            <div className="space-chat-modal-title">Enter Model Name</div>
            <div className="space-chat-modal-body">
              <p>Could not fetch model list. Type your model name manually:</p>
              <input
                className="space-chat-modal-input"
                type="text"
                placeholder="e.g., gpt-4o, claude-3-opus-20240229"
                value={manualModelInput}
                onChange={e => setManualModelInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleManualModelSubmit(); }}
                autoFocus
              />
              <div className="space-chat-modal-actions">
                <button className="space-chat-modal-btn" onClick={() => setShowManualModelInput(false)}>Cancel</button>
                <button className="space-chat-modal-btn primary" onClick={handleManualModelSubmit} disabled={!manualModelInput.trim()}>
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-chat-input-row">
        <textarea
          ref={textareaRef}
          className="space-chat-input"
          rows={1}
          placeholder={getInputPlaceholder()}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={chatMode === 'group' ? 500 : 4000}
          disabled={chatMode !== 'group' && streaming}
        />
        <button
          className="space-chat-send"
          onClick={
            streaming
              ? handleStop
              : (chatMode === 'group' ? handleSend : chatMode === 'plan' ? handlePlanSend : handleCodeSend)
          }
          disabled={streaming ? false : (!input.trim() || (chatMode === 'group' ? sending : streaming))}
          title={streaming ? 'Stop' : getSendButtonLabel()}
        >
          {streaming ? '◼' : '➤'}
        </button>
      </div>
    </div>
  );
};

SpaceChat.displayName = 'SpaceChat';
export default SpaceChat;
