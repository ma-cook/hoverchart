import { useUIOverlayStore, useDiagramStore, useSpatialManagerStore } from '../stores';
import useConnectionStore from '../stores/connectionStore';
import useObjectsStore from '../stores/objectsStore';
import { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import {
  uploadModelToStorage,
  uploadMarkdownToStorage,
} from '../services/storageService';
import { screenRecorder } from '../services/screenRecordingService';
import { markdownDiagramService } from '../services/markdownDiagramService';
import { processCsvFile } from '../services/csvDiagramService';
import { setCellBoundariesVisible } from '../stores/uiOverlayStore';
import { clearAllObjectCaches, cleanupSpatialObjectSubscriptions } from '../services/spatialObjectsService';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import * as THREE from 'three';
import {
  handleGithubCallback,
  fetchRepositories as fetchGithubRepositories,
  isGithubAuthenticated as checkGithubAuth,
  getGithubOAuthUrl,
  scanRepositoryAndGenerateDiagram,
  rescanRepositoryForChanges,
} from '../services/githubRepoService';
import {
  scanWebsiteAndGenerateDiagram,
  validateScanUrl,
} from '../services/runtimeScanService';
import SpacePresenceAvatars from './SpacePresenceAvatars';
import SpaceChat from './SpaceChat';
import useEarthSettingsStore from '../stores/earthSettingsStore';
import usePipelineStore from '../stores/pipelineStore';
import { getPipelineTasks, getStatusColor, getStatusLabel, TASK_STATUS } from '../services/pipelineTaskService';
import { startPipeline, pausePipeline, resumePipeline, stopPipeline } from '../services/pipelineOrchestrator';
import { createRepoContainer, repositionIncomingTasks, findRepoContainer, assignRepoSlugToOrphanTasks } from '../services/repoContainerService';

const PRESET_LOCATIONS = [
  { name: 'Himalayas', lat: 27.99, lon: 86.93 },
  { name: 'Grand Canyon', lat: 36.1, lon: -112.1 },
  { name: 'Alps', lat: 46.85, lon: 9.83 },
  { name: 'Andes', lat: -13.16, lon: -72.55 },
  { name: 'Mariana Trench', lat: 11.35, lon: 142.2 },
  { name: 'Rockies', lat: 39.11, lon: -106.45 },
  { name: 'Great Rift Valley', lat: -1.95, lon: 36.0 },
  { name: 'Mid-Atlantic Ridge', lat: 23.0, lon: -45.0 },
];

const EarthSidebarSections = () => {
  const {
    radius, setRadius,
    exaggeration, setExaggeration,
    colorScheme, setColorScheme,
    showOceanFloor, setShowOceanFloor,
    lineWidth, setLineWidth,
    targetLatitude, setTargetLatitude,
    targetLongitude, setTargetLongitude,
  } = useEarthSettingsStore();

  const [globeOpen, setGlobeOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [displayOpen, setDisplayOpen] = useState(false);

  return (
    <>
      {/* Globe Settings */}
      <div className="template-section">
        <button
          className="template-toggle-button"
          onClick={() => setGlobeOpen((v) => !v)}
        >
          Globe Settings {globeOpen ? '▼' : '▶'}
        </button>
        {globeOpen && (
          <div className="template-dropdown">
            <div className="template-config">
              <div className="config-group">
                <label>Radius:</label>
                <input
                  type="number"
                  min="10"
                  max="500"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                />
              </div>
              <div className="config-group">
                <label>Altitude Exaggeration:</label>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={exaggeration}
                  onChange={(e) => setExaggeration(Number(e.target.value))}
                />
                <span style={{ fontSize: '12px', marginLeft: '6px' }}>{exaggeration}×</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Position Navigation */}
      <div className="template-section">
        <button
          className="template-toggle-button"
          onClick={() => setNavOpen((v) => !v)}
        >
          Position Navigation {navOpen ? '▼' : '▶'}
        </button>
        {navOpen && (
          <div className="template-dropdown">
            <div className="template-config">
              <div className="config-group">
                <label>Latitude:</label>
                <input
                  type="number"
                  min="-90"
                  max="90"
                  step="0.01"
                  value={targetLatitude}
                  onChange={(e) => setTargetLatitude(Number(e.target.value))}
                />
              </div>
              <div className="config-group">
                <label>Longitude:</label>
                <input
                  type="number"
                  min="-180"
                  max="180"
                  step="0.01"
                  value={targetLongitude}
                  onChange={(e) => setTargetLongitude(Number(e.target.value))}
                />
              </div>
              <div className="config-group">
                <label>Presets:</label>
                <select
                  value=""
                  onChange={(e) => {
                    const loc = PRESET_LOCATIONS.find((l) => l.name === e.target.value);
                    if (loc) {
                      setTargetLatitude(loc.lat);
                      setTargetLongitude(loc.lon);
                    }
                  }}
                >
                  <option value="" disabled>Select location…</option>
                  {PRESET_LOCATIONS.map((loc) => (
                    <option key={loc.name} value={loc.name}>{loc.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Display Settings */}
      <div className="template-section">
        <button
          className="template-toggle-button"
          onClick={() => setDisplayOpen((v) => !v)}
        >
          Display Settings {displayOpen ? '▼' : '▶'}
        </button>
        {displayOpen && (
          <div className="template-dropdown">
            <div className="template-config">
              <div className="config-group">
                <label>Color Scheme:</label>
                <select
                  value={colorScheme}
                  onChange={(e) => setColorScheme(e.target.value)}
                >
                  <option value="terrain">Terrain</option>
                  <option value="monochrome">Monochrome</option>
                  <option value="ocean">Ocean Emphasis</option>
                  <option value="elevation">Elevation Only</option>
                </select>
              </div>
              <div className="config-group">
                <label>Line Width:</label>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={lineWidth}
                  onChange={(e) => setLineWidth(Number(e.target.value))}
                />
                <span style={{ fontSize: '12px', marginLeft: '6px' }}>{lineWidth}px</span>
              </div>
              <div className="config-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showOceanFloor}
                    onChange={(e) => setShowOceanFloor(e.target.checked)}
                  />
                  Show Ocean Floor
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const UIOverlay = ({
  onCreateObject,

  user,
  onLogin,
  isAuthReady,
  isLoading,
  showLoginButton,
  isConnectMode,
  currentCell, // Add currentCell prop
  currentSpaceId, // Add currentSpaceId prop for model uploads
  trialMode, // Trial mode - no account, local-only objects
  spaceType = 'diagram', // Space type - 'diagram' or 'earth'
}) => {
  // Use UI overlay store
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [showRepos, setShowRepos] = useState(false);
  const [isGithubAuthenticated, setIsGithubAuthenticated] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [scanProgress, setScanProgress] = useState({ isScanning: false, progress: 0, stage: '' });
  const [notification, setNotification] = useState({ show: false, message: '' });
  const [currentDiagramRepo, setCurrentDiagramRepo] = useState(null);
  const [lastGeneratedMarkdown, setLastGeneratedMarkdown] = useState(null);
  const [latestMarkdownUrl, setLatestMarkdownUrl] = useState(null);
  const [lastCommitSha, setLastCommitSha] = useState(null);

  // Pipeline store state
  const pipelineIsRunning = usePipelineStore((s) => s.isRunning);
  const pipelineIsPaused = usePipelineStore((s) => s.isPaused);
  const pipelineAutoApprove = usePipelineStore((s) => s.autoApprove);
  const pipelineConnectedRepo = usePipelineStore((s) => s.connectedRepo);
  const pipelineConnectedRepos = usePipelineStore((s) => s.connectedRepos);
  const pipelineCurrentTaskId = usePipelineStore((s) => s.currentTaskId);
  const [selectedRepoSlugs, setSelectedRepoSlugs] = useState(new Set());

  // Pipeline tasks derived from objects store — stabilized reference
  const allObjects = useObjectsStore((s) => s.objects);
  const pipelineTasksRef = useRef([]);
  const pipelineTasks = useMemo(() => {
    const newTasks = getPipelineTasks(allObjects);
    const prev = pipelineTasksRef.current;
    // Stable reference: only update when task list actually changes
    if (
      newTasks.length === prev.length &&
      newTasks.every((t, i) => t.id === prev[i]?.id && t.merfolkData?.positioned === prev[i]?.merfolkData?.positioned && t.merfolkData?.repoSlug === prev[i]?.merfolkData?.repoSlug)
    ) {
      return prev;
    }
    pipelineTasksRef.current = newTasks;
    return newTasks;
  }, [allObjects]);
  const pipelineStatusCounts = useMemo(() => {
    const counts = {};
    for (const task of pipelineTasks) {
      const status = task.merfolkData?.status || TASK_STATUS.QUEUED;
      counts[status] = (counts[status] || 0) + 1;
    }
    return counts;
  }, [pipelineTasks]);

  // Restore pipeline state when space changes
  useEffect(() => {
    if (currentSpaceId && spaceType === 'github_control_panel') {
      usePipelineStore.getState().restoreState(currentSpaceId);
    }
  }, [currentSpaceId, spaceType]);

  // Auto-assign repoSlug to orphan tasks and reposition into containers.
  // CRITICAL: Both steps run in one synchronous pass so only ONE save
  // (with complete TextObject data) reaches Firebase.  An earlier design
  // saved partial data in step-1 and the 800ms throttle blocked the
  // full save in step-2, causing the snapshot to overwrite the store.
  useEffect(() => {
    if (spaceType !== 'github_control_panel') return;
    if (pipelineTasks.length === 0) return;

    // Step 1: Assign repoSlug to tasks that don't have one (in-memory only)
    let assignedSlug = null;
    const hasOrphans = pipelineTasks.some((t) => !t.merfolkData?.repoSlug);
    if (hasOrphans) {
      console.log('[UIOverlay] Found orphan tasks without repoSlug, assigning...');
      assignedSlug = assignRepoSlugToOrphanTasks();
      if (!assignedSlug) return; // No container exists yet
    }

    // Step 2: Reposition tasks that have repoSlug but haven't been positioned yet.
    // After step 1, the store already has updated repoSlugs (setState is sync),
    // so repositionIncomingTasks will find them with the correct slug.
    // Read fresh slugs from the store in case step 1 just assigned them.
    const freshTasks = getPipelineTasks(useObjectsStore.getState().objects || []);
    const repoSlugs = new Set(
      freshTasks.map((t) => t.merfolkData?.repoSlug).filter(Boolean)
    );
    for (const slug of repoSlugs) {
      const hasUnpositioned = freshTasks.some(
        (t) => t.merfolkData?.repoSlug === slug && !t.merfolkData?.positioned
      );
      const container = findRepoContainer(slug);
      if (hasUnpositioned && container) {
        console.log(`[UIOverlay] Repositioning tasks for ${slug}`);
        repositionIncomingTasks(slug);
      }
    }
  }, [pipelineTasks, spaceType]);

  // Load persisted repo + markdown URL for this space on mount / space change
  useEffect(() => {
    if (!currentSpaceId) {
      setCurrentDiagramRepo(null);
      setLatestMarkdownUrl(null);
      setLastGeneratedMarkdown(null);
      return;
    }
    let stored = null;
    try {
      stored = localStorage.getItem(`diagramRepo_${currentSpaceId}`);
      setCurrentDiagramRepo(stored ? JSON.parse(stored) : null);
    } catch {
      setCurrentDiagramRepo(null);
    }
    const localUrl = localStorage.getItem(`diagramMarkdownUrl_${currentSpaceId}`) || null;
    setLatestMarkdownUrl(localUrl);
    const localSha = localStorage.getItem(`diagramCommitSha_${currentSpaceId}`) || null;
    setLastCommitSha(localSha);
    setLastGeneratedMarkdown(null);

    // Hydrate any missing pieces from Firestore (cross-device support)
    const needsFirestoreFetch = !localUrl || !localSha || !stored;
    if (needsFirestoreFetch) {
      const spaceOwnerId = window.currentSpaceOwner || user?.uid;
      if (spaceOwnerId) {
        getDoc(doc(db, 'users', spaceOwnerId, 'spaces', currentSpaceId))
          .then((snap) => {
            if (!snap.exists()) return;
            const data = snap.data();
            if (!localUrl && data.markdownStorageUrl) {
              setLatestMarkdownUrl(data.markdownStorageUrl);
              localStorage.setItem(`diagramMarkdownUrl_${currentSpaceId}`, data.markdownStorageUrl);
            }
            if (!localSha && data.diagramCommitSha) {
              setLastCommitSha(data.diagramCommitSha);
            }
            if (!stored && data.diagramRepo) {
              setCurrentDiagramRepo(data.diagramRepo);
            }
          })
          .catch(() => { /* ignore – space doc may not exist */ });
      }
    }
  }, [currentSpaceId, user]);

  // Persist whenever the active repo changes
  useEffect(() => {
    if (!currentSpaceId) return;
    if (currentDiagramRepo) {
      localStorage.setItem(`diagramRepo_${currentSpaceId}`, JSON.stringify(currentDiagramRepo));
    } else {
      localStorage.removeItem(`diagramRepo_${currentSpaceId}`);
    }
  }, [currentDiagramRepo, currentSpaceId]);

  // Persist markdown storage URL whenever it changes
  useEffect(() => {
    if (!currentSpaceId) return;
    if (latestMarkdownUrl) {
      localStorage.setItem(`diagramMarkdownUrl_${currentSpaceId}`, latestMarkdownUrl);
    } else {
      localStorage.removeItem(`diagramMarkdownUrl_${currentSpaceId}`);
    }
  }, [latestMarkdownUrl, currentSpaceId]);

  // Persist commit SHA whenever it changes
  useEffect(() => {
    if (!currentSpaceId) return;
    if (lastCommitSha) {
      localStorage.setItem(`diagramCommitSha_${currentSpaceId}`, lastCommitSha);
    } else {
      localStorage.removeItem(`diagramCommitSha_${currentSpaceId}`);
    }
  }, [lastCommitSha, currentSpaceId]);

  const [chatOpen, setChatOpen] = useState(false);
  const [runtimeScanUrl, setRuntimeScanUrl] = useState('');
  const [runtimeScanDuration, setRuntimeScanDuration] = useState(10);
  const [lastScannedUrl, setLastScannedUrl] = useState(null);
  const toggleMenu = useUIOverlayStore((state) => state.toggleMenu);
  const toggleTemplate = useUIOverlayStore((state) => state.toggleTemplate);
  const updateTemplateConfig = useUIOverlayStore(
    (state) => state.updateTemplateConfig
  );

  // Operation states from store
  const isUploadingModel = useUIOverlayStore(
    (state) => state.getUIOverlay('main').isUploadingModel
  );
  const isProcessingMarkdown = useUIOverlayStore(
    (state) => state.getUIOverlay('main').isProcessingMarkdown
  );
  const isRecording = useUIOverlayStore(
    (state) => state.getUIOverlay('main').isRecording
  );
  const setIsUploadingModel = useUIOverlayStore(
    (state) => state.setIsUploadingModel
  );
  const setIsProcessingMarkdown = useUIOverlayStore(
    (state) => state.setIsProcessingMarkdown
  );
  const setIsRecording = useCallback(
    (val) => useUIOverlayStore.getState().setIsRecording('main', val),
    []
  );

  // Connection store for toggling connection visibility
  const connectionsVisible = useConnectionStore(
    (state) => state.connectionsVisible
  );
  const toggleConnectionsVisible = useConnectionStore(
    (state) => state.toggleConnectionsVisible
  );
  const resetConnections = useConnectionStore(
    (state) => state.resetConnections
  );
  const connectionCount = useConnectionStore(
    (state) => state.connections.length
  );
  const CONNECTION_RENDER_THRESHOLD = 100;
  const showConnectionsHint =
    connectionCount > CONNECTION_RENDER_THRESHOLD && !connectionsVisible;

  // Model upload functionality
  const modelFileInputRef = useRef(null);

  // Markdown upload functionality
  const markdownFileInputRef = useRef(null);

  // CSV upload functionality
  const csvFileInputRef = useRef(null);
  const [isProcessingCsv, setIsProcessingCsv] = useState(false);

  const cellBoundariesVisible = useUIOverlayStore((state) => {
    const overlay = state.overlays['main'];
    return overlay ? overlay.cellBoundariesVisible : false;
  });

  // 2D/3D view mode toggle
  const viewMode = useUIOverlayStore((state) => state.viewMode);
  const setViewMode = useUIOverlayStore((state) => state.setViewMode);
  const is2DReady = useDiagramStore((state) => state.is2DReady);

  // Hydrate diagramStore from stored markdown URL when loading an existing space
  useEffect(() => {
    if (!currentSpaceId || !latestMarkdownUrl || is2DReady) return;

    // Wait a short time for objects to start loading from Firebase
    const timer = setTimeout(async () => {
      // Double-check — another scan may have populated it in the meantime
      if (useDiagramStore.getState().is2DReady) return;

      try {
        const resp = await fetch(latestMarkdownUrl);
        if (!resp.ok) return;
        const content = await resp.text();
        await markdownDiagramService.hydrateStoreFromMarkdown(content);
      } catch (err) {
        console.warn('[UIOverlay] Could not hydrate 2D diagram from stored markdown:', err);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentSpaceId, latestMarkdownUrl, is2DReady]);

  // Add this handler function
  const handleCellBoundariesToggle = useCallback(() => {
    setCellBoundariesVisible('main', !cellBoundariesVisible);
  }, [cellBoundariesVisible]);

  // Function to fetch repositories using the GitHub service
  const fetchRepositories = async () => {
    const token = localStorage.getItem('github_token');
    if (!token) {
      alert('Please log in to GitHub first.');
      return;
    }

    try {
      const repos = await fetchGithubRepositories(token);
      setRepositories(repos);
    } catch (error) {
      console.error('Error fetching repositories:', error);
    }
  };

  // Function to scan repository and generate Merfolk diagram
  const fetchAppJsxFromRepo = async (repo) => {
    try {
      diagramIsBeingGenerated.current = true;
      setScanProgress({ isScanning: true, progress: 0, stage: 'Starting...' });
      
      const result = await scanRepositoryAndGenerateDiagram(
        repo,
        onCreateObject,
        user,
        currentSpaceId,
        uploadMarkdownToStorage,
        markdownDiagramService,
        (progress, stage) => {
          setScanProgress({ isScanning: true, progress, stage });
        }
      );
      
      setScanProgress({ isScanning: false, progress: 100, stage: 'Complete' });
      
      // Show notification instead of alert
      if (result.success) {
        setCurrentDiagramRepo(repo);
        if (result.markdown) setLastGeneratedMarkdown(result.markdown);
        if (result.storageUrl) {
          setLatestMarkdownUrl(result.storageUrl);
        }
        if (result.commitSha) setLastCommitSha(result.commitSha);

        // Persist diagram metadata to Firestore so rescan works across devices / after localStorage clear
        const spaceOwnerId = window.currentSpaceOwner || user?.uid;
        if (spaceOwnerId && currentSpaceId) {
          const payload = { diagramRepo: repo };
          if (result.storageUrl) payload.markdownStorageUrl = result.storageUrl;
          if (result.commitSha) payload.diagramCommitSha = result.commitSha;
          setDoc(doc(db, 'users', spaceOwnerId, 'spaces', currentSpaceId), payload, { merge: true }).catch(() => {});
        }

        setNotification({
          show: true,
          message: `Diagram created! Generated: ${result.objectsCreated} objects, ${result.connectionsCreated} connections`
        });
        
        // Auto-hide after 2 seconds
        setTimeout(() => {
          setNotification({ show: false, message: '' });
        }, 2000);
      }
    } catch (error) {
      console.error('Error generating diagram from repository:', error);
      setScanProgress({ isScanning: false, progress: 0, stage: '' });
      throw error;
    }
  };
  
  // Rescan: check for new commits and only process changed files
  const handleRescan = async (repo) => {
    try {
      setScanProgress({ isScanning: true, progress: 0, stage: 'Checking for changes...' });

      // Must have a commit SHA from the initial scan to compare against
      if (!lastCommitSha) {
        setScanProgress({ isScanning: false, progress: 0, stage: '' });
        setNotification({
          show: true,
          message: 'No previous scan commit found. Run a full scan first.',
        });
        setTimeout(() => setNotification({ show: false, message: '' }), 3000);
        return;
      }

      // Resolve existing markdown: prefer in-memory, then fetch from storage
      let existingMarkdown = lastGeneratedMarkdown;
      if (!existingMarkdown && latestMarkdownUrl) {
        try {
          const resp = await fetch(latestMarkdownUrl);
          existingMarkdown = await resp.text();
        } catch {
          console.warn('Could not fetch existing markdown from storage');
        }
      }

      // Must have existing markdown to merge into
      if (!existingMarkdown) {
        setScanProgress({ isScanning: false, progress: 0, stage: '' });
        setNotification({
          show: true,
          message: 'No existing diagram found. Run a full scan first.',
        });
        setTimeout(() => setNotification({ show: false, message: '' }), 3000);
        return;
      }

      const rescanResult = await rescanRepositoryForChanges(
        repo,
        lastCommitSha,
        existingMarkdown,
        (progress, stage) => {
          setScanProgress({ isScanning: true, progress, stage });
        },
      );

      // No changes detected
      if (rescanResult.noChanges) {
        setScanProgress({ isScanning: false, progress: 100, stage: 'Complete' });
        setLastCommitSha(rescanResult.commitSha);
        setNotification({
          show: true,
          message: rescanResult.message || `No changes detected in ${repo.name}`,
        });
        setTimeout(() => setNotification({ show: false, message: '' }), 3000);
        return;
      }

      // Process only the NEW merfolk entries to create new objects
      let storageUrl = null;
      if (user?.uid && currentSpaceId) {
        setScanProgress({ isScanning: true, progress: 50, stage: 'Uploading updated diagram...' });
        try {
          storageUrl = await uploadMarkdownToStorage(
            rescanResult.mergedMarkdown,
            user.uid,
            currentSpaceId,
            `${repo.name}-diagram.md`,
          );
        } catch (uploadErr) {
          console.error('Failed to upload merged markdown:', uploadErr);
        }
      }

      // Process the new merfolk section to create additional 3D objects
      diagramIsBeingGenerated.current = true;
      setScanProgress({ isScanning: true, progress: 65, stage: 'Creating new objects from changes...' });
      const newBlob = new Blob([rescanResult.newMerfolk], { type: 'text/markdown' });
      const newFile = new File([newBlob], `${repo.name}-changes.md`, { type: 'text/markdown' });

      const result = await markdownDiagramService.processMarkdownFile(
        newFile,
        onCreateObject,
        currentSpaceId,
        user,
      );

      setScanProgress({ isScanning: false, progress: 100, stage: 'Complete' });

      // Update stored state
      setLastCommitSha(rescanResult.commitSha);
      setLastGeneratedMarkdown(rescanResult.mergedMarkdown);
      if (storageUrl) {
        setLatestMarkdownUrl(storageUrl);
      }

      // Persist updated diagram metadata to Firestore
      const spaceOwnerId = window.currentSpaceOwner || user?.uid;
      if (spaceOwnerId && currentSpaceId) {
        const payload = { diagramRepo: repo };
        if (storageUrl) payload.markdownStorageUrl = storageUrl;
        if (rescanResult.commitSha) payload.diagramCommitSha = rescanResult.commitSha;
        setDoc(doc(db, 'users', spaceOwnerId, 'spaces', currentSpaceId), payload, { merge: true }).catch(() => {});
      }

      const parts = [];
      if (rescanResult.addedFiles > 0) parts.push(`${rescanResult.addedFiles} added`);
      if (rescanResult.modifiedFiles > 0) parts.push(`${rescanResult.modifiedFiles} modified`);
      if (rescanResult.removedFiles > 0) parts.push(`${rescanResult.removedFiles} removed`);
      const summary = parts.length ? parts.join(', ') : `${rescanResult.changedFileCount} changed`;

      setNotification({
        show: true,
        message: result.success
          ? `Rescan complete! Files: ${summary}. New objects: ${result.objectsCreated}, connections: ${result.connectionsCreated}`
          : `Rescan found changes (${summary}) but no new objects were created`,
      });
      setTimeout(() => setNotification({ show: false, message: '' }), 4000);
    } catch (error) {
      console.error('Error during rescan:', error);
      setScanProgress({ isScanning: false, progress: 0, stage: '' });
      setNotification({
        show: true,
        message: `Rescan failed: ${error.message}`,
      });
      setTimeout(() => setNotification({ show: false, message: '' }), 4000);
    }
  };

  // Download the latest generated markdown file
  const handleDownloadMarkdown = useCallback(async () => {
    const repoName = currentDiagramRepo?.name || 'diagram';
    const fileName = `${repoName}-diagram.md`;

    const triggerDownload = (content) => {
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    };

    if (lastGeneratedMarkdown) {
      triggerDownload(lastGeneratedMarkdown);
    } else if (latestMarkdownUrl) {
      try {
        const response = await fetch(latestMarkdownUrl);
        const text = await response.text();
        triggerDownload(text);
      } catch {
        alert('Failed to download markdown file.');
      }
    }
  }, [lastGeneratedMarkdown, latestMarkdownUrl, currentDiagramRepo]);

  // Click handler to dismiss notification
  const handleScreenClick = useCallback(() => {
    if (notification.show) {
      setNotification({ show: false, message: '' });
    }
  }, [notification.show]);

  // Scan a live website and generate a runtime diagram
  const handleRuntimeScan = async () => {
    const url = runtimeScanUrl.trim();
    const urlError = validateScanUrl(url);
    if (!urlError.valid) {
      setNotification({ show: true, message: urlError.error });
      setTimeout(() => setNotification({ show: false, message: '' }), 3000);
      return;
    }

    try {
      setScanProgress({ isScanning: true, progress: 0, stage: 'Validating URL...' });

      const result = await scanWebsiteAndGenerateDiagram(
        url,
        runtimeScanDuration,
        onCreateObject,
        user,
        currentSpaceId,
        uploadMarkdownToStorage,
        markdownDiagramService,
        (progress, stage) => {
          setScanProgress({ isScanning: true, progress, stage });
        },
      );

      setScanProgress({ isScanning: false, progress: 100, stage: 'Complete' });

      if (result.success) {
        setLastScannedUrl(url);
        if (result.markdown) setLastGeneratedMarkdown(result.markdown);
        if (result.storageUrl) {
          setLatestMarkdownUrl(result.storageUrl);
          const spaceOwnerId = window.currentSpaceOwner || user?.uid;
          if (spaceOwnerId && currentSpaceId) {
            setDoc(
              doc(db, 'users', spaceOwnerId, 'spaces', currentSpaceId),
              { markdownStorageUrl: result.storageUrl },
              { merge: true },
            ).catch(() => {});
          }
        }

        setNotification({
          show: true,
          message: `Runtime diagram created! Generated: ${result.objectsCreated} objects, ${result.connectionsCreated} connections`,
        });
        setTimeout(() => setNotification({ show: false, message: '' }), 3000);
      }
    } catch (error) {
      console.error('Error scanning website runtime:', error);
      setScanProgress({ isScanning: false, progress: 0, stage: '' });
      setNotification({ show: true, message: `Runtime scan failed: ${error.message}` });
      setTimeout(() => setNotification({ show: false, message: '' }), 4000);
    }
  };

  // Handle GitHub OAuth callback
  useEffect(() => {
    handleGithubCallback().then((token) => {
      if (token) {
        setIsGithubAuthenticated(true);
        fetchRepositories();
        alert('GitHub login successful!');
      }
    });
  }, []);

  // Check for existing GitHub token on mount
  useEffect(() => {
    setIsGithubAuthenticated(checkGithubAuth());
  }, []);

  const handleRecordClick = useCallback(async () => {
    if (isRecording) {
      // Stop recording
      try {
        const blob = await screenRecorder.stopRecording();
        if (blob) {
          screenRecorder.downloadRecording(blob);
        }
      } catch {
        alert('Failed to stop recording');
      } finally {
        setIsRecording(false);
      }
    } else {
      // Ask for confirmation before starting
      const confirmed = window.confirm(
        'Do you want to start recording your screen? You will be asked to select which screen or window to record.'
      );

      if (confirmed) {
        const success = await screenRecorder.startRecording();
        if (success) {
          setIsRecording(true);
        }
      }
    }
  }, [isRecording, setIsRecording]);

  // Sync React state when recording stops via browser's "Stop sharing" button
  useEffect(() => {
    const handler = () => setIsRecording(false);
    window.addEventListener('screenRecordingStopped', handler);
    return () => window.removeEventListener('screenRecordingStopped', handler);
  }, [setIsRecording]);

  // Get the resetObjects function from the objects store
  const resetObjects = useObjectsStore((state) => state.resetObjects);

  const handleDeleteAllCells = useCallback(async () => {
    if (!user?.uid || !currentSpaceId) {
      alert('You must be logged in to delete cells');
      return;
    }

    // Prevent concurrent delete operations
    if (window._bulkDeleteInProgress) {
      alert('A delete operation is already in progress. Please wait for it to finish.');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete ALL objects in this space? This action cannot be undone.'
    );

    if (!confirmed) return;

    // Double confirmation for safety
    const doubleConfirmed = window.confirm(
      'This will permanently delete all objects. Are you absolutely sure?'
    );

    if (!doubleConfirmed) return;

    setIsDeleting(true);

    // Set global flag to block stale snapshot re-adds during deletion.
    // Saves of new objects are still permitted — the per-save guard in
    // spatialObjectsService/spatialPartitioning has been removed so that newly
    // created objects can be persisted.  The backend cutoff protection (skipping
    // docs with lastUpdated > jobStartTime) ensures they are not deleted.
    window._bulkDeleteInProgress = true;

    const BULK_DELETE_URL = 'https://bulkdelete-qtk2xsi74a-uc.a.run.app';
    const POLL_INTERVAL_MS = 3000;
    const POLL_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

    const auth = getAuth();

    try {
      // --- Step 1: Clear local state immediately so UI is responsive ---
      clearAllObjectCaches();
      resetObjects();
      resetConnections();

      const loadedCellIds = Array.from(useSpatialManagerStore.getState().loadedCells ?? []);
      cleanupSpatialObjectSubscriptions(loadedCellIds);
      useSpatialManagerStore.getState().resetSpatialManager();

      setNotification({ show: true, message: '🗑️ Deleting space objects…' });

      // --- Step 2: Fire the cloud function — it returns jobId immediately ---
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error('Unable to get authentication token');

      const startRes = await fetch(BULK_DELETE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, userId: user.uid, spaceId: currentSpaceId }),
      });
      const startData = await startRes.json();
      if (!startRes.ok) throw new Error(startData.error || 'Bulk delete failed to start');

      const { jobId } = startData;

      // --- Step 3: Return UI control to the user ---
      // isDeleting stays true until the background job finishes so the button
      // remains disabled and prevents accidental concurrent operations.
      setCurrentDiagramRepo(null);

      // --- Step 4: Poll job status in the background ---
      const pollDeadline = Date.now() + POLL_TIMEOUT_MS;

      const pollStatus = async () => {
        if (Date.now() > pollDeadline) {
          setNotification({ show: true, message: '⚠️ Delete job timed out — check space manually.' });
          setTimeout(() => setNotification({ show: false, message: '' }), 5000);
          window._bulkDeleteInProgress = false;
          setIsDeleting(false);
          return;
        }

        try {
          const freshToken = await auth.currentUser?.getIdToken();
          const statusRes = await fetch(
            `${BULK_DELETE_URL}/job/${jobId}?idToken=${encodeURIComponent(freshToken)}&userId=${encodeURIComponent(user.uid)}&spaceId=${encodeURIComponent(currentSpaceId)}`
          );
          const statusData = await statusRes.json();

          if (statusData.status === 'done') {
            window._bulkDeleteInProgress = false;
            setIsDeleting(false);
            setNotification({
              show: true,
              message: `✅ Deleted ${statusData.cellsDeleted ?? 0} cells, ${statusData.objectsDeleted ?? 0} objects, ${statusData.connectionsDeleted ?? 0} connections.`,
            });
            setTimeout(() => setNotification({ show: false, message: '' }), 5000);
          } else if (statusData.status === 'error') {
            window._bulkDeleteInProgress = false;
            setIsDeleting(false);
            setNotification({ show: true, message: `❌ Delete job failed: ${statusData.error ?? 'unknown error'}` });
            setTimeout(() => setNotification({ show: false, message: '' }), 6000);
          } else {
            // Still running — poll again
            setTimeout(pollStatus, POLL_INTERVAL_MS);
          }
        } catch (pollErr) {
          console.warn('[BulkDelete] Poll error (retrying):', pollErr);
          setTimeout(pollStatus, POLL_INTERVAL_MS);
        }
      };

      // Start polling immediately for fast completions, then every POLL_INTERVAL_MS
      pollStatus();
    } catch (error) {
      console.error('Bulk delete error:', error);
      window._bulkDeleteInProgress = false;
      setIsDeleting(false);
      setNotification({ show: true, message: `❌ Error deleting space: ${error.message}` });
      setTimeout(() => setNotification({ show: false, message: '' }), 5000);
    }
  }, [user, currentSpaceId, resetObjects, resetConnections]);

  const handleModelUpload = useCallback(() => {
    if (modelFileInputRef.current) {
      modelFileInputRef.current.click();
    }
  }, []);

  const handleModelFileSelect = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file || !user?.uid || !currentSpaceId) {
        if (!user?.uid) {
          alert('You must be logged in to upload 3D models');
        }
        return;
      }

      // Validate file type
      const validExtensions = ['.glb', '.gltf'];
      const fileExtension = file.name
        .toLowerCase()
        .substring(file.name.lastIndexOf('.'));
      if (!validExtensions.includes(fileExtension)) {
        alert('Please select a GLB or GLTF file');
        return;
      }
      setIsUploadingModel(true);

      try {
        const modelUrl = await uploadModelToStorage(
          file,
          user.uid,
          currentSpaceId
        );

        // Get camera position and direction to position model 50 units in front
        let modelPosition = [0, 0, -50]; // Default fallback position

        try {
          // Try to get camera from various sources
          const camera =
            window.cameraRef?.current?.camera ||
            window.camera ||
            window.orbitControls?.object;

          if (camera) {
            // Get camera position and direction
            const cameraPosition = camera.position;
            const cameraDirection = new THREE.Vector3();
            camera.getWorldDirection(cameraDirection);

            // Position model 50 units in front of camera
            modelPosition = [
              cameraPosition.x + cameraDirection.x * 50,
              cameraPosition.y + cameraDirection.y * 50,
              cameraPosition.z + cameraDirection.z * 50,
            ];
          }
        } catch {
          // Using default position
        }

        // Create model object
        onCreateObject('model', modelPosition, { modelUrl });

        alert('3D model uploaded successfully!');
      } catch {
        alert('Failed to upload model. Please try again.');
      } finally {
        setIsUploadingModel(false);
        // Reset file input
        if (modelFileInputRef.current) {
          modelFileInputRef.current.value = '';
        }
      }
    },
    [user, currentSpaceId, onCreateObject, setIsUploadingModel]
  );

  const handleMarkdownUpload = useCallback(() => {
    if (markdownFileInputRef.current) {
      markdownFileInputRef.current.click();
    }
  }, []);

  const handleMarkdownFileSelect = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) {
        return;
      }

      setIsProcessingMarkdown(true);
      diagramIsBeingGenerated.current = true;

      try {
        const result = await markdownDiagramService.processMarkdownFile(
          file,
          onCreateObject,
          currentSpaceId,
          user
        );

        if (result.success) {
          // Objects and connections are rendered immediately
          // But wait for database save to complete before showing completion message
          if (result.savePromise) {
         
            await result.savePromise;
          }

          alert(
            `Successfully processed ${result.diagramCount} diagram(s) and created ${result.objectsCreated} 3D objects with ${result.connectionsCreated} connections!`
          );
        } else {
          alert(
            'No 3D objects were created. Please check that your Merfolk syntax is correct.'
          );
        }
      } catch (error) {
        alert(
          `Failed to process markdown file: ${error.message}. Please check the file format and try again.`
        );
      } finally {
        setIsProcessingMarkdown(false);
        // Reset file input
        if (markdownFileInputRef.current) {
          markdownFileInputRef.current.value = '';
        }
      }
    },
    [onCreateObject, currentSpaceId, user, setIsProcessingMarkdown]
  );

  // CSV upload handlers
  const handleCsvUpload = useCallback(() => {
    if (csvFileInputRef.current) {
      csvFileInputRef.current.click();
    }
  }, []);

  const handleCsvFileSelect = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsProcessingCsv(true);
      try {
        const result = await processCsvFile(file, onCreateObject, currentSpaceId, user);
        if (result.success) {
          setNotification({
            show: true,
            message: `CSV processed! Created ${result.objectsCreated} objects in ${result.groupCount} group(s). Sized by: ${result.numericColumn}`,
          });
          setTimeout(() => setNotification({ show: false, message: '' }), 4000);
        } else {
          setNotification({ show: true, message: 'No objects created from CSV. Check the file format.' });
          setTimeout(() => setNotification({ show: false, message: '' }), 3000);
        }
      } catch (error) {
        setNotification({ show: true, message: `CSV error: ${error.message}` });
        setTimeout(() => setNotification({ show: false, message: '' }), 4000);
      } finally {
        setIsProcessingCsv(false);
        if (csvFileInputRef.current) csvFileInputRef.current.value = '';
      }
    },
    [onCreateObject, currentSpaceId, user]
  );

  // Get store state for main overlay - use direct selectors for better reactivity
  const menuOpen = useUIOverlayStore((state) => {
    const overlay = state.overlays['main'];
    return overlay ? overlay.menuOpen : state.defaultOverlay.menuOpen;
  });
  const templateOpen = useUIOverlayStore((state) => {
    const overlay = state.overlays['main'];
    return overlay ? overlay.templateOpen : state.defaultOverlay.templateOpen;
  });
  const templateConfig = useUIOverlayStore((state) => {
    const overlay = state.overlays['main'];
    return overlay
      ? overlay.templateConfig
      : state.defaultOverlay.templateConfig;
  });
  const handleMenuToggle = () => {
    toggleMenu('main');
  };

  // Track whether the user has explicitly toggled visibility so auto-show doesn't override them
  const userHasManuallyToggled = useRef(false);
  // Suppress auto-show when a diagram was auto-generated (GitHub scan, markdown upload, etc.)
  const diagramIsBeingGenerated = useRef(false);

  const handleArrowClick = () => {
    userHasManuallyToggled.current = true;
    diagramIsBeingGenerated.current = false;
    toggleConnectionsVisible();
  };

  // Auto-show connections when there are 100 or fewer (on startup or after a GitHub scan)
  // Skip auto-show when a diagram was auto-generated or the space already has one,
  // and ALSO skip for shared / public spaces — visitors should land with the same
  // "connections off by default" view as authenticated users.
  useEffect(() => {
    if (userHasManuallyToggled.current) return;
    if (diagramIsBeingGenerated.current) return;
    if (latestMarkdownUrl) return;
    if (window.publicAccessSpace) return;
    if (connectionCount > 0 && connectionCount <= CONNECTION_RENDER_THRESHOLD && !connectionsVisible) {
      toggleConnectionsVisible();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionCount, latestMarkdownUrl]);

  // Pinned webcam overlay
  const pinnedWebcamPlaneId = useUIOverlayStore((state) => state.pinnedWebcamPlaneId);
  const clearPinnedWebcam = useUIOverlayStore((state) => state.clearPinnedWebcam);
  const pinnedVideoRef = useRef(null);
  const pinnedStreamRef = useRef(null);

  useEffect(() => {
    if (!pinnedWebcamPlaneId) {
      // Clean up stream when unpinned
      if (pinnedStreamRef.current) {
        pinnedStreamRef.current.getTracks().forEach((t) => t.stop());
        pinnedStreamRef.current = null;
      }
      if (pinnedVideoRef.current) {
        pinnedVideoRef.current.srcObject = null;
      }
      return;
    }

    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        pinnedStreamRef.current = stream;
        if (pinnedVideoRef.current) {
          pinnedVideoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error('Failed to get webcam for pinned overlay:', err);
      });

    return () => {
      cancelled = true;
      if (pinnedStreamRef.current) {
        pinnedStreamRef.current.getTracks().forEach((t) => t.stop());
        pinnedStreamRef.current = null;
      }
    };
  }, [pinnedWebcamPlaneId]);

  const handleUnpinWebcam = useCallback(() => {
    clearPinnedWebcam();
  }, [clearPinnedWebcam]);


  const handleTemplateConfigChange = (field, value) => {
    updateTemplateConfig('main', field, value);
  };

  const createTemplate = () => {
    const {
      objectType,
      numberOfObjects,
      distance,
      templateShape,
      orientation,
    } = templateConfig;

    // Get camera position and direction to position template 50 units in front
    let templateCenter = [0, 0, -50]; // Default fallback position

    try {
      // Try to get camera from various sources
      const camera =
        window.cameraRef?.current?.camera ||
        window.camera ||
        window.orbitControls?.object;

      if (camera) {
        // Get camera position
        const cameraPos = camera.position;

        // Get camera's forward direction
        const direction = { x: 0, y: 0, z: -1 };
        const quaternion = camera.quaternion;

        // Apply camera rotation to direction vector
        const rotatedDirection = {
          x:
            direction.x *
              (1 -
                2 *
                  (quaternion.y * quaternion.y + quaternion.z * quaternion.z)) +
            direction.y *
              2 *
              (quaternion.x * quaternion.y - quaternion.w * quaternion.z) +
            direction.z *
              2 *
              (quaternion.x * quaternion.z + quaternion.w * quaternion.y),
          y:
            direction.x *
              2 *
              (quaternion.x * quaternion.y + quaternion.w * quaternion.z) +
            direction.y *
              (1 -
                2 *
                  (quaternion.x * quaternion.x + quaternion.z * quaternion.z)) +
            direction.z *
              2 *
              (quaternion.y * quaternion.z - quaternion.w * quaternion.x),
          z:
            direction.x *
              2 *
              (quaternion.x * quaternion.z - quaternion.w * quaternion.y) +
            direction.y *
              2 *
              (quaternion.y * quaternion.z + quaternion.w * quaternion.x) +
            direction.z *
              (1 -
                2 *
                  (quaternion.x * quaternion.x + quaternion.y * quaternion.y)),
        };

        // Calculate template center 50 units in front of camera
        templateCenter = [
          cameraPos.x + rotatedDirection.x * 50,
          cameraPos.y + rotatedDirection.y * 50,
          cameraPos.z + rotatedDirection.z * 50,
        ];
      }
    } catch {
      // Using default position if camera access fails
    }
    if (templateShape === 'plane') {
      // Create objects in a grid pattern
      const gridSize = Math.ceil(Math.sqrt(numberOfObjects));
      let count = 0;

      for (let i = 0; i < gridSize && count < numberOfObjects; i++) {
        for (let j = 0; j < gridSize && count < numberOfObjects; j++) {
          let relativeX, relativeY, relativeZ;

          if (orientation === 'vertical') {
            // Vertical orientation - grid in Y-Z plane
            relativeY = (i - (gridSize - 1) / 2) * distance;
            relativeZ = (j - (gridSize - 1) / 2) * distance;
            relativeX = 0;
          } else {
            // Horizontal orientation - grid in X-Z plane (default)
            relativeX = (i - (gridSize - 1) / 2) * distance;
            relativeZ = (j - (gridSize - 1) / 2) * distance;
            relativeY = 0;
          }

          // Position relative to template center
          const absolutePosition = [
            templateCenter[0] + relativeX,
            templateCenter[1] + relativeY,
            templateCenter[2] + relativeZ,
          ];

          onCreateObject(objectType, absolutePosition);
          count++;
        }
      }
    } else if (templateShape === 'sphere') {
      // Create objects in a spherical pattern
      const radius = distance;
      const angleStep = (2 * Math.PI) / numberOfObjects;

      for (let i = 0; i < numberOfObjects; i++) {
        const angle = i * angleStep;
        let relativeX, relativeY, relativeZ;

        if (orientation === 'vertical') {
          // Vertical orientation - circle in Y-Z plane
          relativeY = radius * Math.cos(angle);
          relativeZ = radius * Math.sin(angle);
          relativeX = 0;
        } else {
          // Horizontal orientation - circle in X-Z plane (default)
          relativeX = radius * Math.cos(angle);
          relativeZ = radius * Math.sin(angle);
          relativeY = 0;
        }

        // Position relative to template center
        const absolutePosition = [
          templateCenter[0] + relativeX,
          templateCenter[1] + relativeY,
          templateCenter[2] + relativeZ,
        ];

        onCreateObject(objectType, absolutePosition);
      }
    } else if (templateShape === 'cube') {
      // Create objects in a cube pattern
      const cubeSize = Math.ceil(Math.cbrt(numberOfObjects));
      let count = 0;

      for (let i = 0; i < cubeSize && count < numberOfObjects; i++) {
        for (let j = 0; j < cubeSize && count < numberOfObjects; j++) {
          for (let k = 0; k < cubeSize && count < numberOfObjects; k++) {
            const relativeX = (i - (cubeSize - 1) / 2) * distance;
            const relativeY = (j - (cubeSize - 1) / 2) * distance;
            const relativeZ = (k - (cubeSize - 1) / 2) * distance;

            // Position relative to template center
            const absolutePosition = [
              templateCenter[0] + relativeX,
              templateCenter[1] + relativeY,
              templateCenter[2] + relativeZ,
            ];

            onCreateObject(objectType, absolutePosition);
            count++;
          }
        }
      }
    } // Close template menu after creation
    toggleTemplate('main');
  };

  if (!isAuthReady) {
    return <div className="ui-overlay">Initializing...</div>;
  }

  return (
    <>
      {/* Pinned webcam overlay */}
      {pinnedWebcamPlaneId && (
        <div className="pinned-webcam-overlay">
          <video
            ref={pinnedVideoRef}
            autoPlay
            playsInline
            muted
            className="pinned-webcam-video"
          />
          <button
            className="pinned-webcam-close"
            onClick={handleUnpinWebcam}
            title="Unpin webcam"
          >
            ✕
          </button>
        </div>
      )}
      {' '}
      <div className="menu-button-container">
        <button
          className="menu-button"
          onClick={handleMenuToggle}
          aria-label="Toggle menu"
        >
          ☰
        </button>
      </div>{' '}
      <div className={`sidebar-menu ${menuOpen ? 'open' : ''}`}>
        <div className="menu-content">
          <div className="current-cell-info">
            {spaceType === 'github_control_panel' && user?.uid && (
              <div style={{ fontSize: '11px', color: '#888' }}>
                <span>UUID: </span>
                <span style={{ fontFamily: 'monospace', userSelect: 'all' }}>{user.uid}</span>
              </div>
            )}
          </div>
          {/* Template Section */}{' '}
          {spaceType !== 'earth' && spaceType !== 'github_control_panel' && (
          <>
          <div className="template-section">
            <button
              className="template-toggle-button"
              onClick={() => toggleTemplate('main')}
            >
              Templates {templateOpen ? '▼' : '▶'}
            </button>

            {templateOpen && (
              <div className="template-dropdown">
                <div className="template-config">
                  <div className="config-group">
                    <label>Object Type:</label>{' '}
                    <select
                      value={templateConfig.objectType}
                      onChange={(e) =>
                        handleTemplateConfigChange('objectType', e.target.value)
                      }
                    >
                      <option value="cube">Cube</option>
                      <option value="tetrahedron">Tetrahedron</option>
                      <option value="dodecahedron">Dodecahedron</option>
                      <option value="plane">Plane</option>
                      <option value="text">Text</option>
                    </select>
                  </div>
                  <div className="config-group">
                    <label>Number of Objects:</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={templateConfig.numberOfObjects}
                      onChange={(e) =>
                        handleTemplateConfigChange(
                          'numberOfObjects',
                          parseInt(e.target.value)
                        )
                      }
                    />
                  </div>
                  <div className="config-group">
                    <label>Distance Between:</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={templateConfig.distance}
                      onChange={(e) =>
                        handleTemplateConfigChange(
                          'distance',
                          parseInt(e.target.value)
                        )
                      }
                    />
                  </div>{' '}
                  <div className="config-group">
                    <label>Template Shape:</label>
                    <select
                      value={templateConfig.templateShape}
                      onChange={(e) =>
                        handleTemplateConfigChange(
                          'templateShape',
                          e.target.value
                        )
                      }
                    >
                      <option value="plane">Plane</option>
                      <option value="sphere">Sphere</option>
                      <option value="cube">Cube</option>
                    </select>
                  </div>
                  <div className="config-group">
                    <label>Orientation:</label>
                    <select
                      value={templateConfig.orientation}
                      onChange={(e) =>
                        handleTemplateConfigChange(
                          'orientation',
                          e.target.value
                        )
                      }
                    >
                      <option value="horizontal">Horizontal</option>
                      <option value="vertical">Vertical</option>
                    </select>
                  </div>
                  <button
                    className="create-template-button"
                    onClick={createTemplate}
                  >
                    Create Template
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* Markdown Upload Section */}
          <div className="markdown-section">
            <button
              className="markdown-upload-button"
              onClick={handleMarkdownUpload}
              disabled={isProcessingMarkdown}
              title="Upload Markdown with Merfolk diagrams"
            >
              {isProcessingMarkdown ? 'Processing...' : '📄 Upload Markdown'}
            </button>
            {/* Hidden file input for markdown upload */}
            <input
              ref={markdownFileInputRef}
              type="file"
              accept=".md,.markdown"
              style={{ display: 'none' }}
              onChange={handleMarkdownFileSelect}
            />
            <button
              className="markdown-upload-button"
              onClick={handleDownloadMarkdown}
              disabled={!lastGeneratedMarkdown && !latestMarkdownUrl}
              title={lastGeneratedMarkdown || latestMarkdownUrl ? 'Download the latest generated diagram markdown' : 'No diagram generated yet'}
              style={{
                marginTop: '6px',
                opacity: lastGeneratedMarkdown || latestMarkdownUrl ? 1 : 0.45,
                cursor: lastGeneratedMarkdown || latestMarkdownUrl ? 'pointer' : 'not-allowed',
              }}
            >
              📥 Download Markdown
            </button>
          </div>
          {/* CSV Upload Section */}
          <div className="markdown-section">
            <button
              className="markdown-upload-button"
              onClick={handleCsvUpload}
              disabled={isProcessingCsv}
              title="Upload CSV to create a 3D data visualization"
            >
              {isProcessingCsv ? 'Processing...' : '📊 Upload CSV'}
            </button>
            <input
              ref={csvFileInputRef}
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleCsvFileSelect}
            />
          </div>
          {/* GitHub repo section */}
          {isGithubAuthenticated ? (
            <div className="github-repos-dropdown">
              <button
                className="repos-toggle-button"
                onClick={() => {
                  if (!showRepos) {
                    fetchRepositories(); // Fetch repositories only when opening the dropdown
                  }
                  setShowRepos((prev) => !prev); // Toggle visibility
                }}
              >
                {showRepos ? 'Hide Repositories' : 'Show Repositories'}
              </button>
              {showRepos && (
                <ul className="github-repos-list">
                  {repositories.map((repo) => (
                    <li key={repo.id} onClick={() => setSelectedRepo(repo)}>
                      {repo.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <button
              className="github-login-button"
              onClick={() => (window.location.href = getGithubOAuthUrl())}
            >
              Connect to GitHub
            </button>
          )}
          {/* Popup for selected repository */}
          {selectedRepo && (
            <div className="popup-overlay">
              <div className="popup-content">
                <p>Create diagram for {selectedRepo.name}</p>
                <button
                  onClick={async () => {
                    try {
                      await fetchAppJsxFromRepo(selectedRepo);
                      setSelectedRepo(null);
                    } catch (error) {
                      alert(`Failed to create diagram: ${error.message}`);
                    }
                  }}
                >
                  Yes
                </button>
                <button onClick={() => setSelectedRepo(null)}>No</button>
              </div>
            </div>
          )}
          {/* Runtime Website Scanner section */}
          {user && (
            <div className="runtime-scan-section">
              <p className="runtime-scan-label">Scan Live Website</p>
              <input
                className="runtime-scan-input"
                type="url"
                placeholder="https://example.com"
                value={runtimeScanUrl}
                onChange={(e) => setRuntimeScanUrl(e.target.value)}
                disabled={scanProgress.isScanning}
              />
              <div className="runtime-scan-controls">
                <select
                  className="runtime-scan-duration"
                  value={runtimeScanDuration}
                  onChange={(e) => setRuntimeScanDuration(Number(e.target.value))}
                  disabled={scanProgress.isScanning}
                  title="Capture duration"
                >
                  <option value={5}>5s</option>
                  <option value={10}>10s</option>
                  <option value={20}>20s</option>
                  <option value={30}>30s</option>
                </select>
                <button
                  className="runtime-scan-button"
                  onClick={handleRuntimeScan}
                  disabled={scanProgress.isScanning || !runtimeScanUrl.trim()}
                  title="Scan runtime behavior of the website"
                >
                  {scanProgress.isScanning ? 'Scanning...' : '🌐 Scan Runtime'}
                </button>
              </div>
              {lastScannedUrl && (
                <p className="runtime-scan-last" title={lastScannedUrl}>
                  Last: {lastScannedUrl.length > 35 ? `${lastScannedUrl.slice(0, 35)}…` : lastScannedUrl}
                </p>
              )}
            </div>
          )}
          </>
          )}
          {/* Github Control Panel Section */}
          {spaceType === 'github_control_panel' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '4px 0' }}>
              {/* GitHub Auth */}
              {isGithubAuthenticated ? (
                <div className="github-repos-dropdown">
                  <span style={{ color: '#28a745', fontSize: '14px' }}>✓ Connected to GitHub</span>
                </div>
              ) : (
                <button
                  className="github-login-button"
                  onClick={() => (window.location.href = getGithubOAuthUrl())}
                >
                  Connect to GitHub
                </button>
              )}

              {/* Repo Dropdown with Checkboxes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button
                  className="repos-toggle-button"
                  onClick={() => {
                    if (!showRepos) { fetchRepositories(); }
                    setShowRepos((prev) => !prev);
                  }}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    border: '1px solid #555',
                    borderRadius: '4px',
                    background: '#333',
                    color: '#eee',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {showRepos ? 'Hide Repositories ▼' : 'Show Repositories ▶'}
                </button>
                {showRepos && (
                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #444', borderRadius: '4px', background: '#1e1e1e' }}>
                    {repositories.map((repo) => {
                      const slug = `${repo.owner.login}/${repo.name}`;
                      const isSelected = selectedRepoSlugs.has(slug);
                      const alreadyConnected = pipelineConnectedRepos.some((r) => r.slug === slug);
                      return (
                        <label
                          key={repo.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '4px 8px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: alreadyConnected ? '#4caf50' : '#ccc',
                            background: isSelected ? '#2a3a4a' : 'transparent',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected || alreadyConnected}
                            disabled={alreadyConnected}
                            onChange={() => {
                              setSelectedRepoSlugs((prev) => {
                                const next = new Set(prev);
                                if (next.has(slug)) next.delete(slug);
                                else next.add(slug);
                                return next;
                              });
                            }}
                          />
                          {repo.name}
                          {alreadyConnected && <span style={{ fontSize: '10px', color: '#4caf50' }}>✓</span>}
                        </label>
                      );
                    })}
                  </div>
                )}
                {selectedRepoSlugs.size > 0 && (
                  <button
                    onClick={async () => {
                      // Compute camera position & forward direction
                      const camera =
                        window.cameraRef?.current?.camera ||
                        window.camera ||
                        window.orbitControls?.object;
                      let basePos = [0, 0, -100];
                      let rightDir = [1, 0, 0];
                      if (camera) {
                        const camPos = camera.position;
                        const fwd = new THREE.Vector3();
                        camera.getWorldDirection(fwd);
                        // Base position: 300 units in front of camera
                        basePos = [
                          camPos.x + fwd.x * 300,
                          camPos.y + fwd.y * 300,
                          camPos.z + fwd.z * 300,
                        ];
                        // Right vector for spacing multiple containers
                        const up = new THREE.Vector3(0, 1, 0);
                        const right = new THREE.Vector3().crossVectors(fwd, up).normalize();
                        // If camera looks straight up/down, fall back to world X
                        if (right.length() < 0.01) right.set(1, 0, 0);
                        rightDir = [right.x, right.y, right.z];
                      }

                      const slugs = [...selectedRepoSlugs];
                      const spacing = 50;
                      const totalWidth = (slugs.length - 1) * spacing;

                      for (let i = 0; i < slugs.length; i++) {
                        const [owner, repo] = slugs[i].split('/');
                        // Center the group: offset from -totalWidth/2 to +totalWidth/2
                        const offset = -totalWidth / 2 + i * spacing;
                        const pos = [
                          basePos[0] + rightDir[0] * offset,
                          basePos[1] + rightDir[1] * offset,
                          basePos[2] + rightDir[2] * offset,
                        ];
                        usePipelineStore.getState().addRepo(owner, repo);
                        await createRepoContainer(owner, repo, user, currentSpaceId, pos);
                      }
                      usePipelineStore.getState().persistState(currentSpaceId);
                      setSelectedRepoSlugs(new Set());
                    }}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      border: 'none',
                      borderRadius: '4px',
                      background: '#2196f3',
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    Create Containers ({selectedRepoSlugs.size})
                  </button>
                )}
              </div>

              {/* Connected Repos */}
              {pipelineConnectedRepos.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {pipelineConnectedRepos.map((r) => (
                    <span
                      key={r.slug}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        borderRadius: '12px',
                        background: '#2a3a2a',
                        color: '#4caf50',
                        border: '1px solid #4caf50',
                      }}
                    >
                      {r.repo}
                      <span
                        style={{ cursor: 'pointer', marginLeft: '2px' }}
                        onClick={() => {
                          usePipelineStore.getState().removeRepo(r.slug);
                          usePipelineStore.getState().persistState(currentSpaceId);
                        }}
                      >
                        ×
                      </span>
                    </span>
                  ))}
                </div>
              )}



              {/* Auto-approve toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#ccc', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={pipelineAutoApprove}
                  onChange={(e) => {
                    usePipelineStore.getState().setAutoApprove(e.target.checked);
                    usePipelineStore.getState().persistState(currentSpaceId);
                  }}
                />
                Auto-approve & merge PRs
              </label>
            </div>
          )}
          {/* Earth Space Sections */}
          {spaceType === 'earth' && (
            <EarthSidebarSections />
          )}
        </div>
      </div>
      <div className="ui-overlay" onClick={(e) => e.stopPropagation()}>
        {isLoading ? (
          <div>Loading...</div>
        ) : !user && !trialMode && showLoginButton ? (
          <div className="login-container">
            <button onClick={onLogin} className="login-button">
              Login with Google
            </button>
          </div>
        ) : (user || trialMode) ? (
          <>
            {/* In trial mode, show a login button in the top right */}
            {trialMode && !user && (
              <div style={{ marginBottom: '8px' }}>
                <button onClick={onLogin} className="login-button" style={{ fontSize: '12px', padding: '6px 12px' }}>
                  Login with Google
                </button>
              </div>
            )}
            <div className="tools-container">
              <button
                className="shape-button"
                onClick={() => onCreateObject('cube')}
                title="Add Cube"
              >
                □
              </button>
              <button
                className="shape-button"
                onClick={() => onCreateObject('tetrahedron')}
                title="Add Tetrahedron"
              >
                ▲
              </button>
              <button
                className="shape-button"
                onClick={() => onCreateObject('dodecahedron')}
                title="Add Dodecahedron"
              >
                ○
              </button>
              <button
                className="shape-button"
                onClick={() => onCreateObject('plane')}
                title="Add Plane"
              >
                ▭
              </button>
              <button
                className="shape-button"
                onClick={() => onCreateObject('text')}
                title="Add Text"
              >
                T
              </button>{' '}
              {!trialMode && (
                <button
                  className="shape-button"
                  onClick={handleModelUpload}
                  title="Add 3D Model"
                  disabled={isUploadingModel}
                >
                  {isUploadingModel ? '...' : '3D'}
                </button>
              )}
              {/* Hidden file input for model upload */}
              <input
                ref={modelFileInputRef}
                type="file"
                accept=".glb,.gltf"
                style={{ display: 'none' }}
                onChange={handleModelFileSelect}
              />
            </div>
          </>
        ) : null}

        {/* Comms container - sits below tools-container inside the right panel, hidden in trial mode */}
        {currentSpaceId && !trialMode && (
          <div className="coms-container">
            <button
              className="shape-button"
              onClick={() => setChatOpen((prev) => !prev)}
              title="Toggle Space Chat"
              style={{
                background: chatOpen ? 'rgba(74,144,217,0.2)' : undefined,
                borderColor: chatOpen ? '#4a90d9' : undefined,
                color: chatOpen ? '#4a90d9' : undefined,
              }}
            >
              💬
            </button>
          </div>
        )}
      </div>

      {/* Group chat window - pops out to the left of the right panel */}
      {!trialMode && <SpaceChat spaceId={currentSpaceId} user={user} isOpen={chatOpen} onClose={() => setChatOpen(false)} />}
      {/* Visual tools container positioned at bottom center */}
      {(user || trialMode) && (
        <div className="visual-tools-container" onClick={(e) => e.stopPropagation()}>
          <button
            className={`record-button ${isRecording ? 'recording' : ''}`}
            onClick={handleRecordClick}
            title={isRecording ? 'Stop Recording' : 'Start Recording'}
          >
            {isRecording ? '' : ''}
          </button>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {showConnectionsHint && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '110%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,0.75)',
                  color: '#fff',
                  fontSize: '11px',
                  whiteSpace: 'nowrap',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  pointerEvents: 'none',
                  zIndex: 9999,
                }}
              >
                Show connections
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    borderWidth: '4px',
                    borderStyle: 'solid',
                    borderColor: 'rgba(0,0,0,0.75) transparent transparent transparent',
                  }}
                />
              </div>
            )}
            <button
              className={`shape-button ${isConnectMode ? 'active' : ''}`}
              onClick={handleArrowClick}
              title="Toggle Connection Lines"
              style={{
                borderColor: connectionsVisible ? '' : 'orange',
                borderWidth: connectionsVisible ? '' : '2px',
              }}
            >
              ↗
            </button>
          </div>
          <button
            className={`shape-button ${cellBoundariesVisible ? 'active' : ''}`}
            onClick={handleCellBoundariesToggle}
            title="Toggle Cell Boundaries"
            style={{
              borderColor: cellBoundariesVisible ? '' : 'blue',
              borderWidth: cellBoundariesVisible ? '' : '2px',
            }}
          >
            ⬜
          </button>
          {is2DReady && (
            <button
              className={`shape-button ${viewMode === '2d' ? 'active' : ''}`}
              onClick={() => setViewMode(viewMode === '3d' ? '2d' : '3d')}
              title={viewMode === '3d' ? 'Switch to 2D Diagram' : 'Switch to 3D View'}
              style={{
                borderColor: viewMode === '2d' ? '#2196F3' : '',
                borderWidth: viewMode === '2d' ? '2px' : '',
                fontWeight: viewMode === '2d' ? 'bold' : 'normal',
              }}
            >
              {viewMode === '3d' ? '2D' : '3D'}
            </button>
          )}
          <button
            className="shape-button delete-all-button"
            onClick={handleDeleteAllCells}
            disabled={isDeleting}
            title="Delete All Objects in Space"
            style={{
              backgroundColor: isDeleting ? '#ccc' : '#ffebee',
              borderColor: '#f44336',
              color: '#f44336',
            }}
          >
            {isDeleting ? '...' : '🗑️'}
          </button>
          <button
            className="shape-button"
            onClick={() => handleRescan(currentDiagramRepo)}
            disabled={!currentDiagramRepo || scanProgress.isScanning}
            title={currentDiagramRepo?.name ? `Rescan ${currentDiagramRepo.name}` : 'No repo scanned yet'}
            style={{
              backgroundColor: currentDiagramRepo && !scanProgress.isScanning ? '#e8f5e9' : '#ccc',
              borderColor: currentDiagramRepo && !scanProgress.isScanning ? '#4caf50' : '#aaa',
              color: currentDiagramRepo && !scanProgress.isScanning ? '#4caf50' : '#aaa',
              opacity: currentDiagramRepo && !scanProgress.isScanning ? 1 : 0.5,
            }}
          >
            🔄
          </button>
        </div>
      )}


      
      {/* Loading bar for GitHub repo scanning */}
      {scanProgress.isScanning && (
        <div className="scan-progress-overlay">
          <div className="scan-progress-container">
            <div className="scan-progress-text">{scanProgress.stage}</div>
            <div className="scan-progress-bar">
              <div 
                className="scan-progress-fill" 
                style={{ width: `${scanProgress.progress}%` }}
              />
            </div>
            <div className="scan-progress-percentage">{Math.round(scanProgress.progress)}%</div>
          </div>
        </div>
      )}
      
      {/* Notification popup */}
      {notification.show && (
        <div className="notification-overlay" onClick={handleScreenClick}>
          <div className="notification-popup">
            <span className="notification-icon">✓</span>
            <span className="notification-message">{notification.message}</span>
          </div>
        </div>
      )}
      {/* Space presence avatars */}
      <SpacePresenceAvatars spaceId={currentSpaceId} currentCell={currentCell} />
    </>
  );
};

UIOverlay.displayName = 'UIOverlay';
export default UIOverlay;

