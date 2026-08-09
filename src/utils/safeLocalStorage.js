/**
 * safeLocalStorage.js
 *
 * Quota-safe localStorage accessors. localStorage has a shared per-origin
 * quota (typically ~5MB); when it is exhausted, setItem throws a
 * QuotaExceededError. Every write in the app should go through these helpers
 * so quota exhaustion degrades to best-effort persistence instead of
 * crashing the calling code (e.g. a scan-complete React effect).
 *
 * On quota exhaustion safeSetItem attempts to reclaim space by evicting only
 * regenerable cache keys (scan indexes, digests, repo metadata) before giving
 * up. User data (chat history, tokens, settings) is never evicted.
 */

// Regenerable cache keys. Listed largest/most-regenerable first. Each entry
// is either a prefix match or a predicate for more specific code:* keys.
const EVICTABLE_KEY_PATTERNS = [
  { prefix: 'code:', match: (k) => k.includes(':fileIndexByPath') || k.includes(':repoFileTree') },
  { prefix: 'code:', match: (k) => /:(?:contentIndex|fileSizes|importIndexByFile|importGraph)$/.test(k) },
  { prefix: 'diagramDigest_', match: () => true },
  { prefix: 'diagramRepo_', match: () => true },
  { prefix: 'diagramMarkdownUrl_', match: () => true },
  { prefix: 'diagramCommitSha_', match: () => true },
];

function isEvictable(key) {
  for (const { prefix, match } of EVICTABLE_KEY_PATTERNS) {
    if (key.startsWith(prefix) && match(key)) return true;
  }
  return false;
}

function collectEvictableKeys(exceptKey) {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || k === exceptKey || !isEvictable(k)) continue;
    keys.push(k);
  }
  return keys.sort((a, b) => {
    const lenA = localStorage.getItem(a)?.length || 0;
    const lenB = localStorage.getItem(b)?.length || 0;
    return lenB - lenA;
  });
}

function evictAndRetry(key, value) {
  const evictable = collectEvictableKeys(key);
  for (const victim of evictable) {
    localStorage.removeItem(victim);
    try {
      localStorage.setItem(key, value);
      console.warn(`[safeLocalStorage] quota reclaimed by evicting "${victim}"; "${key}" saved`);
      return true;
    } catch {
      // Still full — keep evicting regenerable keys.
    }
  }
  return false;
}

export function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    let reclaimed = false;
    try {
      reclaimed = evictAndRetry(key, value);
    } catch {
      reclaimed = false;
    }
    if (!reclaimed) {
      console.warn(`[safeLocalStorage] setItem failed for "${key}":`, err?.message);
    }
    return reclaimed;
  }
}

export function safeGetItem(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeRemoveItem(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
