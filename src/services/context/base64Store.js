import { getContentStore } from './contentStore';

export class Base64Store {
  constructor(contentStore) {
    this.contentStore = contentStore || getContentStore();
    this.encodedChunks = new Map();
  }

  async encodeAll() {
    this.encodedChunks.clear();

    const entries = Array.from(this.contentStore.entries);
    const CHUNK_ENCODE_BATCH = 200;

    for (let i = 0; i < entries.length; i++) {
      const [entryId, entry] = entries[i];
      for (const chunk of entry.chunks) {
        const b64 = btoa(unescape(encodeURIComponent(chunk.text)));
        this.encodedChunks.set(chunk.id, {
          b64,
          meta: {
            entryId,
            sourcePath: entry.sourcePath,
            category: entry.category,
            keywords: chunk.keywords,
            charCount: chunk.charCount,
            byteSize: b64.length,
            startIndex: chunk.startIndex,
            endIndex: chunk.endIndex,
          },
        });
      }
      if (i % CHUNK_ENCODE_BATCH === 0 && i > 0) {
        await new Promise(r => setTimeout(r, 0));
      }
    }
  }

  hydrate(serializedEncodedChunks) {
    this.encodedChunks.clear();
    for (const [chunkId, data] of serializedEncodedChunks) {
      this.encodedChunks.set(chunkId, data);
    }
  }

  getChunk(chunkId) {
    const encoded = this.encodedChunks.get(chunkId);
    if (!encoded) return null;
    return {
      id: chunkId,
      text: decodeURIComponent(escape(atob(encoded.b64))),
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
export function getBase64Store() {
  if (!_instance) _instance = new Base64Store(getContentStore());
  return _instance;
}
