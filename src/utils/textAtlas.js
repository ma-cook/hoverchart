import * as THREE from 'three';

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
    const gpuLimit = TextAtlas._maxGPUTextureSize;

    // Jump straight to the GPU max in ONE step instead of doubling gradually.
    // Gradual doubling (2048→4096→8192) causes a chain of canvas copies + GPU
    // re-uploads that can crash the graphics card during progressive loading.
    let newWidth = gpuLimit;
    let newHeight = gpuLimit;

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
 * Maximum number of atlas pages to prevent GPU VRAM exhaustion.
 * Each page at 8192×8192 RGBA = ~256MB VRAM.
 * 3 pages ≈ 768MB — safe for most GPUs.
 */
const MAX_PAGES = 3;

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
    // hammered with a 256 MB upload the moment the first text is added.
    // _resize() will jump straight to gpuMax in one step if needed.
    const page = new TextAtlas({
      ...this._pageOpts,
      maxWidth: 2048,
      maxHeight: 2048,
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

  /** Actually push dirty textures to the GPU. */
  _flushTextures() {
    for (const page of this._pages) {
      page.updateTexture();
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

/**
 * Get or create the global text atlas (multi-page)
 */
export function getGlobalTextAtlas() {
  if (!globalAtlas) {
    globalAtlas = new MultiPageTextAtlas({
      padding: 4,
    });
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
