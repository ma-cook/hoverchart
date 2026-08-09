/**
 * safeLocalStorage.js
 *
 * Quota-safe localStorage accessors. localStorage has a shared per-origin
 * quota (typically ~5MB); when it is exhausted, setItem throws a
 * QuotaExceededError. Every write in the app should go through these helpers
 * so quota exhaustion degrades to best-effort persistence instead of
 * crashing the calling code (e.g. a scan-complete React effect).
 */

export function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.warn(`[safeLocalStorage] setItem failed for "${key}":`, err?.message);
    return false;
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
