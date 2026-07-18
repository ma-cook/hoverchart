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
import { Base64Store } from '../services/context/base64Store';

const workerApi = {
  /**
   * Process repo files, scene objects, and plan context into a fully
   * chunked, indexed, and base64-encoded content store.
   *
   * @param {{ repoFileContents: Record<string, string> | null,
   *           objects: Array<{ nodeId, nodeType, name, code, isContainer }>,
   *           planContext: string }} data
   * @returns {{ entries, invertedIndexEntries, totalChunks,
   *             encodedChunksEntries, manifest }}
   */
  async processContent({ repoFileContents, objects, planContext }) {
    const store = new ContentStore();

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
      }
    }

    // --- Scene objects ---
    if (objects && objects.length > 0) {
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
      }
    }

    // --- Plan context ---
    if (planContext) {
      store.upsert('plans:all', ContentCategory.PLAN, planContext, {
        sourcePath: 'plans',
        tags: ['plans'],
      });
    }

    // --- Base64 encoding ---
    const base64Store = new Base64Store(store);
    await base64Store.encodeAll();

    // --- Serialize results for postMessage ---
    const entries = Array.from(store.entries.entries());
    const invertedIndexEntries = Array.from(store.invertedIndex.entries()).map(
      ([keyword, chunkIdSet]) => [keyword, Array.from(chunkIdSet)]
    );
    const encodedChunksEntries = Array.from(base64Store.encodedChunks.entries());
    const manifest = store.getManifest();

    return {
      entries,
      invertedIndexEntries,
      totalChunks: store.totalChunks,
      encodedChunksEntries,
      manifest,
    };
  },
};

expose(workerApi);
