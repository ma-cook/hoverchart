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

const YIELD_EVERY = 50;
const BATCH_YIELD_MS = 0;

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
   * Start a fresh population session. Call before the first processContentBatch
   * so repo paths indexed by a previous scan don't get skipped.
   */
  reset() {
    resetStore();
    return true;
  },

  /**
   * Index one bounded slice of content. Returns only the entries added by this
   * batch (incremental), so the main thread can merge without re-cloning
   * everything it already has.
   */
  async processContentBatch({ repoFileContents, objects, diagramMarkdown, planContext }) {
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

    return captureDelta(store, newEntryIds);
  },
};

expose(workerApi);
