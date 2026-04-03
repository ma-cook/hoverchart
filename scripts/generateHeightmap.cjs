#!/usr/bin/env node
// Downloads real elevation data from AWS Terrarium terrain tiles and
// composites into an equirectangular heightmap PNG.
//
// Terrarium tiles encode actual elevation in meters via RGB:
//   elevation_m = (R * 256 + G + B / 256) - 32768
//
// Data sources behind the tiles: SRTM (land), ETOPO/GEBCO (ocean),
// with Copernicus DEM gap-fill — proper elevation values, NOT shaded relief.
//
// Usage:  node scripts/generateHeightmap.cjs
// Requires: npm install sharp (already a dev dep)

const https = require('https');
const fs = require('fs');
const path = require('path');

const OUTPUT = path.join(__dirname, '..', 'public', 'earthHeightmap.png');
const ZOOM = 5;                                   // 32×32 = 1024 tiles
const TILE_SIZE = 256;
const TILES_PER_SIDE = 1 << ZOOM;                 // 32
const MOSAIC_SIZE = TILES_PER_SIDE * TILE_SIZE;    // 8192
const TARGET_WIDTH = 4096;
const TARGET_HEIGHT = 2048;
const CONCURRENT = 30;
const BASE_URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium';

// Elevation lookup — tiles stored as Float32Array keyed by "x_y"
const tileData = new Map();

// --- HTTP fetch ---

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'hoverchart-heightmap/2.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBuffer(res.headers.location).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// --- Decode Terrarium tile PNG → Float32 elevation array ---

async function decodeTile(buffer) {
  const sharp = require('sharp');
  const { data, info } = await sharp(buffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = info.width * info.height;
  const elevations = new Float32Array(pixels);
  const ch = info.channels;
  for (let i = 0; i < pixels; i++) {
    const r = data[i * ch];
    const g = data[i * ch + 1];
    const b = data[i * ch + 2];
    elevations[i] = (r * 256 + g + b / 256) - 32768;
  }
  return elevations;
}

// --- Download all tiles with concurrency ---

async function downloadTiles() {
  const total = TILES_PER_SIDE * TILES_PER_SIDE;
  let completed = 0;
  let failed = 0;

  const queue = [];
  for (let y = 0; y < TILES_PER_SIDE; y++) {
    for (let x = 0; x < TILES_PER_SIDE; x++) {
      queue.push({ x, y });
    }
  }

  async function worker() {
    while (queue.length > 0) {
      const { x, y } = queue.shift();
      try {
        const buf = await fetchBuffer(`${BASE_URL}/${ZOOM}/${x}/${y}.png`);
        const elevations = await decodeTile(buf);
        tileData.set(`${x}_${y}`, elevations);
      } catch {
        failed++;
      }
      completed++;
      if (completed % 50 === 0 || completed === total) {
        process.stdout.write(`\r  Tiles: ${completed}/${total} (${failed} missing)`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENT }, () => worker()));
  console.log();
  return { completed, failed };
}

// --- Mercator ↔ lat/lon ---

const DEG2RAD = Math.PI / 180;

function latLonToMercatorPixel(lat, lon) {
  const mx = (lon + 180) / 360 * MOSAIC_SIZE;
  const latRad = lat * DEG2RAD;
  const my = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * MOSAIC_SIZE;
  return [mx, my];
}

function sampleElevation(mx, my) {
  const tx = Math.floor(mx / TILE_SIZE);
  const ty = Math.floor(my / TILE_SIZE);
  if (tx < 0 || tx >= TILES_PER_SIDE || ty < 0 || ty >= TILES_PER_SIDE) return 0;

  const tile = tileData.get(`${tx}_${ty}`);
  if (!tile) return 0;

  // Bilinear interpolation within tile
  const lx = mx - tx * TILE_SIZE;
  const ly = my - ty * TILE_SIZE;
  const x0 = Math.min(Math.floor(lx), TILE_SIZE - 1);
  const y0 = Math.min(Math.floor(ly), TILE_SIZE - 1);
  const x1 = Math.min(x0 + 1, TILE_SIZE - 1);
  const y1 = Math.min(y0 + 1, TILE_SIZE - 1);
  const fx = lx - x0;
  const fy = ly - y0;

  const v00 = tile[y0 * TILE_SIZE + x0];
  const v10 = tile[y0 * TILE_SIZE + x1];
  const v01 = tile[y1 * TILE_SIZE + x0];
  const v11 = tile[y1 * TILE_SIZE + x1];
  return v00 * (1 - fx) * (1 - fy) + v10 * fx * (1 - fy) +
         v01 * (1 - fx) * fy + v11 * fx * fy;
}

// --- Generate equirectangular heightmap ---

async function generateHeightmap() {
  const sharp = require('sharp');
  console.log('  Resampling Mercator → equirectangular…');

  const output = Buffer.alloc(TARGET_WIDTH * TARGET_HEIGHT);

  // Elevation encoding: sea level = pixel 20, ocean 0-20, land 20-255
  const MAX_DEPTH = -8000;   // deepest ocean mapped to pixel 0
  const MAX_HEIGHT = 8848;   // Everest mapped to pixel 255
  const SEA_PIXEL = 20;      // sea level pixel value

  for (let oy = 0; oy < TARGET_HEIGHT; oy++) {
    const lat = 90 - (oy + 0.5) / TARGET_HEIGHT * 180;

    // Mercator stops at ±85.05°
    if (Math.abs(lat) > 85) {
      // Antarctica has ice up to ~2500m; Arctic is ocean
      const val = lat < -60 ? 100 : 0;
      for (let ox = 0; ox < TARGET_WIDTH; ox++) {
        output[oy * TARGET_WIDTH + ox] = val;
      }
      continue;
    }

    for (let ox = 0; ox < TARGET_WIDTH; ox++) {
      const lon = -180 + (ox + 0.5) / TARGET_WIDTH * 360;
      const [mx, my] = latLonToMercatorPixel(lat, lon);
      const elev = sampleElevation(mx, my);

      let pixel;
      if (elev <= 0) {
        // Ocean: MAX_DEPTH → 0, sea_level → SEA_PIXEL
        pixel = Math.max(0, Math.round(SEA_PIXEL * (1 + elev / Math.abs(MAX_DEPTH))));
      } else {
        // Land: 0m → SEA_PIXEL, MAX_HEIGHT → 255
        pixel = Math.min(255, Math.round(SEA_PIXEL + (elev / MAX_HEIGHT) * (255 - SEA_PIXEL)));
      }
      output[oy * TARGET_WIDTH + ox] = pixel;
    }
  }

  await sharp(output, {
    raw: { width: TARGET_WIDTH, height: TARGET_HEIGHT, channels: 1 },
  })
    .png({ compressionLevel: 9 })
    .toFile(OUTPUT);
}

// --- Main ---

async function main() {
  console.log('Earth Heightmap Generator v2 — Terrarium Elevation Tiles');
  console.log(`Zoom: ${ZOOM} (${TILES_PER_SIDE}×${TILES_PER_SIDE} = ${TILES_PER_SIDE * TILES_PER_SIDE} tiles)`);
  console.log(`Resolution per pixel: ~${Math.round(40075 / MOSAIC_SIZE)}km (at equator)`);
  console.log(`Output: ${TARGET_WIDTH}×${TARGET_HEIGHT}`);
  console.log(`Target: ${OUTPUT}\n`);

  console.log('Downloading elevation tiles from AWS…');
  const { failed } = await downloadTiles();

  if (tileData.size === 0) {
    console.error('\n✘ No tiles downloaded. Check network connection.');
    process.exit(1);
  }

  await generateHeightmap();

  const stat = fs.statSync(OUTPUT);
  console.log(`\n✓ Saved ${OUTPUT}`);
  console.log(`  Size: ${(stat.size / 1024).toFixed(0)} KB`);
  console.log(`  Tiles used: ${tileData.size} (${failed} ocean/missing)`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
