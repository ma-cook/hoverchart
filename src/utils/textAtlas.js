import * as THREE from 'three';
import useTextAtlasStore from '../stores/textAtlasStore.js';

/**
 * Text Atlas - Combines multiple text labels into a single texture atlas
 * to reduce texture binds and improve rendering performance for large diagrams
 */
export class TextAtlas {
  /**
   * Maximum texture dimension the GPU supports.
   * Detected lazily via setMaxGPUTextureSize() the first time a component
   * has access to the WebGL context.  Until then we use a safe default
   * (8192) that works on virtually all hardware from the last decade.
   */
  static _maxGPUTextureSize = 8192;
  static _gpuLimitDetected = false;

  /**
   * Call once with the renderer's gl.getParameter(gl.MAX_TEXTURE_SIZE)
   * to let all atlas instances respect the actual GPU limit.
   */
  static setMaxGPUTextureSize(size) {
    if (TextAtlas._gpuLimitDetected) return;
    TextAtlas._maxGPUTextureSize = size;
    TextAtlas._gpuLimitDetected = true;
  }

  constructor(options = {}) {
    this.maxWidth = options.maxWidth || 2048;
    this.maxHeight = options.maxHeight || 2048;
    this.maxResizeLimit = options.maxResizeLimit || TextAtlas._maxGPUTextureSize;
    this.padding = options.padding || 4;
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.maxWidth;
    this.canvas.height = this.maxHeight;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    // Clear canvas with transparent background
    this.ctx.clearRect(0, 0, this.maxWidth, this.maxHeight);

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.needsUpdate = true;

    // Track text entries
    this.entries = new Map(); // text -> { x, y, width, height, uvs }
    this.currentX = this.padding;
    this.currentY = this.padding;
    this.rowHeight = 0;
    this.dirty = false;
    this.version = 0; // Incremented on resize so consumers can detect UV changes
  }

  /**
   * Auto-expand the atlas canvas when out of space.
   * Doubles the smaller dimension (up to the GPU's MAX_TEXTURE_SIZE).
   * Preserves existing drawn content and recalculates all entry UVs.
   * @returns {boolean} true if resize succeeded
   */
  _resize() {
    const oldCanvas = this.canvas;
    const oldWidth = this.maxWidth;
    const oldHeight = this.maxHeight;
    const limit = Math.min(TextAtlas._maxGPUTextureSize, this.maxResizeLimit);

    // Double both dimensions up to the per-page limit.
    // This caps the upload size per resize (e.g. 4096×4096 = 64 MB)
    // instead of jumping to the GPU max (8192×8192 = 256 MB).
    let newWidth = Math.min(oldWidth * 2, limit);
    let newHeight = Math.min(oldHeight * 2, limit);

    // Already at max size
    if (newWidth === oldWidth && newHeight === oldHeight) {
      return false;
    }

    // Create new larger canvas and copy old content
    this.maxWidth = newWidth;
    this.maxHeight = newHeight;
    this.canvas = document.createElement('canvas');
    this.canvas.width = newWidth;
    this.canvas.height = newHeight;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.ctx.drawImage(oldCanvas, 0, 0);

    // Recalculate UV coordinates for all existing entries (normalization factors changed)
    for (const [, entry] of this.entries) {
      entry.uvs = {
        u: entry.x / this.maxWidth,
        v: entry.y / this.maxHeight,
        uWidth: entry.width / this.maxWidth,
        vHeight: entry.height / this.maxHeight,
      };
    }

    // Update texture to use new canvas (same texture object, so all materials stay valid)
    this.texture.image = this.canvas;
    this.texture.needsUpdate = true;
    this.version++;

    return true;
  }

  /**
   * Add text to the atlas
   * @param {string} text - Text to render
   * @param {object} style - Text style (fontSize, color, fontFamily, etc.)
   * @returns {object} UV coordinates and dimensions
   */
  addText(text, style = {}) {
    const key = this._getKey(text, style);

    // Return cached entry if it exists
    if (this.entries.has(key)) {
      return this.entries.get(key);
    }

    // Set up canvas context for measurement
    const fontSize = style.fontSize || 16;
    const fontFamily = style.fontFamily || 'Arial, sans-serif';
    const color = style.color || '#000000';
    const fontWeight = style.bold ? 'bold' : 'normal';
    const fontStyle = style.italic ? 'italic' : 'normal';

    this.ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;

    // Measure text
    const metrics = this.ctx.measureText(text);
    const width = Math.ceil(metrics.width);
    const height = Math.ceil(fontSize * 1.5); // Add padding for descenders

    // Check if we need to move to next row
    if (this.currentX + width + this.padding > this.maxWidth) {
      this.currentX = this.padding;
      this.currentY += this.rowHeight + this.padding;
      this.rowHeight = 0;
    }

    // Check if we've run out of space — auto-expand until it fits or we hit the GPU limit
    while (this.currentY + height + this.padding > this.maxHeight) {
      if (!this._resize()) {
        // Silently return null — MultiPageTextAtlas handles overflow by creating a new page
        return null;
      }
      // After a width-only resize the row might now fit horizontally,
      // so re-check the row wrap
      if (this.currentX + width + this.padding > this.maxWidth) {
        this.currentX = this.padding;
        this.currentY += this.rowHeight + this.padding;
        this.rowHeight = 0;
      }
    }

    // Set font BEFORE drawing
    this.ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    this.ctx.fillStyle = color;
    this.ctx.textBaseline = 'top';

    // Draw text to canvas
    this.ctx.fillText(text, this.currentX, this.currentY);

    // Apply underline if needed
    if (style.underline) {
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = Math.max(1, fontSize / 16);
      this.ctx.beginPath();
      this.ctx.moveTo(this.currentX, this.currentY + height - 2);
      this.ctx.lineTo(this.currentX + width, this.currentY + height - 2);
      this.ctx.stroke();
    }

    // Calculate UV coordinates (normalized 0-1)
    const uvs = {
      u: this.currentX / this.maxWidth,
      v: this.currentY / this.maxHeight,
      uWidth: width / this.maxWidth,
      vHeight: height / this.maxHeight,
    };

    // Store entry
    const entry = {
      x: this.currentX,
      y: this.currentY,
      width,
      height,
      uvs,
      text,
      style,
    };

    this.entries.set(key, entry);

    // Update position for next text
    this.currentX += width + this.padding;
    this.rowHeight = Math.max(this.rowHeight, height);

    // Mark texture as dirty
    this.dirty = true;

    return entry;
  }

  /**
   * Update the texture (call after adding multiple texts)
   */
  updateTexture() {
    if (this.dirty) {
      this.texture.needsUpdate = true;
      this.dirty = false;

      // Debug: Show the atlas canvas (comment out to hide)
      // if (typeof window !== 'undefined') {
      //   this.showDebugCanvas();
      // }
    }
  }

  /**
   * Get the atlas texture
   */
  getTexture() {
    this.updateTexture();
    return this.texture;
  }

  /**
   * Debug: Show the atlas canvas in the DOM
   */
  showDebugCanvas() {
    if (!this.debugElement) {
      this.debugElement = document.createElement('div');
      this.debugElement.style.position = 'fixed';
      this.debugElement.style.top = '10px';
      this.debugElement.style.right = '10px';
      this.debugElement.style.zIndex = '10000';
      this.debugElement.style.background = 'white';
      this.debugElement.style.border = '2px solid red';
      this.debugElement.style.padding = '5px';

      const title = document.createElement('div');
      title.textContent = 'Text Atlas Debug';
      title.style.fontWeight = 'bold';
      title.style.marginBottom = '5px';

      const canvasClone = this.canvas.cloneNode(true);
      canvasClone.style.maxWidth = '400px';
      canvasClone.style.maxHeight = '400px';
      canvasClone.style.border = '1px solid black';

      this.debugElement.appendChild(title);
      this.debugElement.appendChild(canvasClone);
      document.body.appendChild(this.debugElement);
    } else {
      // Update the canvas
      const canvasClone = this.debugElement.querySelector('canvas');
      const newCanvas = this.canvas.cloneNode(true);
      newCanvas.style.maxWidth = '400px';
      newCanvas.style.maxHeight = '400px';
      newCanvas.style.border = '1px solid black';
      this.debugElement.replaceChild(newCanvas, canvasClone);
    }
  }

  /**
   * Clear the atlas and start over
   */
  clear() {
    this.ctx.clearRect(0, 0, this.maxWidth, this.maxHeight);
    this.entries.clear();
    this.currentX = this.padding;
    this.currentY = this.padding;
    this.rowHeight = 0;
    this.dirty = true;
  }

  /**
   * Generate a unique key for text+style combination
   */
  _getKey(text, style) {
    return `${text}|${style.fontSize || 16}|${style.color || '#000000'}|${
      style.fontFamily || 'Arial'
    }|${style.bold || false}|${style.italic || false}|${
      style.underline || false
    }`;
  }

  /**
   * Get statistics about atlas usage
   */
  getStats() {
    return {
      entriesCount: this.entries.size,
      currentX: this.currentX,
      currentY: this.currentY + this.rowHeight,
      utilization: ((this.currentY + this.rowHeight) / this.maxHeight) * 100,
      maxCapacity: this.maxWidth * this.maxHeight,
    };
  }

  /**
   * Dispose of resources
   */
  dispose() {
    if (this.texture) {
      this.texture.dispose();
    }
    this.entries.clear();
    this.canvas = null;
    this.ctx = null;
  }
}

// Global singleton atlas for the application
let globalAtlas = null;

/**
 * Multi-page text atlas that automatically creates new pages when the
 * current one fills up.  Entries include a `texture` reference so
 * consumers can build a material pointing at the correct page.
 */
/**
 * Maximum per-page texture dimension.
 * Capping at 4096 limits each page to ~64 MB VRAM (4096×4096 RGBA)
 * instead of ~256 MB (8192×8192).  Smaller pages are faster to upload
 * and allow finer-grained VRAM management.
 */
const PAGE_MAX_SIZE = 4096;

/**
 * Maximum number of atlas pages to prevent GPU VRAM exhaustion.
 * Each page at 4096×4096 RGBA ≈ 64 MB VRAM.
 * 8 pages ≈ 512 MB — safe for most GPUs while holding many more entries
 * than the old 3×8192 (768 MB) layout.
 */
const MAX_PAGES = 8;

class MultiPageTextAtlas {
  /**
   * Minimum ms between GPU texture uploads.
   * During progressive loading many texts are added across consecutive frames;
   * uploading the full texture every frame (256 MB at 8192×8192) can crash the
   * GPU.  Throttling to one upload per interval keeps bandwidth manageable.
   * REDUCED from 200ms to 50ms to avoid text appearing blank during
   * progressive mounting — 50ms still limits to ~20 uploads/sec which is safe.
   */
  static UPLOAD_THROTTLE_MS = 50;

  constructor(pageOpts = {}) {
    this._pageOpts = pageOpts;
    this._pages = [];
    // Combined lookup across all pages: key → entry (with .texture added)
    // Exposed as `entries` for compatibility with AtlasTextSprite's UV fixup code
    this.entries = new Map();
    this._version = 0;
    this._lastUploadTime = 0;
    this._pendingUploadId = null;
    this._addPage();
  }

  _addPage() {
    // Start pages SMALL (2048×2048 = 16 MB upload) so the GPU isn't
    // hammered with a large upload the moment the first text is added.
    // _resize() will double dimensions up to PAGE_MAX_SIZE.
    const page = new TextAtlas({
      ...this._pageOpts,
      maxWidth: 2048,
      maxHeight: 2048,
      maxResizeLimit: PAGE_MAX_SIZE,
    });
    this._pages.push(page);
    return page;
  }

  /**
   * Add text — tries the current (last) page, creates a new page if full.
   * The returned entry has an extra `.texture` property for the page it lives on.
   */
  addText(text, style = {}) {
    const key = this._getKey(text, style);

    if (this.entries.has(key)) {
      return this.entries.get(key);
    }

    // Try current page
    let page = this._pages[this._pages.length - 1];
    let entry = page.addText(text, style);

    if (!entry) {
      // Current page full — check page limit before creating another
      if (this._pages.length >= MAX_PAGES) {
        console.warn(
          `MultiPageTextAtlas: ${MAX_PAGES} pages full (${this.entries.size} entries). ` +
          `Skipping: "${text.slice(0, 40)}"`
        );
        return null;
      }
      page = this._addPage();
      entry = page.addText(text, style);
      if (!entry) {
        console.warn('MultiPageTextAtlas: text too large for a single atlas page:', text);
        return null;
      }
    }

    // Attach the page's texture so consumers know which map to use
    entry.texture = page.texture;
    this.entries.set(key, entry);
    return entry;
  }

  /**
   * Flush dirty flags on all pages — throttled to prevent GPU crashes.
   * During progressive mounting dozens of texts can be added over consecutive
   * frames. Uploading a large texture every single frame stalls the GPU.
   * This limits uploads to once per UPLOAD_THROTTLE_MS and schedules a
   * deferred upload so the latest content eventually reaches the GPU.
   */
  updateTexture() {
    const now = performance.now();
    const elapsed = now - this._lastUploadTime;

    if (elapsed < MultiPageTextAtlas.UPLOAD_THROTTLE_MS) {
      // Too soon — schedule a deferred upload if not already pending
      if (!this._pendingUploadId) {
        this._pendingUploadId = setTimeout(() => {
          this._pendingUploadId = null;
          this._flushTextures();
        }, MultiPageTextAtlas.UPLOAD_THROTTLE_MS - elapsed);
      }
      return;
    }

    this._flushTextures();
  }

  /** Actually push dirty textures to the GPU — ONE page per call.
   *  Uploading multiple large textures in a single frame can crash the GPU.
   *  If more pages are still dirty, a deferred flush is scheduled.
   */
  _flushTextures() {
    for (const page of this._pages) {
      if (page.dirty) {
        page.updateTexture();
        this._lastUploadTime = performance.now();
        // If other pages are also dirty, schedule another flush
        const hasMoreDirty = this._pages.some(p => p.dirty);
        if (hasMoreDirty && !this._pendingUploadId) {
          this._pendingUploadId = setTimeout(() => {
            this._pendingUploadId = null;
            this._flushTextures();
          }, MultiPageTextAtlas.UPLOAD_THROTTLE_MS);
        }
        return; // Only ONE page per flush cycle
      }
    }
    this._lastUploadTime = performance.now();
  }

  /** Primary texture (page 0) — used when a single texture ref is needed */
  getTexture() {
    this._pages[0].updateTexture();
    return this._pages[0].texture;
  }

  /** Generate the same cache key that TextAtlas uses */
  _getKey(text, style) {
    return `${text}|${style.fontSize || 16}|${style.color || '#000000'}|${
      style.fontFamily || 'Arial'}|${style.bold || false}|${style.italic || false}|${
      style.underline || false}`;
  }

  /** Aggregate stats */
  getStats() {
    return {
      pages: this._pages.length,
      entriesCount: this.entries.size,
      perPage: this._pages.map((p) => p.getStats()),
    };
  }

  /** Current atlas version — sum of all page versions */
  get version() {
    let v = 0;
    for (const p of this._pages) v += p.version;
    return v;
  }

  dispose() {
    if (this._pendingUploadId) {
      clearTimeout(this._pendingUploadId);
      this._pendingUploadId = null;
    }
    for (const page of this._pages) {
      page.dispose();
    }
    this._pages = [];
    this.entries.clear();
  }
}

// ---------------------------------------------------------------------------
// OffscreenCanvas feature detection
// ---------------------------------------------------------------------------
let _offscreenCanvasSupported = null;

/**
 * Test whether the browser supports OffscreenCanvas 2D text rendering.
 * Runs once and caches the result.
 */
function isOffscreenCanvasTextSupported() {
  if (_offscreenCanvasSupported !== null) return _offscreenCanvasSupported;
  try {
    const c = new OffscreenCanvas(1, 1);
    const ctx = c.getContext('2d');
    if (!ctx || typeof ctx.measureText !== 'function' || typeof ctx.fillText !== 'function') {
      _offscreenCanvasSupported = false;
      return false;
    }
    ctx.font = '16px Arial';
    const m = ctx.measureText('test');
    _offscreenCanvasSupported = typeof m.width === 'number' && m.width > 0;
    return _offscreenCanvasSupported;
  } catch {
    _offscreenCanvasSupported = false;
    return false;
  }
}

// ---------------------------------------------------------------------------
// WorkerMultiPageTextAtlas — offloads text rendering to a Web Worker
// ---------------------------------------------------------------------------

/**
 * Drop-in replacement for MultiPageTextAtlas that renders text on
 * OffscreenCanvas inside a Web Worker.
 *
 * API contract difference from the sync version:
 *   addText() returns `null` on the first call for a new text+style combo.
 *   The component re-renders via the Zustand atlasVersion bump when the
 *   worker finishes, and the second addText() call returns the cached entry.
 *
 * The existing UV-fixup code in AtlasTextSprite / InstancedAtlasText
 * continues to work because this class exposes the same `entries` Map,
 * `version` getter, and `_getKey()` method.
 */
class WorkerMultiPageTextAtlas {
  constructor() {
    /** @type {Map<string, Object>} key → entry (with .texture) */
    this.entries = new Map();

    /** @type {THREE.Texture[]} One texture per atlas page */
    this._pageTextures = [];

    /** Pending addText requests waiting for the next flush */
    this._pendingQueue = [];
    this._flushScheduled = false;
    this._flushing = false;
    this._version = 0;
    this._maxGPUSizeForwarded = false;

    // Ensure page 0 exists with a placeholder texture
    this._ensurePage(0);
  }

  // -- Public API (matches MultiPageTextAtlas) --

  get version() {
    return this._version;
  }

  /**
   * Look up or queue a text entry.
   * @returns {Object|null} cached entry or null (pending worker render)
   */
  addText(text, style = {}) {
    const key = this._getKey(text, style);
    if (this.entries.has(key)) return this.entries.get(key);

    this._pendingQueue.push({ text, style, key });
    this._scheduleFlush();
    return null;
  }

  /**
   * Compatibility shim — the worker handles its own texture updates.
   * Triggers a flush if there are pending items.
   */
  updateTexture() {
    if (this._pendingQueue.length > 0 && !this._flushScheduled) {
      this._scheduleFlush();
    }
  }

  /** Primary texture (page 0). */
  getTexture() {
    return this._pageTextures[0] || null;
  }

  _getKey(text, style) {
    return `${text}|${style.fontSize || 16}|${style.color || '#000000'}|${
      style.fontFamily || 'Arial'}|${style.bold || false}|${style.italic || false}|${
      style.underline || false}`;
  }

  getStats() {
    return { pages: this._pageTextures.length, entriesCount: this.entries.size };
  }

  dispose() {
    for (const tex of this._pageTextures) {
      if (tex.image && typeof tex.image.close === 'function') tex.image.close();
      tex.dispose();
    }
    this._pageTextures = [];
    this.entries.clear();
    this._pendingQueue = [];
    import('../workers/textAtlasWorkerClient.js').then(
      ({ terminateTextAtlasWorker }) => terminateTextAtlasWorker()
    ).catch(() => {});
  }

  // -- Internal --

  _ensurePage(index) {
    while (this._pageTextures.length <= index) {
      const tex = new THREE.Texture();
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      // The worker pre-flips the ImageBitmap (imageOrientation: 'flipY')
      // so we must tell Three.js NOT to flip again during upload.
      // Without this, UNPACK_FLIP_Y_WEBGL is silently ignored for
      // ImageBitmap sources, causing upside-down / garbled text.
      tex.flipY = false;
      this._pageTextures.push(tex);
    }
  }

  _scheduleFlush() {
    if (this._flushScheduled) return;
    this._flushScheduled = true;
    requestAnimationFrame(() => this._flush());
  }

  async _flush() {
    this._flushScheduled = false;
    if (this._pendingQueue.length === 0) return;
    if (this._flushing) {
      // Already in-flight — re-schedule so the new items get sent next frame
      this._scheduleFlush();
      return;
    }
    this._flushing = true;

    // Grab and deduplicate the queue
    const raw = this._pendingQueue.splice(0);
    const seen = new Set();
    const requests = [];
    for (const req of raw) {
      if (this.entries.has(req.key) || seen.has(req.key)) continue;
      seen.add(req.key);
      requests.push(req);
    }

    if (requests.length === 0) {
      this._flushing = false;
      return;
    }

    try {
      const { getTextAtlasWorker } = await import('../workers/textAtlasWorkerClient.js');
      const worker = getTextAtlasWorker();

      // Forward GPU texture-size limit once
      if (!this._maxGPUSizeForwarded && TextAtlas._gpuLimitDetected) {
        await worker.setMaxGPUTextureSize(TextAtlas._maxGPUTextureSize);
        this._maxGPUSizeForwarded = true;
      }

      const result = await worker.renderBatch(
        requests.map(r => ({ text: r.text, style: r.style }))
      );

      // Ensure page textures exist for all pages the worker reports
      this._ensurePage(result.pageCount - 1);

      // Update textures from transferred ImageBitmaps
      for (const { pageIndex, bitmap } of result.bitmaps) {
        const tex = this._pageTextures[pageIndex];
        if (tex.image && typeof tex.image.close === 'function') tex.image.close();
        tex.image = bitmap;
        tex.needsUpdate = true;
      }

      // If the worker resized any page, refresh ALL cached entries (UVs changed)
      if (result.allEntries) {
        for (const entry of result.allEntries) {
          this._ensurePage(entry.pageIndex);
          const tex = this._pageTextures[entry.pageIndex];
          this.entries.set(entry.key, { ...entry, texture: tex });
        }
      }

      // Add newly rendered entries to the cache
      for (const entry of result.entries) {
        if (!this.entries.has(entry.key)) {
          this._ensurePage(entry.pageIndex);
          const tex = this._pageTextures[entry.pageIndex];
          this.entries.set(entry.key, { ...entry, texture: tex });
        }
      }

      this._version++;

      // Notify React via the Zustand store so consumers re-render
      useTextAtlasStore.getState().bumpVersion();

    } catch (err) {
      console.warn('[WorkerMultiPageTextAtlas] Worker error, falling back to sync atlas:', err);
      _switchToSyncAtlas(requests);
    } finally {
      this._flushing = false;
      if (this._pendingQueue.length > 0) {
        this._scheduleFlush();
      }
    }
  }
}

/**
 * Emergency fallback: replace the global atlas with the synchronous
 * MultiPageTextAtlas and re-add any pending requests.
 */
function _switchToSyncAtlas(pendingRequests = []) {
  const oldAtlas = globalAtlas;
  globalAtlas = new MultiPageTextAtlas({ padding: 4 });

  // Re-add previously cached entries (sync draw)
  if (oldAtlas && oldAtlas.entries) {
    for (const [, entry] of oldAtlas.entries) {
      if (entry.text && entry.style) {
        globalAtlas.addText(entry.text, entry.style);
      }
    }
  }

  // Add the requests that triggered the error
  for (const req of pendingRequests) {
    globalAtlas.addText(req.text, req.style);
  }
  globalAtlas.updateTexture();

  if (oldAtlas && typeof oldAtlas.dispose === 'function') {
    oldAtlas.dispose();
  }

  // Bump Zustand version so consumers re-render with the sync atlas
  try {
    useTextAtlasStore.getState().bumpVersion();
  } catch { /* ignore */ }
}

/**
 * Get or create the global text atlas (multi-page).
 * Uses the OffscreenCanvas worker-backed atlas when the browser supports
 * OffscreenCanvas 2D text rendering, otherwise falls back to the
 * synchronous main-thread atlas.
 */
export function getGlobalTextAtlas() {
  if (!globalAtlas) {
    if (isOffscreenCanvasTextSupported()) {
      globalAtlas = new WorkerMultiPageTextAtlas();
    } else {
      globalAtlas = new MultiPageTextAtlas({ padding: 4 });
    }
  }
  return globalAtlas;
}

/**
 * Reset the global text atlas (useful when switching spaces/diagrams)
 */
export function resetGlobalTextAtlas() {
  if (globalAtlas) {
    globalAtlas.dispose();
    globalAtlas = null;
  }
}

/**
 * Create a mesh using the text atlas
 */
export function createAtlasTextMesh(text, style = {}, position = [0, 0, 0]) {
  const atlas = getGlobalTextAtlas();
  const entry = atlas.addText(text, style);

  if (!entry) {
    console.error('Failed to add text to atlas:', text);
    return null;
  }

  // Create plane geometry sized to match the text
  const aspectRatio = entry.width / entry.height;
  const displayHeight = (style.fontSize || 16) / 10; // Scale to world units
  const displayWidth = displayHeight * aspectRatio;

  const geometry = new THREE.PlaneGeometry(displayWidth, displayHeight);

  // Update UVs to match atlas coordinates
  const uvs = geometry.attributes.uv;
  const { u, v, uWidth, vHeight } = entry.uvs;

  // Bottom-left
  uvs.setXY(0, u, v + vHeight);
  // Bottom-right
  uvs.setXY(1, u + uWidth, v + vHeight);
  // Top-left
  uvs.setXY(2, u, v);
  // Top-right
  uvs.setXY(3, u + uWidth, v);

  uvs.needsUpdate = true;

  // Create material using the entry's page texture
  const material = new THREE.MeshBasicMaterial({
    map: entry.texture || atlas.getTexture(),
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(position[0], position[1], position[2]);

  return mesh;
}
