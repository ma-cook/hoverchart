/**
 * contentStorePersistence.js
 *
 * IndexedDB persistence for ContentStore.
 * Serializes Maps/Sets to arrays for storage, hydrates back on load.
 * Auto-saves after upserts (debounced).
 */

const DB_NAME = 'hoverchart-content-store';
const DB_VERSION = 3;
const STORE_ENTRIES = 'contentEntries';
const STORE_BASE64 = 'base64Chunks';
const STORE_META = 'meta';

let dbInstance = null;
let dbPromise = null;

const OPEN_TIMEOUT_MS = 6000;

function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    let settled = false;
    const openTimer = setTimeout(() => {
      // The open can be blocked indefinitely when another tab holds an older
      // schema version (the versionchange never proceeds). Never hang the
      // store on that — reject so callers degrade to the in-memory store, and
      // reset dbPromise so a later call can retry once the blocker is gone.
      dbPromise = null;
      if (settled) return;
      settled = true;
      console.warn('[contentStorePersistence] IndexedDB open timed out — degrading to in-memory store');
      reject(new Error('IndexedDB open timed out (blocked by another connection?)'));
    }, OPEN_TIMEOUT_MS);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_ENTRIES)) db.createObjectStore(STORE_ENTRIES);
      if (!db.objectStoreNames.contains(STORE_BASE64)) db.createObjectStore(STORE_BASE64);
      if (!db.objectStoreNames.contains(STORE_META)) db.createObjectStore(STORE_META);
      if (e.oldVersion < 3) {
        // v1/v2 stored chunks under colliding bare "chunk-N" ids, which let
        // Base64Store return the WRONG file's text. Discard the stale cache;
        // the next scan/population rebuilds it with globally unique chunk ids.
        // v2's attempt to clear here used db.transaction() inside the upgrade
        // and threw "A version change transaction is running", so the stale
        // data survived — v3 re-runs the clear on the upgrade transaction.
        try {
          const tx = e.target.transaction;
          if (tx) {
            tx.objectStore(STORE_ENTRIES).clear();
            tx.objectStore(STORE_BASE64).clear();
            tx.objectStore(STORE_META).clear();
          }
        } catch (clearErr) {
          console.warn('[contentStorePersistence] stale cache clear failed:', clearErr.message);
        }
      }
    };
    req.onsuccess = (e) => {
      if (settled) return;
      settled = true;
      clearTimeout(openTimer);
      dbInstance = e.target.result;
      resolve(dbInstance);
    };
    req.onerror = (e) => {
      if (settled) return;
      settled = true;
      clearTimeout(openTimer);
      console.warn('[contentStorePersistence] IndexedDB open failed:', e.target.error);
      reject(e.target.error);
    };
    req.onblocked = () => {
      console.warn('[contentStorePersistence] IndexedDB open blocked by an existing connection with an older schema version');
    };
  });
  return dbPromise;
}

function txGet(storeName, key) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

function txPut(storeName, key, value) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }));
}

function txClear(storeName) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }));
}

// --- Serialization helpers ---

function serializeEntries(entriesMap) {
  return Array.from(entriesMap.entries()).map(([id, entry]) => ({
    id,
    ...entry,
  }));
}

function deserializeEntries(rows) {
  const map = new Map();
  for (const row of rows) {
    const { id, ...entry } = row;
    map.set(id, entry);
  }
  return map;
}

function serializeInvertedIndex(indexMap) {
  return Array.from(indexMap.entries()).map(([keyword, chunkIdSet]) => ({
    keyword,
    chunkIds: Array.from(chunkIdSet),
  }));
}

function deserializeInvertedIndex(rows) {
  const map = new Map();
  for (const row of rows) {
    map.set(row.keyword, new Set(row.chunkIds));
  }
  return map;
}

// --- Public API ---

let _saveTimer = null;
const SAVE_DEBOUNCE_MS = 2000;

/**
 * Save content store state to IndexedDB.
 * Debounced — multiple rapid calls within 2s collapse into one write.
 */
export function saveContentStore(entries, invertedIndex, totalChunks) {
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(async () => {
    try {
      const entriesRows = serializeEntries(entries);
      const indexRows = serializeInvertedIndex(invertedIndex);
      await Promise.all([
        txPut(STORE_ENTRIES, 'entries', entriesRows),
        txPut(STORE_ENTRIES, 'invertedIndex', indexRows),
        txPut(STORE_META, 'totalChunks', totalChunks),
        txPut(STORE_META, 'lastSaved', Date.now()),
      ]);
      console.log(`[contentStorePersistence] Saved ${entriesRows.length} entries, ${indexRows.length} index keys, ${totalChunks} chunks`);
    } catch (err) {
      console.warn('[contentStorePersistence] Save failed:', err.message);
    }
  }, SAVE_DEBOUNCE_MS);
}

/**
 * Load content store state from IndexedDB.
 * Returns { entries, invertedIndex, totalChunks } or null if nothing saved.
 */
export async function loadContentStore() {
  try {
    const [entriesRows, indexRows, totalChunks] = await Promise.all([
      txGet(STORE_ENTRIES, 'entries'),
      txGet(STORE_ENTRIES, 'invertedIndex'),
      txGet(STORE_META, 'totalChunks'),
    ]);
    if (!entriesRows || !indexRows) return null;
    return {
      entries: deserializeEntries(entriesRows),
      invertedIndex: deserializeInvertedIndex(indexRows),
      totalChunks: totalChunks || 0,
    };
  } catch (err) {
    console.warn('[contentStorePersistence] Load failed:', err.message);
    return null;
  }
}

/**
 * Clear all persisted content store data.
 */
export async function clearContentStorePersistence() {
  try {
    await Promise.all([
      txClear(STORE_ENTRIES),
      txClear(STORE_BASE64),
      txClear(STORE_META),
    ]);
    console.log('[contentStorePersistence] Cleared all persisted data');
  } catch (err) {
    console.warn('[contentStorePersistence] Clear failed:', err.message);
  }
}

/**
 * Check if there is persisted data available.
 */
export async function hasPersistedData() {
  try {
    const lastSaved = await txGet(STORE_META, 'lastSaved');
    return !!lastSaved;
  } catch {
    return false;
  }
}

/**
 * Persist the raw repoFileContents map (filePath -> text) for a space so a
 * page reload can reuse the cached repo context without re-fetching every
 * file from GitHub. Stored in IndexedDB (not localStorage) because the corpus
 * can be several MB. Fire-and-forget safe — degrades to a refetch on failure.
 */
export async function saveRepoFileContents(spaceId, contents) {
  if (!contents || typeof contents !== 'object') return;
  try {
    const key = `repoFileContents:${spaceId || ''}`;
    await txPut(STORE_META, key, contents);
    console.log(`[contentStorePersistence] Saved repoFileContents (${Object.keys(contents).length} files)`);
  } catch (err) {
    console.warn('[contentStorePersistence] save repoFileContents failed:', err.message);
  }
}

export async function loadRepoFileContents(spaceId) {
  try {
    const key = `repoFileContents:${spaceId || ''}`;
    return (await txGet(STORE_META, key)) || null;
  } catch (err) {
    console.warn('[contentStorePersistence] load repoFileContents failed:', err.message);
    return null;
  }
}
