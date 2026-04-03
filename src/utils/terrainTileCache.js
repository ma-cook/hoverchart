// Runtime terrain tile cache — fetches high-resolution Terrarium elevation
// tiles from AWS S3 on demand as the camera zooms in close to the globe.
//
// Terrarium encoding: elevation_meters = (R * 256 + G + B / 256) - 32768
// Source data: SRTM 90m (land), GEBCO/ETOPO (ocean), Copernicus DEM gap-fill.
//
// Usage:
//   prefetchArea(lat, lon, zoom)   — fire-and-forget tile loading
//   getCachedElevation(lat, lon)   — sync lookup, returns meters or null
//   setOnTilesLoaded(callback)     — re-render trigger when tiles arrive

const TILE_SIZE = 256;
const BASE_URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium';
const MAX_CACHE_TILES = 500;
const CONCURRENT_FETCHES = 8;

const cache = new Map();      // "z/x/y" → { elevations, bounds }
const pending = new Set();     // keys currently being fetched
const queue = [];              // fetch queue
let activeFetches = 0;
let _onTilesLoaded = null;
let _loadedCount = 0;

export function setOnTilesLoaded(cb) { _onTilesLoaded = cb; }

// --- Tile math ---

function tileKey(z, x, y) { return `${z}/${x}/${y}`; }

function latLonToTile(lat, lon, zoom) {
  const n = 1 << zoom;
  const x = Math.floor((lon + 180) / 360 * n);
  const latRad = lat * Math.PI / 180;
  const y = Math.floor(
    (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n,
  );
  return {
    x: Math.max(0, Math.min(n - 1, x)),
    y: Math.max(0, Math.min(n - 1, y)),
  };
}

function tileBounds(z, x, y) {
  const n = 1 << z;
  const lonW = x / n * 360 - 180;
  const lonE = (x + 1) / n * 360 - 180;
  const latN = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI;
  const latS = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n))) * 180 / Math.PI;
  return { latN, latS, lonW, lonE };
}

// --- Tile fetching ---

async function fetchAndDecode(z, x, y) {
  const key = tileKey(z, x, y);
  try {
    const url = `${BASE_URL}/${key}.png`;
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) return;

    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(TILE_SIZE, TILE_SIZE);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const imageData = ctx.getImageData(0, 0, TILE_SIZE, TILE_SIZE);
    const elevations = new Float32Array(TILE_SIZE * TILE_SIZE);
    const data = imageData.data;
    for (let i = 0; i < TILE_SIZE * TILE_SIZE; i++) {
      const j = i * 4;
      elevations[i] = (data[j] * 256 + data[j + 1] + data[j + 2] / 256) - 32768;
    }

    const bounds = tileBounds(z, x, y);
    cache.set(key, { elevations, bounds });

    // Evict oldest if over capacity
    if (cache.size > MAX_CACHE_TILES) {
      const first = cache.keys().next().value;
      cache.delete(first);
    }

    _loadedCount++;
    if (_onTilesLoaded) _onTilesLoaded(_loadedCount);
  } catch {
    // CORS error, network failure, or decode error — silently ignore
  } finally {
    pending.delete(key);
    activeFetches--;
    drainQueue();
  }
}

function drainQueue() {
  while (queue.length > 0 && activeFetches < CONCURRENT_FETCHES) {
    const { z, x, y } = queue.shift();
    const key = tileKey(z, x, y);
    if (cache.has(key) || pending.has(key)) continue;
    pending.add(key);
    activeFetches++;
    fetchAndDecode(z, x, y);
  }
}

function enqueueTile(z, x, y) {
  const key = tileKey(z, x, y);
  if (cache.has(key) || pending.has(key)) return;
  queue.push({ z, x, y });
}

// --- Public API ---

/**
 * Prefetch a grid of tiles around the given lat/lon at the specified zoom.
 * Non-blocking — tiles load in background and trigger onTilesLoaded callback.
 */
export function prefetchArea(lat, lon, zoom, gridSize = 5) {
  if (Math.abs(lat) > 85) return; // Mercator limit

  const center = latLonToTile(lat, lon, zoom);
  const half = Math.floor(gridSize / 2);
  const n = 1 << zoom;

  for (let dy = -half; dy <= half; dy++) {
    for (let dx = -half; dx <= half; dx++) {
      const tx = ((center.x + dx) % n + n) % n;
      const ty = center.y + dy;
      if (ty < 0 || ty >= n) continue;
      enqueueTile(zoom, tx, ty);
    }
  }
  drainQueue();
}

/**
 * Synchronous elevation lookup from the tile cache.
 * Returns elevation in meters, or null if no tile is cached for this location.
 * Checks from highest available zoom down to zoom 6.
 */
export function getCachedElevation(lat, lon) {
  if (Math.abs(lat) > 85) return null;

  for (let z = 11; z >= 6; z--) {
    const { x, y } = latLonToTile(lat, lon, z);
    const tile = cache.get(tileKey(z, x, y));
    if (!tile) continue;

    const { bounds, elevations } = tile;

    // Pixel position within tile (Mercator)
    const fx = ((lon - bounds.lonW) / (bounds.lonE - bounds.lonW)) * TILE_SIZE;
    const fy = ((bounds.latN - lat) / (bounds.latN - bounds.latS)) * TILE_SIZE;

    const x0 = Math.max(0, Math.min(TILE_SIZE - 1, Math.floor(fx)));
    const y0 = Math.max(0, Math.min(TILE_SIZE - 1, Math.floor(fy)));
    const x1 = Math.min(x0 + 1, TILE_SIZE - 1);
    const y1 = Math.min(y0 + 1, TILE_SIZE - 1);
    const dx2 = Math.max(0, Math.min(1, fx - x0));
    const dy2 = Math.max(0, Math.min(1, fy - y0));

    const v00 = elevations[y0 * TILE_SIZE + x0];
    const v10 = elevations[y0 * TILE_SIZE + x1];
    const v01 = elevations[y1 * TILE_SIZE + x0];
    const v11 = elevations[y1 * TILE_SIZE + x1];

    return v00 * (1 - dx2) * (1 - dy2) + v10 * dx2 * (1 - dy2) +
           v01 * (1 - dx2) * dy2 + v11 * dx2 * dy2;
  }
  return null;
}

/**
 * Returns the number of cached tiles (for debugging/UI).
 */
export function getCacheSize() { return cache.size; }
