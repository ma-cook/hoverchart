// Earth terrain generator for the globe wireframe.
// Supports two modes:
// 1. Heightmap mode: uses loaded image data for accurate elevation
// 2. Fallback mode: gaussian continental model with mountain features

// --- Heightmap data (set externally via loadEarthHeightmap) ---
let heightmapData = null;

export function setHeightmapData(data) {
  heightmapData = data;
}

// --- Continental gaussian blobs ---
// Each entry: [centerLat, centerLon, sigmaLat, sigmaLon, weight]

const LAND_BLOBS = [
  // Africa
  [15, 18, 16, 13, 0.9],
  [-5, 25, 16, 10, 0.8],
  [8, 46, 5, 4, 0.35],
  [32, 3, 5, 7, 0.45],
  [-20, 47, 5, 2, 0.35],
  // Europe
  [50, 12, 10, 13, 0.6],
  [63, 14, 6, 6, 0.45],
  [40, -4, 4, 4, 0.45],
  [42, 13, 5, 2, 0.35],
  [39, 24, 3, 5, 0.35],
  [54, -2, 4, 3, 0.35],
  [65, -18, 2, 3, 0.25],
  // Asia
  [60, 90, 12, 30, 0.75],
  [42, 65, 12, 18, 0.7],
  [35, 108, 13, 14, 0.7],
  [22, 78, 10, 7, 0.65],
  [16, 103, 8, 6, 0.45],
  [24, 45, 8, 7, 0.55],
  [37, 127, 4, 2, 0.25],
  [37, 138, 7, 2, 0.25],
  [57, 160, 5, 3, 0.25],
  [8, 81, 2, 1.5, 0.2],
  [13, 122, 5, 3, 0.2],
  [54, 73, 8, 8, 0.4],
  // North America
  [55, -100, 13, 23, 0.8],
  [38, -82, 8, 8, 0.65],
  [40, -112, 10, 8, 0.6],
  [23, -102, 6, 5, 0.4],
  [14, -85, 3, 5, 0.25],
  [64, -153, 5, 10, 0.45],
  [27, -81, 3, 1.5, 0.2],
  [22, -79, 1.5, 3, 0.15],
  // South America
  [3, -65, 7, 10, 0.65],
  [-10, -52, 12, 13, 0.8],
  [-22, -67, 12, 5, 0.5],
  [-38, -65, 7, 5, 0.4],
  [-52, -70, 3, 3, 0.2],
  // Australia & Oceania
  [-25, 134, 10, 15, 0.7],
  [-42, 172, 4, 2, 0.25],
  [-6, 145, 3, 4, 0.25],
  [-2, 118, 3, 12, 0.2],
  [-2, 103, 5, 2, 0.2],
  [-8, 114, 3, 3, 0.15],
  // Greenland & Arctic
  [72, -42, 8, 10, 0.6],
  [78, 20, 3, 10, 0.2],
  // Antarctica
  [-82, 0, 7, 180, 0.6],
];

// --- Mountain range blobs ---
// Each entry: [centerLat, centerLon, sigmaLat, sigmaLon, peakHeight]

const MOUNTAIN_BLOBS = [
  [28, 84, 2, 10, 0.95],   // Himalayas
  [36, 75, 2, 3, 0.8],     // Karakoram
  [33, 88, 5, 12, 0.55],   // Tibetan Plateau
  [35, 69, 3, 4, 0.6],     // Hindu Kush
  [42, 78, 3, 7, 0.4],     // Tien Shan
  [49, 88, 3, 5, 0.3],     // Altai
  [-5, -77, 8, 2, 0.6],    // Northern Andes
  [-20, -68, 10, 2, 0.65], // Central Andes
  [-35, -70, 8, 2, 0.5],   // Southern Andes
  [45, -115, 12, 3, 0.45], // Rockies (north)
  [37, -109, 5, 3, 0.35],  // Rockies (south)
  [46.5, 10, 2, 5, 0.45],  // Alps
  [42, 44, 2, 5, 0.4],     // Caucasus
  [-2, 36, 5, 3, 0.5],     // East African Highlands
  [9, 39, 4, 3, 0.4],      // Ethiopian Highlands
  [33, 0, 3, 6, 0.3],      // Atlas Mountains
  [55, 59, 10, 1.5, 0.2],  // Urals
  [63, 14, 7, 2, 0.2],     // Scandinavian Mountains
  [37, -80, 7, 2, 0.15],   // Appalachians
  [-27, 149, 10, 2, 0.15], // Great Dividing Range
  [-30, 29, 4, 2, 0.2],    // Drakensberg
  [-82, 165, 5, 25, 0.3],  // Transantarctic
  [36, 137, 2, 1, 0.25],   // Japan Alps
];

// Precompute inverse variance terms for each blob to avoid division in hot loop
const LAND_PRECOMP = LAND_BLOBS.map(([cLat, cLon, sLat, sLon, w]) => ({
  cLat, cLon, invLat: 1 / (2 * sLat * sLat), invLon: 1 / (2 * sLon * sLon), w,
}));
const MTN_PRECOMP = MOUNTAIN_BLOBS.map(([cLat, cLon, sLat, sLon, h]) => ({
  cLat, cLon, invLat: 1 / (2 * sLat * sLat), invLon: 1 / (2 * sLon * sLon), h,
}));

const LAND_THRESHOLD = 0.35;
const SIGMOID_SHARPNESS = 15;

// --- Elevation from heightmap ---

// After processing, the heightmap encodes elevation as:
//   Pixel 0-20:  ocean depths (-8000m to 0m)
//   Pixel 20:    sea level (0m)
//   Pixel 20-255: land elevation (0m to ~8848m)
const SEA_LEVEL_PIXEL = 20;

function samplePixel(px, py) {
  const { data, width } = heightmapData;
  const idx = (py * width + px) * 4;
  return data[idx]; // red channel
}

// Convert a single pixel value to normalized elevation
function pixelToElevation(val) {
  if (val <= SEA_LEVEL_PIXEL) {
    // Ocean: 0..SEA_LEVEL_PIXEL → -0.3..0  (shallow visual depth to avoid cliffs at coastlines)
    return -0.3 * (1 - val / SEA_LEVEL_PIXEL);
  }
  // Land: SEA_LEVEL_PIXEL..255 → 0..1
  return (val - SEA_LEVEL_PIXEL) / (255 - SEA_LEVEL_PIXEL);
}

function getElevationFromHeightmap(lat, lon) {
  const { width, height } = heightmapData;
  const fx = ((lon + 180) / 360) * width;
  const fy = ((90 - lat) / 180) * height;

  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = (x0 + 1) % width;
  const y1 = Math.min(y0 + 1, height - 1);
  const dx = fx - x0;
  const dy = fy - y0;
  const px0 = x0 % width;
  const py0 = Math.min(y0, height - 1);

  // Use the NEAREST pixel to classify as land or ocean.
  // This preserves narrow straits (Torres Strait, Cook Strait, English Channel)
  // that would be filled in by majority-rules averaging.
  const nearX = dx < 0.5 ? px0 : x1;
  const nearY = dy < 0.5 ? py0 : y1;
  const nearVal = samplePixel(nearX, nearY);
  const isLand = nearVal > SEA_LEVEL_PIXEL;

  // Sample all 4 pixels
  const p00 = samplePixel(px0, py0);
  const p10 = samplePixel(x1, py0);
  const p01 = samplePixel(px0, y1);
  const p11 = samplePixel(x1, y1);

  if (isLand) {
    // Point is on land — interpolate land pixels, clamp ocean neighbors to sea level
    const v00 = p00 > SEA_LEVEL_PIXEL ? pixelToElevation(p00) : 0;
    const v10 = p10 > SEA_LEVEL_PIXEL ? pixelToElevation(p10) : 0;
    const v01 = p01 > SEA_LEVEL_PIXEL ? pixelToElevation(p01) : 0;
    const v11 = p11 > SEA_LEVEL_PIXEL ? pixelToElevation(p11) : 0;
    return v00 * (1 - dx) * (1 - dy) + v10 * dx * (1 - dy) +
           v01 * (1 - dx) * dy + v11 * dx * dy;
  }

  // Point is in ocean — interpolate ocean pixels, clamp land neighbors to sea level
  const v00 = p00 <= SEA_LEVEL_PIXEL ? pixelToElevation(p00) : 0;
  const v10 = p10 <= SEA_LEVEL_PIXEL ? pixelToElevation(p10) : 0;
  const v01 = p01 <= SEA_LEVEL_PIXEL ? pixelToElevation(p01) : 0;
  const v11 = p11 <= SEA_LEVEL_PIXEL ? pixelToElevation(p11) : 0;
  return v00 * (1 - dx) * (1 - dy) + v10 * dx * (1 - dy) +
         v01 * (1 - dx) * dy + v11 * dx * dy;
}

// --- Elevation from continental model ---

function getElevationFromModel(lat, lon) {
  // Sum gaussian blobs for land detection
  let landScore = 0;
  for (let i = 0; i < LAND_PRECOMP.length; i++) {
    const b = LAND_PRECOMP[i];
    const dLat = lat - b.cLat;
    let dLon = lon - b.cLon;
    if (dLon > 180) dLon -= 360;
    else if (dLon < -180) dLon += 360;
    landScore += b.w * Math.exp(-dLat * dLat * b.invLat - dLon * dLon * b.invLon);
  }

  // Sharpen land/ocean boundary with sigmoid
  const landness = 1 / (1 + Math.exp(-(landScore - LAND_THRESHOLD) * SIGMOID_SHARPNESS));

  if (landness < 0.1) {
    // Ocean — depth proportional to distance from coast
    const depth = LAND_THRESHOLD - landScore;
    return -0.1 - Math.min(depth * 0.8, 0.6);
  }

  // Land — base elevation proportional to how far inland
  let elev = 0.03 + landness * 0.08;

  // Add mountain contributions (scaled by landness to prevent mountains in ocean)
  for (let i = 0; i < MTN_PRECOMP.length; i++) {
    const m = MTN_PRECOMP[i];
    const dLat = lat - m.cLat;
    let dLon = lon - m.cLon;
    if (dLon > 180) dLon -= 360;
    else if (dLon < -180) dLon += 360;
    const g = Math.exp(-dLat * dLat * m.invLat - dLon * dLon * m.invLon);
    elev += g * m.h * landness;
  }

  // Subtle high-frequency variation for texture
  elev += 0.015 * Math.sin(lat * 7.3 + lon * 5.1) * Math.cos(lat * 3.7 - lon * 8.9) * landness;

  return Math.min(1.0, elev);
}

// --- Public elevation function ---

import { getCachedElevation } from './terrainTileCache';

const MAX_HEIGHT_M = 8848;
const MAX_DEPTH_M = 8000;

export function getElevation(lat, lon) {
  // Try runtime tile cache first (returns meters from Terrarium tiles)
  const cachedMeters = getCachedElevation(lat, lon);
  if (cachedMeters !== null) {
    if (cachedMeters <= 0) return Math.max(-0.3, cachedMeters / MAX_DEPTH_M * 0.3);
    return Math.min(1, cachedMeters / MAX_HEIGHT_M);
  }
  // Base heightmap (4096×2048, ~10km/pixel)
  if (heightmapData) return getElevationFromHeightmap(lat, lon);
  // Fallback gaussian model
  return getElevationFromModel(lat, lon);
}

// --- Color schemes ---

const COLOR_SCHEMES = {
  terrain: [
    { max: -0.4, color: '#1a237e' },
    { max:  0.0, color: '#1565c0' },
    { max:  0.25, color: '#2e7d32' },
    { max:  0.5, color: '#f9a825' },
    { max:  0.75, color: '#795548' },
    { max: Infinity, color: '#eceff1' },
  ],
  monochrome: [
    { max: -0.4, color: '#333333' },
    { max:  0.0, color: '#555555' },
    { max:  0.25, color: '#777777' },
    { max:  0.5, color: '#999999' },
    { max:  0.75, color: '#bbbbbb' },
    { max: Infinity, color: '#eeeeee' },
  ],
  ocean: [
    { max: -0.4, color: '#0d47a1' },
    { max: -0.2, color: '#1565c0' },
    { max:  0.0, color: '#42a5f5' },
    { max:  0.25, color: '#a5d6a7' },
    { max:  0.5, color: '#c8e6c9' },
    { max: Infinity, color: '#ffffff' },
  ],
  elevation: [
    { max: -0.4, color: '#4a148c' },
    { max:  0.0, color: '#1a237e' },
    { max:  0.25, color: '#00695c' },
    { max:  0.5, color: '#e65100' },
    { max:  0.75, color: '#bf360c' },
    { max: Infinity, color: '#f44336' },
  ],
};

function getColorForElevation(elevation, schemeName) {
  const scheme = COLOR_SCHEMES[schemeName] || COLOR_SCHEMES.terrain;
  for (const band of scheme) {
    if (elevation < band.max) return band.color;
  }
  return scheme[scheme.length - 1].color;
}

// --- Globe geometry generation ---

const DEG_TO_RAD = Math.PI / 180;

/**
 * Generate the full wireframe globe geometry.
 *
 * Returns an array of { color: string, points: Float32Array } objects.
 * Each Float32Array is a flat list of line-segment pairs:
 *   [x1,y1,z1, x2,y2,z2,  x1,y1,z1, x2,y2,z2, …]
 */
export function generateGlobeGeometry({
  radius = 80,
  exaggeration = 8,
  center = [5000, 5000, 5000],
  latStep = 2,
  lonStep = 2,
  colorScheme = 'terrain',
  showOceanFloor = true,
}) {
  const latCount = Math.floor(180 / latStep) + 1;
  const lonCount = Math.floor(360 / lonStep); // exclude duplicate at ±180
  const [cx, cy, cz] = center;

  // Pre-compute grid positions + elevations
  const positions = new Float32Array(latCount * lonCount * 3);
  const elevations = new Float32Array(latCount * lonCount);

  for (let li = 0; li < latCount; li++) {
    const lat = -90 + li * latStep;
    const latRad = lat * DEG_TO_RAD;
    const cosLat = Math.cos(latRad);
    const sinLat = Math.sin(latRad);

    for (let lo = 0; lo < lonCount; lo++) {
      const lon = -180 + lo * lonStep;
      const elev = getElevation(lat, lon);
      const clampedElev = (!showOceanFloor && elev < 0) ? 0 : elev;
      const r = radius + clampedElev * exaggeration;
      const lonRad = lon * DEG_TO_RAD;

      const idx = li * lonCount + lo;
      positions[idx * 3]     = cx + r * cosLat * Math.cos(lonRad);
      positions[idx * 3 + 1] = cy + r * sinLat;
      positions[idx * 3 + 2] = cz - r * cosLat * Math.sin(lonRad);
      elevations[idx] = clampedElev;
    }
  }

  // Group line segments by colour band
  const colorGroups = new Map();

  function addLine(avgElev, x1, y1, z1, x2, y2, z2) {
    const color = getColorForElevation(avgElev, colorScheme);
    let arr = colorGroups.get(color);
    if (!arr) { arr = []; colorGroups.set(color, arr); }
    arr.push(x1, y1, z1, x2, y2, z2);
  }

  function posAt(idx) {
    return [positions[idx * 3], positions[idx * 3 + 1], positions[idx * 3 + 2]];
  }

  for (let li = 0; li < latCount; li++) {
    const isPole = li === 0 || li === latCount - 1;

    for (let lo = 0; lo < lonCount; lo++) {
      const idx = li * lonCount + lo;
      const [px, py, pz] = posAt(idx);
      const pe = elevations[idx];

      // 1. Latitude contour (horizontal ring) — skip at poles where all points
      //    converge to a single position, creating zero-length lines.
      if (!isPole) {
        const nextLo = (lo + 1) % lonCount;
        const nidx = li * lonCount + nextLo;
        const [nx, ny, nz] = posAt(nidx);
        addLine((pe + elevations[nidx]) / 2, px, py, pz, nx, ny, nz);
      }

      // 2. Meridian line (vertical — connects adjacent contour levels)
      if (li < latCount - 1) {
        const nidx = (li + 1) * lonCount + lo;
        const [nx, ny, nz] = posAt(nidx);
        addLine((pe + elevations[nidx]) / 2, px, py, pz, nx, ny, nz);
      }

      // 3. Diagonal (forms triangles between adjacent contour levels)
      if (li < latCount - 1) {
        const nextLo = (lo + 1) % lonCount;
        const nidx = (li + 1) * lonCount + nextLo;
        const [nx, ny, nz] = posAt(nidx);
        addLine((pe + elevations[nidx]) / 2, px, py, pz, nx, ny, nz);
      }
    }
  }

  // Convert to typed arrays
  const result = [];
  for (const [color, arr] of colorGroups) {
    result.push({ color, points: new Float32Array(arr) });
  }
  return result;
}

// --- Solid surface mesh generation ---

// Pre-parsed RGB values for each color scheme band (cached lazily)
const parsedColorCache = new Map();
function getParsedScheme(schemeName) {
  if (parsedColorCache.has(schemeName)) return parsedColorCache.get(schemeName);
  const scheme = COLOR_SCHEMES[schemeName] || COLOR_SCHEMES.terrain;
  const parsed = scheme.map(({ max, color }) => ({
    max,
    r: parseInt(color.slice(1, 3), 16) / 255,
    g: parseInt(color.slice(3, 5), 16) / 255,
    b: parseInt(color.slice(5, 7), 16) / 255,
  }));
  parsedColorCache.set(schemeName, parsed);
  return parsed;
}

function getColorRGB(elevation, schemeName) {
  const parsed = getParsedScheme(schemeName);
  for (const band of parsed) {
    if (elevation < band.max) return band;
  }
  return parsed[parsed.length - 1];
}

/**
 * Generate a solid triangle mesh for the globe surface.
 *
 * Returns { positions: Float32Array, colors: Float32Array, indices: Uint32Array }
 * suitable for a THREE.BufferGeometry.
 */
export function generateGlobeMesh({
  radius = 80,
  exaggeration = 8,
  center = [5000, 5000, 5000],
  latStep = 2,
  lonStep = 2,
  colorScheme = 'terrain',
  showOceanFloor = true,
  darken = 0.35,
}) {
  const latCount = Math.floor(180 / latStep) + 1;
  const lonCount = Math.floor(360 / lonStep) + 1; // +1 to wrap seam
  const [cx, cy, cz] = center;

  const vertCount = latCount * lonCount;
  const positions = new Float32Array(vertCount * 3);
  const colors = new Float32Array(vertCount * 3);

  for (let li = 0; li < latCount; li++) {
    const lat = -90 + li * latStep;
    const latRad = lat * DEG_TO_RAD;
    const cosLat = Math.cos(latRad);
    const sinLat = Math.sin(latRad);

    for (let lo = 0; lo < lonCount; lo++) {
      const lon = -180 + Math.min(lo * lonStep, 360); // clamp wrap
      const elev = getElevation(lat, lon >= 180 ? -180 : lon);
      const clampedElev = (!showOceanFloor && elev < 0) ? 0 : elev;
      const r = radius + clampedElev * exaggeration;
      const lonRad = lon * DEG_TO_RAD;

      const idx = li * lonCount + lo;
      positions[idx * 3]     = cx + r * cosLat * Math.cos(lonRad);
      positions[idx * 3 + 1] = cy + r * sinLat;
      positions[idx * 3 + 2] = cz - r * cosLat * Math.sin(lonRad);

      // Darkened elevation colour so wireframe lines stand out on top
      const c = getColorRGB(clampedElev, colorScheme);
      colors[idx * 3]     = c.r * darken;
      colors[idx * 3 + 1] = c.g * darken;
      colors[idx * 3 + 2] = c.b * darken;
    }
  }

  // Build triangle indices — two triangles per grid quad
  const quadRows = latCount - 1;
  const quadCols = lonCount - 1;
  const indices = new Uint32Array(quadRows * quadCols * 6);
  let ii = 0;

  for (let li = 0; li < quadRows; li++) {
    for (let lo = 0; lo < quadCols; lo++) {
      const tl = li * lonCount + lo;
      const tr = tl + 1;
      const bl = (li + 1) * lonCount + lo;
      const br = bl + 1;
      // Two triangles per quad
      indices[ii++] = tl;
      indices[ii++] = bl;
      indices[ii++] = tr;
      indices[ii++] = tr;
      indices[ii++] = bl;
      indices[ii++] = br;
    }
  }

  return { positions, colors, indices };
}

// --- Local patch geometry (high-resolution detail for a small area) ---

/**
 * Generate wireframe geometry for a local lat/lon patch.
 * Same output format as `generateGlobeGeometry` but covers only a small area
 * around the specified center, at much finer grid resolution.
 */
export function generateLocalGlobeGeometry({
  radius = 80,
  exaggeration = 8,
  center = [5000, 5000, 5000],
  latStep = 0.1,
  lonStep = 0.1,
  centerLat = 0,
  centerLon = 0,
  patchDeg = 15,
  colorScheme = 'terrain',
  showOceanFloor = true,
}) {
  const minLat = Math.max(-89.5, centerLat - patchDeg);
  const maxLat = Math.min(89.5, centerLat + patchDeg);
  const minLon = centerLon - patchDeg;
  const maxLon = centerLon + patchDeg;

  const latCount = Math.floor((maxLat - minLat) / latStep) + 1;
  const lonCount = Math.floor((maxLon - minLon) / lonStep) + 1;
  const [cx, cy, cz] = center;

  const positions = new Float32Array(latCount * lonCount * 3);
  const elevations = new Float32Array(latCount * lonCount);

  for (let li = 0; li < latCount; li++) {
    const lat = minLat + li * latStep;
    const latRad = lat * DEG_TO_RAD;
    const cosLat = Math.cos(latRad);
    const sinLat = Math.sin(latRad);

    for (let lo = 0; lo < lonCount; lo++) {
      const rawLon = minLon + lo * lonStep;
      // Normalize longitude for elevation lookup
      let normLon = rawLon;
      while (normLon > 180) normLon -= 360;
      while (normLon < -180) normLon += 360;

      const elev = getElevation(lat, normLon);
      const clampedElev = (!showOceanFloor && elev < 0) ? 0 : elev;
      const r = radius + clampedElev * exaggeration;
      const lonRad = rawLon * DEG_TO_RAD;

      const idx = li * lonCount + lo;
      positions[idx * 3]     = cx + r * cosLat * Math.cos(lonRad);
      positions[idx * 3 + 1] = cy + r * sinLat;
      positions[idx * 3 + 2] = cz - r * cosLat * Math.sin(lonRad);
      elevations[idx] = clampedElev;
    }
  }

  const colorGroups = new Map();
  function addLine(avgElev, x1, y1, z1, x2, y2, z2) {
    const color = getColorForElevation(avgElev, colorScheme);
    let arr = colorGroups.get(color);
    if (!arr) { arr = []; colorGroups.set(color, arr); }
    arr.push(x1, y1, z1, x2, y2, z2);
  }
  function posAt(idx) {
    return [positions[idx * 3], positions[idx * 3 + 1], positions[idx * 3 + 2]];
  }

  for (let li = 0; li < latCount; li++) {
    for (let lo = 0; lo < lonCount; lo++) {
      const idx = li * lonCount + lo;
      const [px, py, pz] = posAt(idx);
      const pe = elevations[idx];

      if (lo < lonCount - 1) {
        const nidx = li * lonCount + lo + 1;
        const [nx, ny, nz] = posAt(nidx);
        addLine((pe + elevations[nidx]) / 2, px, py, pz, nx, ny, nz);
      }
      if (li < latCount - 1) {
        const nidx = (li + 1) * lonCount + lo;
        const [nx, ny, nz] = posAt(nidx);
        addLine((pe + elevations[nidx]) / 2, px, py, pz, nx, ny, nz);
      }
      if (li < latCount - 1 && lo < lonCount - 1) {
        const nidx = (li + 1) * lonCount + lo + 1;
        const [nx, ny, nz] = posAt(nidx);
        addLine((pe + elevations[nidx]) / 2, px, py, pz, nx, ny, nz);
      }
    }
  }

  const result = [];
  for (const [color, arr] of colorGroups) {
    result.push({ color, points: new Float32Array(arr) });
  }
  return result;
}

/**
 * Generate a solid triangle mesh for a local lat/lon patch.
 * Same output format as `generateGlobeMesh` but covers only a small area.
 */
export function generateLocalGlobeMesh({
  radius = 80,
  exaggeration = 8,
  center = [5000, 5000, 5000],
  latStep = 0.1,
  lonStep = 0.1,
  centerLat = 0,
  centerLon = 0,
  patchDeg = 15,
  colorScheme = 'terrain',
  showOceanFloor = true,
  darken = 0.35,
}) {
  const minLat = Math.max(-89.5, centerLat - patchDeg);
  const maxLat = Math.min(89.5, centerLat + patchDeg);
  const minLon = centerLon - patchDeg;
  const maxLon = centerLon + patchDeg;

  const latCount = Math.floor((maxLat - minLat) / latStep) + 1;
  const lonCount = Math.floor((maxLon - minLon) / lonStep) + 1;
  const [cx, cy, cz] = center;

  const vertCount = latCount * lonCount;
  const positions = new Float32Array(vertCount * 3);
  const colors = new Float32Array(vertCount * 3);

  for (let li = 0; li < latCount; li++) {
    const lat = minLat + li * latStep;
    const latRad = lat * DEG_TO_RAD;
    const cosLat = Math.cos(latRad);
    const sinLat = Math.sin(latRad);

    for (let lo = 0; lo < lonCount; lo++) {
      const rawLon = minLon + lo * lonStep;
      let normLon = rawLon;
      while (normLon > 180) normLon -= 360;
      while (normLon < -180) normLon += 360;

      const elev = getElevation(lat, normLon);
      const clampedElev = (!showOceanFloor && elev < 0) ? 0 : elev;
      const r = radius + clampedElev * exaggeration;
      const lonRad = rawLon * DEG_TO_RAD;

      const idx = li * lonCount + lo;
      positions[idx * 3]     = cx + r * cosLat * Math.cos(lonRad);
      positions[idx * 3 + 1] = cy + r * sinLat;
      positions[idx * 3 + 2] = cz - r * cosLat * Math.sin(lonRad);

      const c = getColorRGB(clampedElev, colorScheme);
      colors[idx * 3]     = c.r * darken;
      colors[idx * 3 + 1] = c.g * darken;
      colors[idx * 3 + 2] = c.b * darken;
    }
  }

  const quadRows = latCount - 1;
  const quadCols = lonCount - 1;
  const indices = new Uint32Array(quadRows * quadCols * 6);
  let ii = 0;

  for (let li = 0; li < quadRows; li++) {
    for (let lo = 0; lo < quadCols; lo++) {
      const tl = li * lonCount + lo;
      const tr = tl + 1;
      const bl = (li + 1) * lonCount + lo;
      const br = bl + 1;
      indices[ii++] = tl;
      indices[ii++] = bl;
      indices[ii++] = tr;
      indices[ii++] = tr;
      indices[ii++] = bl;
      indices[ii++] = br;
    }
  }

  return { positions, colors, indices };
}
