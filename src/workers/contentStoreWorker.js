/**
 * contentStoreWorker.js
 *
 * Web Worker that offloads ContentStore population and Base64 encoding
 * from the main thread. Receives serializable data, performs chunking,
 * keyword indexing, and base64 encoding, then returns pre-computed
 * results for the main thread to hydrate into singleton stores.
 *
 * Safe to run in a worker — no DOM, no stores, no singletons.
 */

import { expose } from 'comlink';
import { ContentStore, ContentCategory } from '../services/context/contentStore';

const workerApi = {
  async processContent({ repoFileContents, objects, planContext }) {
    const store = new ContentStore();
    const YIELD_EVERY = 50;

    // --- Repo files ---
    if (repoFileContents) {
      const entries = Object.entries(repoFileContents);
      for (let i = 0; i < entries.length; i++) {
        const [filePath, content] = entries[i];
        store.upsert(
          `repo:${filePath}`,
          ContentCategory.REPO_FILE,
          content,
          { sourcePath: filePath, tags: ['repo', 'code'] }
        );
        if (i % YIELD_EVERY === 0 && i > 0) {
          await new Promise(r => setTimeout(r, 0));
        }
      }
    }

    // --- Scene objects ---
    if (objects && objects.length > 0) {
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
        upsertCount++;
        if (upsertCount % YIELD_EVERY === 0) {
          await new Promise(r => setTimeout(r, 0));
        }
      }
    }

    // --- Plan context ---
    if (planContext) {
      store.upsert('plans:all', ContentCategory.PLAN, planContext, {
        sourcePath: 'plans',
        tags: ['plans'],
      });
    }

    // --- Serialize results for postMessage ---
    const entries = Array.from(store.entries.entries());
    const invertedIndexEntries = Array.from(store.invertedIndex.entries()).map(
      ([keyword, chunkIdSet]) => [keyword, Array.from(chunkIdSet)]
    );
    const manifest = store.getManifest();

    return {
      entries,
      invertedIndexEntries,
      totalChunks: store.totalChunks,
      manifest,
    };
  },
};

expose(workerApi);
