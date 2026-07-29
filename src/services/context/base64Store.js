import { getContentStore } from './contentStore';

export class Base64Store {
  constructor(contentStore) {
    this.contentStore = contentStore || getContentStore();
    this.encodedChunks = new Map();
    this._hydrated = false;
    this._hydratePromise = null;
    this._chunkIndex = null;
  }

  async _ensureHydrated() {
    if (this._hydrated) return;
    if (this._hydratePromise) return this._hydratePromise;
    this._hydratePromise = (async () => {
      this._hydrated = true;
    })();
    return this._hydratePromise;
  }

  _buildChunkIndex() {
    if (this._chunkIndex) return;
    this._chunkIndex = new Map();
    for (const [, entry] of this.contentStore.entries) {
      for (const chunk of entry.chunks) {
        this._chunkIndex.set(chunk.id, {
          text: chunk.text,
          meta: {
            entryId: entry.id,
            sourcePath: entry.sourcePath,
            category: entry.category,
            keywords: chunk.keywords,
            charCount: chunk.charCount,
            byteSize: chunk.text.length,
            startIndex: chunk.startIndex,
            endIndex: chunk.endIndex,
          },
        });
      }
    }
  }

  async encodeAll() {
    this.encodedChunks.clear();
    this._buildChunkIndex();
    let i = 0;
    for (const [chunkId, data] of this._chunkIndex) {
      this.encodedChunks.set(chunkId, data);
      i++;
      if (i % 50 === 0) await new Promise(r => setTimeout(r, 0));
    }
    this._hydrated = true;
  }

  hydrate(entries) {
    this.encodedChunks.clear();
    for (const [chunkId, data] of entries) {
      this.encodedChunks.set(chunkId, data);
    }
    this._hydrated = true;
  }

  getChunk(chunkId) {
    let encoded = this.encodedChunks.get(chunkId);
    if (!encoded) {
      this._buildChunkIndex();
      encoded = this._chunkIndex?.get(chunkId) || null;
      if (encoded) {
        this.encodedChunks.set(chunkId, encoded);
      }
    }
    if (!encoded) return null;
    return {
      id: chunkId,
      text: encoded.text,
      ...encoded.meta,
    };
  }

  getChunks(chunkIds) {
    return chunkIds.map(id => this.getChunk(id)).filter(Boolean);
  }

  generateManifest() {
    const entries = {};

    for (const [chunkId, { meta }] of this.encodedChunks) {
      if (!entries[meta.entryId]) {
        entries[meta.entryId] = {
          source: meta.sourcePath,
          category: meta.category,
          chunks: [],
        };
      }
      entries[meta.entryId].chunks.push({
        id: chunkId,
        keywords: meta.keywords.slice(0, 5).join(', '),
        size: `${Math.round(meta.charCount / 1000)}k`,
      });
    }

    const lines = ['AVAILABLE CONTENT INDEX:'];
    for (const [entryId, entry] of Object.entries(entries)) {
      lines.push(`\n[${entry.category}] ${entry.source}`);
      lines.push(`  Entry ID: ${entryId}`);
      for (const chunk of entry.chunks) {
        lines.push(`  Chunk ${chunk.id}: keywords=[${chunk.keywords}] size=${chunk.size}`);
      }
    }
    lines.push(`\nTotal: ${this.encodedChunks.size} chunks across ${Object.keys(entries).length} entries.`);
    lines.push('\nTo load content, emit: [RETRIEVE:chunkId1,chunkId2,...]');
    lines.push('The system will inject the requested content into your context.');

    return lines.join('\n');
  }

  get totalChunks() {
    return this.encodedChunks.size;
  }
}

let _instance = null;
let _initPromise = null;
export function getBase64Store() {
  if (!_instance) {
    _instance = new Base64Store(getContentStore());
    _initPromise = _instance._ensureHydrated();
  }
  return _instance;
}

export function waitForBase64StoreHydration() {
  if (!_instance) getBase64Store();
  return _initPromise;
}
