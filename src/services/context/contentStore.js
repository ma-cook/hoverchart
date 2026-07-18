import { chunkText, extractKeywords } from './chunkIndex';

export const ContentCategory = {
  REPO_FILE: 'repo_file',
  SCENE_CONTEXT: 'scene_context',
  CONVERSATION: 'conversation_summary',
  PLAN: 'plan',
};

const CHUNK_CONFIGS = {
  [ContentCategory.REPO_FILE]: { chunkSize: 3000, overlap: 300 },
  [ContentCategory.SCENE_CONTEXT]: { chunkSize: 1500, overlap: 150 },
  [ContentCategory.CONVERSATION]: { chunkSize: 2000, overlap: 200 },
  [ContentCategory.PLAN]: { chunkSize: 2500, overlap: 250 },
};

export class ContentStore {
  constructor() {
    this.entries = new Map();
    this.invertedIndex = new Map();
    this.totalChunks = 0;
  }

  upsert(id, category, content, metadata = {}) {
    const existing = this.entries.get(id);
    if (existing) {
      this._removeFromIndex(existing);
      this.totalChunks -= existing.chunks.length;
    }

    const config = CHUNK_CONFIGS[category] || { chunkSize: 2000, overlap: 200 };
    const chunks = chunkText(content, config);

    const entry = {
      id,
      category,
      chunks,
      sourcePath: metadata.sourcePath || id,
      tags: metadata.tags || [],
      lastUpdated: Date.now(),
      totalChars: content.length,
    };

    for (const chunk of chunks) {
      for (const keyword of chunk.keywords) {
        if (!this.invertedIndex.has(keyword)) {
          this.invertedIndex.set(keyword, new Set());
        }
        this.invertedIndex.get(keyword).add(chunk.id);
      }
      chunk._entryId = id;
    }

    this.entries.set(id, entry);
    this.totalChunks += chunks.length;
  }

  remove(id) {
    const entry = this.entries.get(id);
    if (entry) {
      this._removeFromIndex(entry);
      this.totalChunks -= entry.chunks.length;
      this.entries.delete(id);
    }
  }

  clear() {
    this.entries.clear();
    this.invertedIndex.clear();
    this.totalChunks = 0;
  }

  hydrate(serializedEntries, serializedInvertedIndex, totalChunks) {
    this.clear();
    for (const [id, entry] of serializedEntries) {
      this.entries.set(id, entry);
    }
    for (const [keyword, chunkIds] of serializedInvertedIndex) {
      this.invertedIndex.set(keyword, new Set(chunkIds));
    }
    this.totalChunks = totalChunks;
  }

  search(query, { maxChunks = 10, category = null, entryIds = null } = {}) {
    const queryKeywords = extractKeywords(query, 20);
    const scores = new Map();

    for (const keyword of queryKeywords) {
      const matchingChunkIds = this.invertedIndex.get(keyword);
      if (!matchingChunkIds) continue;
      for (const chunkId of matchingChunkIds) {
        scores.set(chunkId, (scores.get(chunkId) || 0) + 1);
      }
    }

    const results = [];
    for (const [chunkId, score] of scores) {
      for (const [, entry] of this.entries) {
        const chunk = entry.chunks.find(c => c.id === chunkId);
        if (!chunk) continue;
        if (category && entry.category !== category) continue;
        if (entryIds && !entryIds.includes(entry.id)) continue;
        results.push({ chunk, score, entryId: entry.id, sourcePath: entry.sourcePath });
        break;
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, maxChunks);
  }

  getEntry(id) {
    return this.entries.get(id) || null;
  }

  getChunkById(chunkId) {
    for (const [, entry] of this.entries) {
      const chunk = entry.chunks.find(c => c.id === chunkId);
      if (chunk) return { chunk, entry };
    }
    return null;
  }

  getManifest() {
    const manifest = [];
    for (const [id, entry] of this.entries) {
      manifest.push({
        id,
        category: entry.category,
        sourcePath: entry.sourcePath,
        chunkCount: entry.chunks.length,
        totalChars: entry.totalChars,
        tags: entry.tags,
        lastUpdated: entry.lastUpdated,
      });
    }
    return manifest;
  }

  getTotalTokens() {
    let total = 0;
    for (const entry of this.entries.values()) {
      for (const chunk of entry.chunks) {
        total += Math.ceil(chunk.charCount / 4);
      }
    }
    return total;
  }

  _removeFromIndex(entry) {
    for (const chunk of entry.chunks) {
      for (const keyword of chunk.keywords) {
        const set = this.invertedIndex.get(keyword);
        if (set) {
          set.delete(chunk.id);
          if (set.size === 0) this.invertedIndex.delete(keyword);
        }
      }
    }
  }
}

let _instance = null;
export function getContentStore() {
  if (!_instance) _instance = new ContentStore();
  return _instance;
}
