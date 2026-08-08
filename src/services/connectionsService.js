let _subscriptionsPaused = false;
let _pauseResolve = null;

export async function pauseConnectionListeners() {
  _subscriptionsPaused = true;
  return new Promise((resolve) => {
    _pauseResolve = resolve;
  });
}

export async function resumeConnectionListeners() {
  _subscriptionsPaused = false;
  if (_pauseResolve) {
    _pauseResolve();
    _pauseResolve = null;
  }
  wakeConnectionPolling();
}

// ── Adaptive polling ────────────────────────────────────────────────
// Poll fast while changes flow, back off toward MAX when nothing changes,
// and stop entirely while the tab is hidden. Local saves wake the poller
// so collaborative edits stay responsive.
const POLL_INTERVAL_FAST_MS = 2000;
const POLL_INTERVAL_MAX_MS = 30000;
const POLL_BACKOFF_FACTOR = 1.5;
// Consecutive no-change polls at the max backoff before we stop polling
// entirely until a local write, tab refocus, or cell change wakes us.
const HARD_IDLE_STREAK = 2;

const connectionPollWakes = new Set();
export const wakeConnectionPolling = () => {
  connectionPollWakes.forEach((wake) => {
    try { wake(); } catch { /* ignore */ }
  });
};

// DIAG: instance tracking to catch stacked/leaked connection pollers
if (typeof window !== 'undefined' && window.__connPollerSeq == null) window.__connPollerSeq = 0;
const liveConnPollers = new Set();

import { api } from '../api-client';
import useConnectionStore from '../stores/connectionStore';
import { cleanObject } from '../utils/unifiedValidationUtils';

// Connection caching and unloading system
const connectionCache = new Map();

// Initialize global unloaded connections tracking if needed
if (typeof window !== 'undefined' && !window._unloadedConnections) {
  window._unloadedConnections = new Set();
}

const clearConnectionCache = (spaceId, connectionId) => {
  const cacheKey = connectionId ? `${spaceId}_${connectionId}` : null;

  if (cacheKey) {
    connectionCache.delete(cacheKey);
  } else {
    // Clear all cached connections for this space
    for (const key of connectionCache.keys()) {
      if (key.startsWith(`${spaceId}_`)) {
        connectionCache.delete(key);
      }
    }
  }
};

/**
 * Fast shallow comparison for connection data
 * More efficient than JSON.stringify for change detection
 */
const connectionDataChanged = (cached, incoming) => {
  if (!cached || !incoming) return true;

  // PERF: Reference equality — skip all field checks when same object
  if (cached === incoming) return false;
  
  // Compare primitive fields first (fast path)
  if (cached.lineStyle !== incoming.lineStyle) return true;
  if (cached.styleType !== incoming.styleType) return true;
  if (cached.color !== incoming.color) return true;
  if (cached.text !== incoming.text) return true;
  if (cached.dashDirection !== incoming.dashDirection) return true;
  if (cached.dashOffset !== incoming.dashOffset) return true;
  
  // Compare start endpoint
  if (cached.start?.objectId !== incoming.start?.objectId) return true;
  if (cached.start?.faceIndex !== incoming.start?.faceIndex) return true;
  const cachedStartPos = cached.start?.position;
  const incomingStartPos = incoming.start?.position;
  if (cachedStartPos && incomingStartPos) {
    if (Array.isArray(cachedStartPos) && Array.isArray(incomingStartPos)) {
      if (cachedStartPos[0] !== incomingStartPos[0] ||
          cachedStartPos[1] !== incomingStartPos[1] ||
          cachedStartPos[2] !== incomingStartPos[2]) return true;
    } else if (cachedStartPos !== incomingStartPos) return true;
  } else if (cachedStartPos !== incomingStartPos) return true;
  
  // Compare end endpoint
  if (cached.end?.objectId !== incoming.end?.objectId) return true;
  if (cached.end?.faceIndex !== incoming.end?.faceIndex) return true;
  const cachedEndPos = cached.end?.position;
  const incomingEndPos = incoming.end?.position;
  if (cachedEndPos && incomingEndPos) {
    if (Array.isArray(cachedEndPos) && Array.isArray(incomingEndPos)) {
      if (cachedEndPos[0] !== incomingEndPos[0] ||
          cachedEndPos[1] !== incomingEndPos[1] ||
          cachedEndPos[2] !== incomingEndPos[2]) return true;
    } else if (cachedEndPos !== incomingEndPos) return true;
  } else if (cachedEndPos !== incomingEndPos) return true;
  
  return false;
};

// Serialize connection for storage - uses cleanObject from unified validation utils
const serializeConnection = (connection) => {

  return {
    id: connection.id,
    start: cleanObject(connection.start),
    end: cleanObject(connection.end),
    lineStyle: connection.lineStyle || connection.styleType || 'straight',
    styleType: connection.styleType || connection.lineStyle || 'straight',
    color: connection.color || 'black',
    text: connection.text || '',
    textStyle: connection.textStyle || {},
    dashDirection: connection.dashDirection || null,
    dashOffset: connection.dashOffset || 0,
    createdAt: connection.createdAt || new Date().toISOString(),
    lastUpdated: connection.lastUpdated || new Date().toISOString(),
    _lastSaved: connection._lastSaved || Date.now(),
  };
};

// Modified to use cell-based storage instead of space-level storage
export const saveConnection = async (userId, spaceId, connection) => {
  if (!userId || !spaceId || !connection?.id) {
    return false;
  }

  try {
    // First, check if this connection is in the deletion blacklist
    const connectionStore = useConnectionStore.getState();

    // Check if connection is being deleted
    if (connectionStore.deletingConnections.has(connection.id)) {
      return false;
    }

    // Ensure IDs are strings for consistency
    if (connection.start?.objectId) {
      const startObjectId = connection.start.objectId.toString();
      connection.start.objectId = startObjectId;
    }

    if (connection.end?.objectId) {
      const endObjectId = connection.end.objectId.toString();
      connection.end.objectId = endObjectId;
    }

    const serializedConnection = serializeConnection(connection);

    // Add creator ID and timestamps for shared spaces
    serializedConnection.creatorId = userId;
    serializedConnection.lastUpdated = new Date().toISOString();
    serializedConnection._lastSaved = Date.now();

    // Save connection via API
    await api.post(`/api/spaces/${spaceId}/connections`, serializedConnection);
    // Local write indicates active editing — wake the poller so remote
    // state is re-fetched promptly and the backoff resets.
    wakeConnectionPolling();
    return true;
  } catch (error) {
    // Simple fallback
    try {
      const fallbackKey = `connection_${userId}_${spaceId}_${connection.id}`;
      localStorage.setItem(fallbackKey, JSON.stringify(connection));
    } catch {
      // Failed to save to localStorage
    }
    throw new Error(`Failed to save connection: ${error.message}`);
  }
};

// Polling-based connection subscription
export const subscribeToConnections = (
  userId,
  spaceId,
  callback,
  loadedCells = []
) => {
  if (!spaceId) return () => {};

  // Support anonymous access for public spaces
  const isAnonymous = !userId;
  const ownerIdFromUrl = window.currentSpaceOwner;

  // For anonymous users, we must have the owner ID
  if (isAnonymous && !ownerIdFromUrl) {
    return () => {};
  }

  // Ensure loadedCells is always an array
  const effectiveCells = Array.isArray(loadedCells) ? [...loadedCells] : [];

  // DIAG
  const instanceId = ++window.__connPollerSeq;
  console.log(`[diag][connPoller #${instanceId}] CREATED cells=${effectiveCells.length}`, new Error().stack?.split('\n').slice(1, 4).join('\n'));
  liveConnPollers.add(instanceId);

  let isActive = true;
  const pollingCache = new Map();

  // Adaptive polling state: poll fast while changes flow, back off when
  // idle, and pause entirely while the tab is hidden. After a couple of
  // consecutive fully-idle polls at the max backoff we enter a hard idle
  // (zero requests) and only resume on a local write, tab refocus, or a
  // cell change.
  let isPolling = false;
  let pollDelay = POLL_INTERVAL_FAST_MS;
  let pollTimer = null;
  let isHardIdle = false;
  let idleStreak = 0;
  // DIAG (always-on): high-frequency polling detector
  let pollsInWindow = 0;
  let windowStartMs = 0;
  let highRateWarnedAt = 0;

  const poll = async () => {
    if (!isActive || isPolling) return;
    if (document.hidden || _subscriptionsPaused) return;
    isPolling = true;
    let anythingChanged = false;
    let fetchFailed = false;
    try {
      const params = {};
      if (effectiveCells.length > 0) {
        params.cell_id = effectiveCells;
      }

      const response = await api.get(`/api/spaces/${spaceId}/connections`, { params });
      if (response == null) {
        return; // 304 — nothing changed, skip the diff entirely
      }
      const connections = Array.isArray(response) ? response : (response.connections || []);
      const seenKeys = new Set();

      // Process incoming connections
      for (const connection of connections) {
        if (!isActive) return;

        const cacheKey = `${spaceId}_${connection.id}`;
        seenKeys.add(cacheKey);
        const cachedData = pollingCache.get(cacheKey);

        if (!cachedData) {
          // New connection
          pollingCache.set(cacheKey, { ...connection });
          anythingChanged = true;
          callback({
            type: 'added',
            id: connection.id,
            connection,
          });
        } else if (connectionDataChanged(cachedData, connection)) {
          // Modified connection
          pollingCache.set(cacheKey, { ...connection });
          anythingChanged = true;
          callback({
            type: 'modified',
            id: connection.id,
            connection,
          });
        }
      }

      // Check for removed connections
      for (const [key] of pollingCache.entries()) {
        if (!isActive) return;

        if (!seenKeys.has(key)) {
          pollingCache.delete(key);
          const connId = key.replace(`${spaceId}_`, '');
          anythingChanged = true;
          callback({
            type: 'removed',
            id: connId,
          });
        }
      }
    } catch {
      fetchFailed = true; // Polling error - will retry on next poll
    } finally {
      isPolling = false;
      // DIAG (always-on): warn once per 60s if polling at a sustained high rate
      const nowMs = performance.now();
      if (nowMs - windowStartMs > 30000) { windowStartMs = nowMs; pollsInWindow = 0; }
      pollsInWindow += 1;
      if (pollsInWindow >= 12 && nowMs - highRateWarnedAt > 60000) {
        highRateWarnedAt = nowMs;
        console.warn(`[diag][connPoller #${instanceId}] HIGH-RATE: ${pollsInWindow} polls in <30s (changed=${anythingChanged} fetchFailed=${fetchFailed} live=${liveConnPollers.size})`, new Error().stack?.split('\n').slice(1, 3).join('\n'));
      }
      if (window.__POLL_DIAG) {
        console.log(`[diag][connPoller #${instanceId}] poll changed=${anythingChanged} fetchFailed=${fetchFailed} delay=${pollDelay} cells=${effectiveCells.length} cacheSize=${pollingCache.size} live=${liveConnPollers.size}`);
      }
      if (anythingChanged) {
        pollDelay = POLL_INTERVAL_FAST_MS;
        idleStreak = 0;
      } else {
        pollDelay = Math.min(POLL_INTERVAL_MAX_MS, pollDelay * POLL_BACKOFF_FACTOR);
        if (fetchFailed) {
          // Errors never count toward hard idle — keep retrying (backing
          // off) so the poller recovers once the network/backend returns.
          idleStreak = 0;
        } else if (pollDelay >= POLL_INTERVAL_MAX_MS) {
          idleStreak += 1;
          if (idleStreak >= HARD_IDLE_STREAK) {
            isHardIdle = true;
          }
        } else {
          idleStreak = 0;
        }
      }
      scheduleNextPoll();
    }
  };

  const scheduleNextPoll = () => {
    if (!isActive || isHardIdle) return;
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }
    if (document.hidden || _subscriptionsPaused) return;
    pollTimer = setTimeout(() => {
      pollTimer = null;
      poll();
    }, pollDelay);
  };

  let lastWakeLogMs = 0;
  const wake = () => {
    if (!isActive) return;
    // DIAG (always-on, rate-limited): capture WHO wakes the poller
    const wakeNow = performance.now();
    if (wakeNow - lastWakeLogMs > 5000) {
      lastWakeLogMs = wakeNow;
      console.log(`[diag][connPoller #${instanceId}] WAKE`, new Error().stack?.split('\n').slice(1, 5).join('\n'));
    }
    if (isHardIdle) {
      isHardIdle = false;
      idleStreak = 0;
    }
    pollDelay = POLL_INTERVAL_FAST_MS;
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }
    poll();
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      if (pollTimer) {
        clearTimeout(pollTimer);
        pollTimer = null;
      }
    } else {
      isHardIdle = false;
      idleStreak = 0;
      pollDelay = POLL_INTERVAL_FAST_MS;
      if (!isPolling) poll();
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);
  connectionPollWakes.add(wake);

  // Initial fetch (schedules subsequent polls)
  poll();

  // Return cleanup function
  return () => {
    // DIAG
    console.log(`[diag][connPoller #${instanceId}] CLEANUP live=${liveConnPollers.size}`);
    liveConnPollers.delete(instanceId);
    isActive = false;
    connectionPollWakes.delete(wake);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }
    pollingCache.clear();
  };
};

// Function to delete a connection
export const deleteConnection = async (
  userId,
  spaceId,
  connectionId,
  connectionData = null
) => {
  if (!userId || !spaceId || !connectionId) {
    return false;
  }

  try {
    // Clear from cache immediately
    clearConnectionCache(spaceId, connectionId);

    // Determine cell ID from connection data
    let cellId = '';
    const connData = connectionData || useConnectionStore.getState().connections.find(c => c.id === connectionId);
    if (connData?.start?.position) {
      const CELL_SIZE = 15000;
      const x = Math.floor(connData.start.position[0] / CELL_SIZE);
      const y = Math.floor(connData.start.position[1] / CELL_SIZE);
      const z = Math.floor(connData.start.position[2] / CELL_SIZE);
      cellId = `${x},${y},${z}`;
    }

    await api.delete(`/api/spaces/${spaceId}/connections/${connectionId}?cell_id=${cellId}`);
    return true;
  } catch {
    return false;
  }
};

// Enhanced connection deletion
export const deleteConnectionEnhanced = async (
  userId,
  spaceId,
  connectionId,
  connectionData = null
) => {
  if (!userId || !spaceId || !connectionId) {
    return false;
  }

  try {
    // Clear from cache immediately
    clearConnectionCache(spaceId, connectionId);

    // Determine cell ID from connection data
    let cellId = '';
    const connData = connectionData || useConnectionStore.getState().connections.find(c => c.id === connectionId);
    if (connData?.start?.position) {
      const CELL_SIZE = 15000;
      const x = Math.floor(connData.start.position[0] / CELL_SIZE);
      const y = Math.floor(connData.start.position[1] / CELL_SIZE);
      const z = Math.floor(connData.start.position[2] / CELL_SIZE);
      cellId = `${x},${y},${z}`;
    }

    await api.delete(`/api/spaces/${spaceId}/connections/${connectionId}?cell_id=${cellId}`);
    return true;
  } catch {
    return false;
  }
};
