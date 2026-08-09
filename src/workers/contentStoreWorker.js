/**
 * contentStoreWorker.js
 *
 * Web Worker that offloads ContentStore population and Base64 encoding
 * from the main thread. Receives serializable data, performs chunking,
 * keyword indexing, and base64 encoding, then returns pre-computed
 * results for the main thread to merge into singleton stores.
 *
 * Content is processed in *batches* (processContentBatch) so the caller can
 * send a large repo file-by-file: each Comlink round-trip only structured-
 * clones a bounded slice, keeping the main thread responsive even for huge
 * repositories. The worker keeps its own ContentStore across batch calls and
 * only returns the entries that were added by the last batch.
 *
 * Safe to run in a worker — no DOM, no stores, no singletons.
 */

import { expose } from 'comlink';
import { ContentStore, ContentCategory } from '../services/context/contentStore';
import { joinChunks } from '../services/context/chunkIndex';

console.log('[contentStoreWorker] module evaluated', typeof self !== 'undefined' && self.location ? self.location.href : '?');

const YIELD_EVERY = 50;
const BATCH_YIELD_MS = 0;
const MAX_HITS_PER_FILE = 5;

let _callLogCount = 0;
function logCall(name, detail) {
  if (_callLogCount < 20) {
    _callLogCount++;
    console.log(`[contentStoreWorker] ${name}`, detail, `t=${Date.now()}`);
  }
}

setInterval(() => {
  if (typeof self !== 'undefined') {
    self.postMessage({ __contentStoreHeartbeat: Date.now() });
  }
}, 1000);

let _batchStore = null;
let _processedRepoPaths = new Set();
let _processedObjects = false;
let _processedPlan = false;
let _processedDiagram = false;

function ensureStore() {
  if (!_batchStore) _batchStore = new ContentStore();
  return _batchStore;
}

function resetStore() {
  _batchStore = null;
  _processedRepoPaths = new Set();
  _processedObjects = false;
  _processedPlan = false;
  _processedDiagram = false;
}

function yieldToMain() {
  return new Promise((r) => setTimeout(r, BATCH_YIELD_MS));
}

function captureDelta(store, newEntryIds) {
  const entries = Array.from(newEntryIds, (id) => [id, store.entries.get(id)]);
  return { entries };
}

const workerApi = {
  /**
   * Cheap health check so callers can detect a dead/unresponsive worker quickly
   * instead of hanging on a Comlink round-trip that will never settle.
   */
  ping() {
    logCall('ping', 'ok');
    return true;
  },

  /**
   * Start a fresh population session. Call before the first processContentBatch
   * so repo paths indexed by a previous scan don't get skipped.
   */
  reset() {
    logCall('reset', 'start');
    resetStore();
    return true;
  },

  /**
   * Index one bounded slice of content. Returns only the entries added by this
   * batch (incremental), so the main thread can merge without re-cloning
   * everything it already has.
   */
  async processContentBatch({ repoFileContents, objects, diagramMarkdown, planContext }) {
    const t0 = Date.now();
    logCall('processContentBatch', `start repoFiles=${repoFileContents ? Object.keys(repoFileContents).length : 0}`);
    const store = ensureStore();
    const newEntryIds = new Set();
    let count = 0;

    // --- Repo files (bounded per call) ---
    if (repoFileContents) {
      const entries = Object.entries(repoFileContents);
      for (const [filePath, content] of entries) {
        if (_processedRepoPaths.has(filePath)) continue;
        _processedRepoPaths.add(filePath);
        store.upsert(
          `repo:${filePath}`,
          ContentCategory.REPO_FILE,
          content,
          { sourcePath: filePath, tags: ['repo', 'code'] }
        );
        newEntryIds.add(`repo:${filePath}`);
        count++;
        if (count % YIELD_EVERY === 0) {
          await yieldToMain();
        }
      }
    }

    // --- Merfolk diagram markdown (survives refresh via IndexedDB, is never
    //     surfaced by search_code because it doesn't use the "repo:" prefix) ---
    if (!_processedDiagram && diagramMarkdown) {
      _processedDiagram = true;
      store.upsert('merfolk:diagram', ContentCategory.REPO_FILE, diagramMarkdown, {
        sourcePath: 'merfolk:diagram',
        tags: ['architecture', 'merfolk', 'diagram'],
      });
      newEntryIds.add('merfolk:diagram');
    }

    // --- Scene objects ---
    if (!_processedObjects && objects && objects.length > 0) {
      _processedObjects = true;
      let upsertCount = 0;
      for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];
        if (!obj.nodeId || obj.isContainer) continue;
        const nodeType = obj.nodeType || 'unknown';
        const name = obj.name || obj.nodeId;
        const hasCode = obj.code ? '\n' + obj.code : '';
        const text = `[${obj.nodeId}] (${nodeType}) "${name}"${hasCode}`;
        store.upsert(`scene:${obj.nodeId}`, ContentCategory.SCENE_CONTEXT, text, {
          sourcePath: 'scene',
          tags: ['architecture', 'scene', obj.nodeId],
        });
        newEntryIds.add(`scene:${obj.nodeId}`);
        upsertCount++;
        if (upsertCount % YIELD_EVERY === 0) {
          await yieldToMain();
        }
      }
    }

    // --- Plan context ---
    if (!_processedPlan && planContext) {
      _processedPlan = true;
      store.upsert('plans:all', ContentCategory.PLAN, planContext, {
        sourcePath: 'plans',
        tags: ['plans'],
      });
      newEntryIds.add('plans:all');
    }

    logCall('processContentBatch', `done in ${Date.now() - t0}ms added=${newEntryIds.size}`);
    return captureDelta(store, newEntryIds);
  },

  /**
   * Full-text scan over the repo corpus, executed off the main thread so a
   * large repo can't freeze the UI while search_code/grep run. If this worker
   * has no "repo:" entries yet (e.g. a population pass is still in flight, or
   * the code-gen flow fetched contents after population was skipped), indexes
   * the provided repoFileContents on demand (bounded, yielding) before scanning.
   *
   * Supports literal `pattern` matching (normalized like search_code) or a
   * `regex` (case-insensitive unless caseSensitive), plus an optional
   * `pathPrefix` filter for grep's directory scoping.
   *
   * Returns [{ filePath, hitCount, samples: [{ lineNum, text }] }] sorted by
   * hit count, capped at maxResults.
   */
  async search({ pattern, regex = null, caseSensitive = false, pathPrefix = '', repoFileContents = null, maxResults = 20, maxSamplesPerFile = 3 } = {}) {
    const t0 = Date.now();
    logCall('search', `start pattern="${pattern}" regex=${regex !== null}`);
    const store = ensureStore();
    const hasRepoEntries = Array.from(store.entries.keys()).some((id) => id.startsWith('repo:'));

    if (!hasRepoEntries && repoFileContents && Object.keys(repoFileContents).length > 0) {
      let fallbackCount = 0;
      for (const [filePath, content] of Object.entries(repoFileContents)) {
        if (!content) continue;
        if (store.entries.has(`repo:${filePath}`)) continue;
        store.upsert(
          `repo:${filePath}`,
          ContentCategory.REPO_FILE,
          content,
          { sourcePath: filePath, tags: ['repo', 'code'] }
        );
        fallbackCount++;
        if (fallbackCount % YIELD_EVERY === 0) {
          await yieldToMain();
        }
      }
    }

    let re = null;
    if (regex) {
      try {
        re = new RegExp(regex, caseSensitive ? '' : 'i');
      } catch { /* invalid regex — scan will simply match nothing */ }
    }

    // If the worker still has no repo corpus after any on-demand indexing,
    // return null so the caller scans the main thread instead of reporting a
    // false "no matches" (an empty array is ambiguous with a real empty scan).
    const hasRepoAfterIndex = Array.from(store.entries.keys()).some((id) => id.startsWith('repo:'));
    if (!hasRepoAfterIndex) return null;

    const rawPattern = pattern || '';
    const normalize = (s) => (s || '').toLowerCase().replace(/[-_.]/g, '');
    const pat = normalize(rawPattern);
    if (!pat && !re) return [];
    const basePattern = normalize(rawPattern.replace(/\.[a-z0-9]+$/, ''));
    const matches = (line) => {
      if (re) return re.test(line);
      const normLine = normalize(line);
      return normLine.includes(pat) ||
        (basePattern.length >= 3 && normLine.includes(basePattern));
    };

    const hits = [];
    let scanned = 0;
    for (const [id, entry] of store.entries) {
      if (!id.startsWith('repo:')) continue;
      const filePath = id.slice(5);
      if (pathPrefix && !filePath.startsWith(pathPrefix)) continue;
      if (entry.chunks?.some((c) => c.oversized)) continue;
      const fullText = joinChunks(entry.chunks);
      if (!fullText) continue;
      const lines = fullText.split('\n');
      let count = 0;
      const samples = [];
      for (let li = 0; li < lines.length && count < MAX_HITS_PER_FILE; li++) {
        if (matches(lines[li])) {
          count++;
          if (samples.length < maxSamplesPerFile) {
            samples.push({ lineNum: li + 1, text: lines[li].trim().slice(0, 200) });
          }
        }
      }
      if (count > 0) {
        hits.push({ filePath, hitCount: count, samples });
      }
      scanned++;
      if (scanned % YIELD_EVERY === 0) {
        await yieldToMain();
      }
    }

    logCall('search', `done in ${Date.now() - t0}ms hits=${hits.length} scanned=${scanned}`);
    return hits.sort((a, b) => b.hitCount - a.hitCount).slice(0, maxResults);
  },
};

expose(workerApi);
