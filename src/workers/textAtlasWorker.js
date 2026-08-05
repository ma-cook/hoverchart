/**
 * textAtlasWorker.js
 *
 * Web Worker that offloads text atlas rendering from the main thread using
 * OffscreenCanvas.  The expensive operations (measureText, fillText, canvas
 * resize + copy) happen here so the main thread stays responsive.
 *
 * API (exposed via Comlink):
 *   setMaxGPUTextureSize(size)  — forward the GPU limit from main thread
 *   renderBatch(requests)       — measure + draw texts, return entries + ImageBitmaps
 *   clear()                     — reset all pages
 *
 * No DOM, no Three.js, no stores.
 */

import { expose, transfer } from 'comlink';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PADDING = 4;
// Cap page size at 2048 instead of 4096.  A 4096x4096 RGBA page is ~67MB; 32
// pages at that size is ~2GB of backing memory in the worst case — the single
// largest contributor to the OOM crash after scanning a large repo.  2048x2048
// (~16MB/page, ~537MB total) keeps the atlas within bounds while the page
// count naturally absorbs additional entries.
const PAGE_MAX_SIZE = 2048;
const MAX_PAGES = 32;

let maxGPUTextureSize = 8192;

// ---------------------------------------------------------------------------
// Key generation — must match textAtlas.js exactly
// ---------------------------------------------------------------------------
function getKey(text, style) {
  return `${text}|${style.fontSize || 16}|${style.color || '#000000'}|${
    style.fontFamily || 'Arial'}|${style.bold || false}|${style.italic || false}|${
    style.underline || false}`;
}

// ---------------------------------------------------------------------------
// AtlasPage — one OffscreenCanvas page
// ---------------------------------------------------------------------------
class AtlasPage {
  constructor(width = 2048, height = 2048) {
    this.maxWidth = width;
    this.maxHeight = height;
    this.canvas = new OffscreenCanvas(width, height);
    this.ctx = this.canvas.getContext('2d');
    this.ctx.clearRect(0, 0, width, height);
    this.entries = new Map(); // key → entry
    this.currentX = PADDING;
    this.currentY = PADDING;
    this.rowHeight = 0;
    this.dirty = false;
    this.version = 0;
  }

  _resize() {
    const limit = Math.min(maxGPUTextureSize, PAGE_MAX_SIZE);
    const newW = Math.min(this.maxWidth * 2, limit);
    const newH = Math.min(this.maxHeight * 2, limit);
    if (newW === this.maxWidth && newH === this.maxHeight) return false;

    const oldCanvas = this.canvas;
    this.maxWidth = newW;
    this.maxHeight = newH;
    this.canvas = new OffscreenCanvas(newW, newH);
    this.ctx = this.canvas.getContext('2d');
    this.ctx.drawImage(oldCanvas, 0, 0);

    // Release the old canvas backing store (zeroing its dimensions forces the
    // implementation to free the previous allocation instead of keeping it
    // alive until GC).
    oldCanvas.width = 0;
    oldCanvas.height = 0;

    // Recalculate UVs for all existing entries
    for (const [, entry] of this.entries) {
      entry.uvs = {
        u: entry.x / this.maxWidth,
        v: entry.y / this.maxHeight,
        uWidth: entry.width / this.maxWidth,
        vHeight: entry.height / this.maxHeight,
      };
    }

    this.dirty = true;
    this.version++;
    return true;
  }

  /**
   * Measure, layout, and draw a single text entry.
   * Returns the entry or null if the page is full (even after resize).
   */
  addText(key, text, style) {
    if (this.entries.has(key)) return this.entries.get(key);

    const fontSize = style.fontSize || 16;
    const fontFamily = style.fontFamily || 'Arial, sans-serif';
    const color = style.color || '#000000';
    const fontWeight = style.bold ? 'bold' : 'normal';
    const fontStyle = style.italic ? 'italic' : 'normal';
    const font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;

    this.ctx.font = font;
    const metrics = this.ctx.measureText(text);
    const width = Math.ceil(metrics.width);
    const height = Math.ceil(fontSize * 1.5);

    // Row wrap
    if (this.currentX + width + PADDING > this.maxWidth) {
      this.currentX = PADDING;
      this.currentY += this.rowHeight + PADDING;
      this.rowHeight = 0;
    }

    // Resize loop
    while (this.currentY + height + PADDING > this.maxHeight) {
      if (!this._resize()) return null;
      if (this.currentX + width + PADDING > this.maxWidth) {
        this.currentX = PADDING;
        this.currentY += this.rowHeight + PADDING;
        this.rowHeight = 0;
      }
    }

    // Draw text
    this.ctx.font = font;
    this.ctx.fillStyle = color;
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(text, this.currentX, this.currentY);

    // Underline
    if (style.underline) {
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = Math.max(1, fontSize / 16);
      this.ctx.beginPath();
      this.ctx.moveTo(this.currentX, this.currentY + height - 2);
      this.ctx.lineTo(this.currentX + width, this.currentY + height - 2);
      this.ctx.stroke();
    }

    const uvs = {
      u: this.currentX / this.maxWidth,
      v: this.currentY / this.maxHeight,
      uWidth: width / this.maxWidth,
      vHeight: height / this.maxHeight,
    };

    const entry = { key, x: this.currentX, y: this.currentY, width, height, uvs };
    this.entries.set(key, entry);

    this.currentX += width + PADDING;
    this.rowHeight = Math.max(this.rowHeight, height);
    this.dirty = true;

    return entry;
  }
}

// ---------------------------------------------------------------------------
// Page management
// ---------------------------------------------------------------------------
const pages = [];
const allEntries = new Map(); // key → { ...entry, pageIndex }

function addPage() {
  const p = new AtlasPage(2048, 2048);
  pages.push(p);
  return p;
}

// Always start with one page
addPage();

// ---------------------------------------------------------------------------
// Worker API
// ---------------------------------------------------------------------------
const workerApi = {
  /**
   * Forward the GPU's MAX_TEXTURE_SIZE so page resizing stays within limits.
   */
  setMaxGPUTextureSize(size) {
    maxGPUTextureSize = size;
  },

  /**
   * Render a batch of text items.
   *
   * @param {Array<{text: string, style: Object}>} requests
   * @returns {{
   *   entries: Array<{key, x, y, width, height, uvs, pageIndex}>,
   *   bitmaps: Array<{pageIndex, bitmap: ImageBitmap, width, height}>,
   *   allEntries: Array|null,   — non-null when a page resized (full UV refresh)
   *   pageCount: number,
   * }}
   */
  async renderBatch(requests) {
    const newEntries = [];
    const preVersions = pages.map(p => p.version);

    for (let i = 0; i < requests.length; i++) {
      const req = requests[i];
      const key = getKey(req.text, req.style);

      // Already rendered — fast return
      if (allEntries.has(key)) {
        newEntries.push(allEntries.get(key));
        continue;
      }

      // Try the current (last) page
      let page = pages[pages.length - 1];
      let pageIdx = pages.length - 1;
      let entry = page.addText(key, req.text, req.style);

      if (!entry) {
        // Page full — create a new one
        if (pages.length >= MAX_PAGES) {
          // Throttle warning to at most once every 5 seconds to avoid log spam
          const now = Date.now();
          if (!workerApi._lastFullWarn || now - workerApi._lastFullWarn > 5000) {
            workerApi._lastFullWarn = now;
            workerApi._skippedSinceWarn = (workerApi._skippedSinceWarn || 0) + 1;
            console.warn(
              `TextAtlasWorker: ${MAX_PAGES} pages full (${allEntries.size} entries). ` +
              `Skipping texts (${workerApi._skippedSinceWarn} skipped so far)`
            );
          } else {
            workerApi._skippedSinceWarn = (workerApi._skippedSinceWarn || 0) + 1;
          }
          continue;
        }
        page = addPage();
        pageIdx = pages.length - 1;
        entry = page.addText(key, req.text, req.style);
        if (!entry) continue;
      }

      const fullEntry = { ...entry, pageIndex: pageIdx };
      allEntries.set(key, fullEntry);
      newEntries.push(fullEntry);
    }

    // Detect pages that resized during this batch
    let anyResized = false;
    for (let i = 0; i < Math.min(preVersions.length, pages.length); i++) {
      if (pages[i].version !== preVersions[i]) {
        anyResized = true;
        break;
      }
    }

    // Collect ImageBitmaps for dirty pages (zero-copy transfer to main thread)
    const bitmapDescs = [];
    const transferList = [];
    for (let i = 0; i < pages.length; i++) {
      if (!pages[i].dirty) continue;

      // Pre-flip the bitmap vertically so that on the main thread we can
      // set texture.flipY = false.  Three.js ignores UNPACK_FLIP_Y_WEBGL
      // for ImageBitmap sources, so we must deliver the data pre-flipped to
      // match the UV convention used by AtlasTextSprite / InstancedAtlasText.
      const bmp = await createImageBitmap(pages[i].canvas, {
        imageOrientation: 'flipY',
      });
      bitmapDescs.push({
        pageIndex: i,
        bitmap: bmp,
        width: pages[i].maxWidth,
        height: pages[i].maxHeight,
      });
      transferList.push(bmp);
      pages[i].dirty = false;
    }

    // If any page resized, return ALL entries so main thread can refresh UVs.
    // Also refresh allEntries map with page entries that got new UVs.
    let allUpdatedEntries = null;
    if (anyResized) {
      // Rebuild allEntries from page-level maps (source of truth after resize)
      for (let pi = 0; pi < pages.length; pi++) {
        for (const [, entry] of pages[pi].entries) {
          const full = { ...entry, pageIndex: pi };
          allEntries.set(entry.key, full);
        }
      }
      allUpdatedEntries = [...allEntries.values()];
    }

    return transfer(
      {
        entries: newEntries,
        bitmaps: bitmapDescs,
        allEntries: allUpdatedEntries,
        pageCount: pages.length,
      },
      transferList,
    );
  },

  /**
   * Clear all pages and start fresh.
   */
  clear() {
    pages.length = 0;
    allEntries.clear();
    addPage();
  },
};

expose(workerApi);
