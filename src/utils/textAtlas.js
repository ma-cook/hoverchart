import * as THREE from 'three';

/**
 * Text Atlas - Combines multiple text labels into a single texture atlas
 * to reduce texture binds and improve rendering performance for large diagrams
 */
export class TextAtlas {
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
   * Doubles the smaller dimension (up to 16384 max).
   * Preserves existing drawn content and recalculates all entry UVs.
   * @returns {boolean} true if resize succeeded
   */
  _resize() {
    const oldCanvas = this.canvas;
    const oldWidth = this.maxWidth;
    const oldHeight = this.maxHeight;

    // Double the dimension that gives more rows (prefer height since packing is top-to-bottom)
    let newWidth = this.maxWidth;
    let newHeight = this.maxHeight;
    if (this.maxHeight <= this.maxWidth) {
      newHeight = Math.min(this.maxHeight * 2, 16384);
    } else {
      newWidth = Math.min(this.maxWidth * 2, 16384);
    }

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

    // Check if we've run out of space — auto-expand if possible
    if (this.currentY + height + this.padding > this.maxHeight) {
      if (this._resize()) {
        // Retry — row wrap already happened above, just need the height check to pass now
        if (this.currentY + height + this.padding > this.maxHeight) {
          // Still doesn't fit even after resize (shouldn't happen but be safe)
          console.warn('TextAtlas: Still out of space after resize');
          return null;
        }
      } else {
        console.warn('TextAtlas: At maximum size (16384), cannot expand further');
        return null;
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
 * Get or create the global text atlas
 */
export function getGlobalTextAtlas() {
  if (!globalAtlas) {
    globalAtlas = new TextAtlas({
      maxWidth: 8192,
      maxHeight: 8192,
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

  // Create material using the atlas texture
  const material = new THREE.MeshBasicMaterial({
    map: atlas.getTexture(),
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(position[0], position[1], position[2]);

  return mesh;
}
