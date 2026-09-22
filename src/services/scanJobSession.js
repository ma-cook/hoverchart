/**
 * scanJobSession.js
 *
 * Durable background-scan session tracking. Persists the identity + latest
 * known status of a server-side scan job per space so the caller survives a
 * tab minimize / close / reload: on reopen the session is reattached to the
 * running (or finished) job instead of losing it.
 *
 * Shape: { jobId, kind: 'full'|'rescan', repoOwner, repoName, branch,
 *          status, progress, stage, updatedAt }
 */

import { safeSetItem, safeGetItem, safeRemoveItem } from '../utils/safeLocalStorage';

const sessionKey = (spaceId) => `scanJob_${spaceId}`;

export const saveScanSession = (spaceId, session) => {
  if (!spaceId || !session?.jobId) return;
  try {
    safeSetItem(sessionKey(spaceId), JSON.stringify({ ...session, updatedAt: Date.now() }));
  } catch {
    // localStorage full/unavailable — polling still works, only durability lost.
  }
};

export const loadScanSession = (spaceId) => {
  if (!spaceId) return null;
  try {
    const raw = safeGetItem(sessionKey(spaceId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearScanSession = (spaceId) => {
  if (!spaceId) return;
  try {
    safeRemoveItem(sessionKey(spaceId));
  } catch {
    // ignore
  }
};