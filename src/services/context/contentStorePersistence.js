/**
 * contentStorePersistence.js
 *
 * IndexedDB persistence for ContentStore.
 * Entries are stored per-key (entry:<id>) so a save only rewrites the entries
 * that actually changed instead of re-serializing the whole corpus (chunk text
 * lives inline in entries, so the old whole-store write was a multi-hundred-ms
 * main-thread block firing ~2s after every edit). The inverted index is NOT
 * persisted — it is rebuilt from entries on load.
 * Auto-saves after upserts (debounced).
 */

const DB_NAME = 'hoverchart-content-store';
const DB_VERSION = 5;
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
      if (e.oldVersion < 5) {
        // v5 changes the on-disk layout: entries move from one giant "entries"
        // aggregate key to individual "entry:<id>" keys, and the persisted
        // invertedIndex is dropped (rebuilt on load). The old whole-store write
        // serialized ~4000 chunk texts and committed one multi-MB value on the
        // main thread ~2s after every edit — enough to freeze the tab while
        // the model streamed. v5 clears so the layout migrates cleanly.
        // v1/v2 stored chunks under colliding bare "chunk-N" ids, which let
        // Base64Store return the WRONG file's text. v3's clear only ran on the
        // v2->v3 upgrade, so DBs already at v3 kept any corruption written after
        // that migration (cross-wired chunks, wrong-file text). v4 re-ran the
        // clear on the upgrade transaction to purge those. The next scan /
        // population rebuilds everything with globally unique chunk ids.
        // v2's attempt to clear here used db.transaction() inside the upgrade
        // and threw "A version change transaction is running", so the stale
        // data survived — always clear on the upgrade transaction itself.
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

function txGetAll(storeName) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result || []);
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

/**
 * Apply a batch of puts/deletes in a single transaction. ops are
 * ['put', key, value] or ['delete', key].
 */
function txBatch(storeName, ops) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    for (const op of ops) {
      if (op[0] === 'put') store.put(op[2], op[1]);
      else store.delete(op[1]);
    }
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

// --- Public API ---

let _saveTimer = null;
const SAVE_DEBOUNCE_MS = 2000;

/**
 * Save changed content store entries to IndexedDB.
 * Debounced — multiple rapid calls within 2s collapse into one write.
 * Only entries flagged dirty (and removals) are written, each under its own
 * entry:<id> key, so an edit rewrites ONE entry's chunks instead of the whole
 * corpus. The store drains its dirty/removed sets after a successful save.
 */
export function saveContentStore(store) {
  if (!store || !store._dirtyIds) return;
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(async () => {
    try {
      const ops = [];
      for (const id of store._dirtyIds) {
        const entry = store.entries.get(id);
        if (entry) ops.push(['put', `entry:${id}`, { id, ...entry }]);
      }
      for (const id of store._removedIds) {
        ops.push(['delete', `entry:${id}`]);
      }
      if (ops.length) await txBatch(STORE_ENTRIES, ops);
      await Promise.all([
        txPut(STORE_META, 'totalChunks', store.totalChunks),
        txPut(STORE_META, 'lastSaved', Date.now()),
      ]);
      store._dirtyIds.clear();
      store._removedIds.clear();
      console.log(`[contentStorePersistence] Saved ${ops.filter(op => op[0] === 'put').length} entries, removed ${ops.filter(op => op[0] === 'delete').length}`);
    } catch (err) {
      console.warn('[contentStorePersistence] Save failed:', err.message);
    }
  }, SAVE_DEBOUNCE_MS);
}

/**
 * Load content store state from IndexedDB.
 * Returns { entries, invertedIndex, totalChunks } or null if nothing saved.
 * The inverted index is rebuilt from entry chunks (it is no longer persisted).
 * Legacy v4 aggregate rows (no id field) are skipped.
 */
export async function loadContentStore() {
  try {
    const rows = await txGetAll(STORE_ENTRIES);
    const entries = new Map();
    for (const row of rows) {
      if (row && typeof row.id === 'string') {
        const { id, ...entry } = row;
        entries.set(id, entry);
      }
    }
    if (entries.size === 0) return null;
    const invertedIndex = new Map();
    let totalChunks = 0;
    for (const entry of entries.values()) {
      totalChunks += entry.chunks.length;
      for (const chunk of entry.chunks) {
        for (const keyword of chunk.keywords) {
          if (!invertedIndex.has(keyword)) {
            invertedIndex.set(keyword, new Set());
          }
          invertedIndex.get(keyword).add(chunk.id);
        }
      }
    }
    return { entries, invertedIndex, totalChunks };
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

/**
 * Persist the per-file symbol index (serialized Map<filePath, entry>) for a
 * space. Moved out of localStorage because it is one of the largest per-space
 * payloads and was a major contributor to localStorage quota exhaustion.
 */
export async function saveSpaceFileIndex(spaceId, serializedIndex) {
  if (!serializedIndex) return;
  try {
    const key = `fileIndexByPath:${spaceId || ''}`;
    await txPut(STORE_META, key, serializedIndex);
  } catch (err) {
    console.warn('[contentStorePersistence] save fileIndexByPath failed:', err.message);
  }
}

export async function loadSpaceFileIndex(spaceId) {
  try {
    const key = `fileIndexByPath:${spaceId || ''}`;
    return (await txGet(STORE_META, key)) || null;
  } catch (err) {
    console.warn('[contentStorePersistence] load fileIndexByPath failed:', err.message);
    return null;
  }
}

/**
 * Persist the repo file tree for a space. Same rationale as
 * saveSpaceFileIndex — large enough to help exhaust localStorage quota.
 */
export async function saveRepoFileTree(spaceId, tree) {
  if (!tree) return;
  try {
    const key = `repoFileTree:${spaceId || ''}`;
    await txPut(STORE_META, key, tree);
  } catch (err) {
    console.warn('[contentStorePersistence] save repoFileTree failed:', err.message);
  }
}

export async function loadRepoFileTree(spaceId) {
  try {
    const key = `repoFileTree:${spaceId || ''}`;
    return (await txGet(STORE_META, key)) || null;
  } catch (err) {
    console.warn('[contentStorePersistence] load repoFileTree failed:', err.message);
    return null;
  }
}

/**
 * Persist the remaining scan payloads (contentIndex, importGraph, fileSizes,
 * importIndexByFile) for a space. Moved out of localStorage with the same
 * rationale as saveSpaceFileIndex — these can each be tens of KB to MBs and
 * were contributors to localStorage quota exhaustion. Values are stored as
 * plain strings / serialized arrays.
 */
export async function saveSpaceContentIndex(spaceId, value) {
  if (!value) return;
  try {
    await txPut(STORE_META, `contentIndex:${spaceId || ''}`, value);
  } catch (err) {
    console.warn('[contentStorePersistence] save contentIndex failed:', err.message);
  }
}

export async function loadSpaceContentIndex(spaceId) {
  try {
    return (await txGet(STORE_META, `contentIndex:${spaceId || ''}`)) || null;
  } catch (err) {
    console.warn('[contentStorePersistence] load contentIndex failed:', err.message);
    return null;
  }
}

export async function saveSpaceImportGraph(spaceId, value) {
  if (!value) return;
  try {
    await txPut(STORE_META, `importGraph:${spaceId || ''}`, value);
  } catch (err) {
    console.warn('[contentStorePersistence] save importGraph failed:', err.message);
  }
}

export async function loadSpaceImportGraph(spaceId) {
  try {
    return (await txGet(STORE_META, `importGraph:${spaceId || ''}`)) || null;
  } catch (err) {
    console.warn('[contentStorePersistence] load importGraph failed:', err.message);
    return null;
  }
}

export async function saveSpaceFileSizes(spaceId, serialized) {
  if (!serialized) return;
  try {
    await txPut(STORE_META, `fileSizes:${spaceId || ''}`, serialized);
  } catch (err) {
    console.warn('[contentStorePersistence] save fileSizes failed:', err.message);
  }
}

export async function loadSpaceFileSizes(spaceId) {
  try {
    return (await txGet(STORE_META, `fileSizes:${spaceId || ''}`)) || null;
  } catch (err) {
    console.warn('[contentStorePersistence] load fileSizes failed:', err.message);
    return null;
  }
}

export async function saveSpaceImportIndex(spaceId, serialized) {
  if (!serialized) return;
  try {
    await txPut(STORE_META, `importIndexByFile:${spaceId || ''}`, serialized);
  } catch (err) {
    console.warn('[contentStorePersistence] save importIndexByFile failed:', err.message);
  }
}

export async function loadSpaceImportIndex(spaceId) {
  try {
    return (await txGet(STORE_META, `importIndexByFile:${spaceId || ''}`)) || null;
  } catch (err) {
    console.warn('[contentStorePersistence] load importIndexByFile failed:', err.message);
    return null;
  }
}
