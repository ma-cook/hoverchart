import { getGroupColor, DESIRED_GAP } from './markdownDiagram/constants.js';
import { getCellCoordinates } from './spatialPartitioning.js';
import { saveObjectToCell } from './spatialObjectsService.js';

// ── CSV Parsing ──────────────────────────────────────────────────────────────

/**
 * Parse a CSV string into an array of row objects keyed by header names.
 * Handles quoted fields containing commas and newlines.
 */
function parseCsv(text) {
  // Strip BOM (Byte Order Mark) if present
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

  const rows = [];
  let current = '';
  let inQuotes = false;
  const lines = [];

  // Split into lines respecting quoted newlines
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if (ch === '\n' && !inQuotes) {
      lines.push(current.replace(/\r$/, ''));
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) lines.push(current.replace(/\r$/, ''));

  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = splitCsvLine(lines[0]);

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = splitCsvLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] ?? '').trim();
    });
    rows.push(row);
  }

  return { headers, rows };
}

/** Split a single CSV line by commas, respecting quoted fields. */
function splitCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// ── Column Detection ─────────────────────────────────────────────────────────

/** Return true if ≥80% of non-empty values in a column parse as numbers. */
function isNumericColumn(rows, header) {
  let total = 0;
  let numeric = 0;
  for (const row of rows) {
    const v = row[header];
    if (v === '' || v == null) continue;
    total++;
    // Strip %, $, commas for number detection
    const cleaned = v.replace(/[%$,]/g, '');
    if (!isNaN(Number(cleaned)) && cleaned !== '') numeric++;
  }
  return total > 0 && numeric / total >= 0.8;
}

/** Parse a cell value as a number, stripping common formatting. */
function parseNumeric(value) {
  if (value == null || value === '') return NaN;
  const cleaned = String(value).replace(/[%$,]/g, '');
  return Number(cleaned);
}

/**
 * Auto-detect column roles from CSV data.
 * Returns { groupColumn, labelColumn, numericColumn } or throws if no numeric data.
 */
function detectColumns(headers, rows) {
  const numericHeaders = headers.filter((h) => isNumericColumn(rows, h));
  const stringHeaders = headers.filter((h) => !numericHeaders.includes(h));

  if (numericHeaders.length === 0) {
    throw new Error('CSV contains no numeric columns. At least one numeric column is required for sizing.');
  }

  // Pick the numeric column with the largest range
  let numericColumn = numericHeaders[0];
  let bestRange = 0;
  for (const h of numericHeaders) {
    const values = rows.map((r) => parseNumeric(r[h])).filter((v) => !isNaN(v));
    const range = Math.max(...values) - Math.min(...values);
    if (range > bestRange) {
      bestRange = range;
      numericColumn = h;
    }
  }

  // Grouping & label column detection
  let groupColumn = null;
  let labelColumn = null;

  // Header name patterns that hint at column roles
  const GROUPING_NAMES = /description|category|type|group|class|kind|segment|band|tier|bucket/i;
  const CODE_NAMES = /code|id|key|identifier|index|hash|line_code/i;
  const LABEL_NAMES = /name|label|title|industry|sector|product|item|region|country/i;

  if (stringHeaders.length >= 2) {
    // Score each string column for grouping suitability
    let bestGroupScore = -Infinity;
    for (const h of stringHeaders) {
      const unique = new Set(rows.map((r) => r[h])).size;
      if (unique === 0) continue;
      // Skip all-unique columns (IDs) for grouping
      if (unique >= rows.length * 0.9) continue;

      // Base score: prefer fewer unique values (categorical)
      let score = -unique;

      // Boost descriptive column names
      if (GROUPING_NAMES.test(h)) score += 1000;
      // Penalize code-like column names
      if (CODE_NAMES.test(h)) score -= 1000;

      if (score > bestGroupScore) {
        bestGroupScore = score;
        groupColumn = h;
      }
    }

    // Label column: prefer the string column with MOST unique values (most descriptive per-row)
    // Also boost columns with label-like header names
    let bestLabelScore = -Infinity;
    for (const h of stringHeaders) {
      if (h === groupColumn) continue;
      const unique = new Set(rows.map((r) => r[h])).size;
      let score = unique;
      if (LABEL_NAMES.test(h)) score += 1000;
      if (CODE_NAMES.test(h)) score -= 1000;
      if (score > bestLabelScore) {
        bestLabelScore = score;
        labelColumn = h;
      }
    }
    labelColumn = labelColumn || groupColumn;
  } else if (stringHeaders.length === 1) {
    // Single string column serves as both label and group
    const unique = new Set(rows.map((r) => r[stringHeaders[0]])).size;
    // Only treat as grouping if it has fewer unique values than total rows
    if (unique < rows.length * 0.7) {
      groupColumn = stringHeaders[0];
      labelColumn = stringHeaders[0];
    } else {
      labelColumn = stringHeaders[0];
    }
  }

  return { groupColumn, labelColumn, numericColumn };
}

/**
 * Filter out aggregate/summary rows where the label column is a generic
 * aggregate term like "total", "all", "overall". Only checks the label column
 * because "total" in other columns (e.g. size="total") may be a meaningful
 * categorical value rather than an aggregate marker.
 */
function filterAggregateRows(rows, labelColumn) {
  if (!labelColumn) return rows;

  const AGGREGATE_VALUES = /^(total|all|overall|grand total|subtotal|sub-total|average|mean|median)$/i;

  const filtered = rows.filter((row) => {
    const val = (row[labelColumn] || '').trim();
    return !AGGREGATE_VALUES.test(val);
  });

  // Only apply filtering if it doesn't remove everything
  return filtered.length > 0 ? filtered : rows;
}

// ── Data Structuring ─────────────────────────────────────────────────────────

const MIN_SCALE = 0.5;
const MAX_SCALE = 4.0;
const CONTAINER_PADDING = 15;
const MAX_COLUMNS = 5;

/**
 * Group & normalize CSV rows.
 * Returns Map<groupName, { rows: [{ label, rawValue, displayValue, scale }] }>
 */
function buildGroups(rows, groupColumn, labelColumn, numericColumn) {
  const groups = new Map();

  // Collect all numeric values for global normalization
  const allValues = rows.map((r) => parseNumeric(r[numericColumn])).filter((v) => !isNaN(v));
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = maxVal - minVal || 1; // avoid division by zero

  for (const row of rows) {
    const value = parseNumeric(row[numericColumn]);
    if (isNaN(value)) continue;

    const groupName = groupColumn ? (row[groupColumn] || 'Other') : 'All Data';
    const label = labelColumn ? (row[labelColumn] || '') : `${numericColumn}: ${row[numericColumn]}`;

    // Format display value — keep original string for % and $ formatting
    const rawStr = row[numericColumn];
    const displayValue = rawStr.includes('%') || rawStr.includes('$') ? rawStr : String(value);

    // Normalize to scale range
    const t = (value - minVal) / range;
    const scale = MIN_SCALE + t * (MAX_SCALE - MIN_SCALE);

    if (!groups.has(groupName)) groups.set(groupName, { rows: [] });
    groups.get(groupName).rows.push({ label, rawValue: value, displayValue, scale });
  }

  // Sort each group by scale ascending (smallest first → front)
  for (const group of groups.values()) {
    group.rows.sort((a, b) => a.scale - b.scale);
  }

  return groups;
}

// ── Layout ───────────────────────────────────────────────────────────────────

/**
 * Compute positions for all cubes in a group, arranged in a grid.
 * Smallest cubes at front (low Z), largest at back (high Z).
 * Returns array of { ...rowData, position: [x, y, z] } with positions relative to group origin.
 */
function layoutGroup(groupRows) {
  const positioned = [];
  const cols = Math.min(MAX_COLUMNS, groupRows.length);

  for (let i = 0; i < groupRows.length; i++) {
    const row = groupRows[i];
    const col = i % cols;
    const depth = Math.floor(i / cols);

    // Cube half-size in world units = scale * 10 / 2 = scale * 5
    const halfSize = row.scale * 5;

    // X: spread left-to-right, centered on 0
    const xSpacing = (MAX_SCALE * 10) + DESIRED_GAP;
    const xOffset = (col - (cols - 1) / 2) * xSpacing;

    // Z: depth rows go back (positive Z = further from camera)
    const zSpacing = (MAX_SCALE * 10) + DESIRED_GAP;
    const zOffset = depth * zSpacing;

    // Y: center cubes vertically so their bottoms align
    const yOffset = halfSize;

    positioned.push({ ...row, position: [xOffset, yOffset, zOffset] });
  }

  return positioned;
}

/**
 * Compute bounding box for a set of positioned cubes.
 * Returns { min: [x,y,z], max: [x,y,z], center: [x,y,z], size: [w,h,d] }
 */
function computeBounds(positionedRows) {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (const row of positionedRows) {
    const [x, y, z] = row.position;
    const halfSize = row.scale * 5;
    minX = Math.min(minX, x - halfSize);
    minY = Math.min(minY, y - halfSize);
    minZ = Math.min(minZ, z - halfSize);
    maxX = Math.max(maxX, x + halfSize);
    maxY = Math.max(maxY, y + halfSize);
    maxZ = Math.max(maxZ, z + halfSize);
  }

  return {
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
    center: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2],
    size: [maxX - minX, maxY - minY, maxZ - minZ],
  };
}

/** Get the camera position for placing objects in front of the user. */
function getCameraBasePosition() {
  try {
    const camera = window.orbitControls?.object;
    if (camera) {
      const pos = camera.position;
      const dir = { x: 0, y: 0, z: -1 };
      // Apply camera rotation to direction
      const q = camera.quaternion;
      // Simple quaternion rotation of (0,0,-1)
      const ix = q.w * dir.x + q.y * dir.z - q.z * dir.y;
      const iy = q.w * dir.y + q.z * dir.x - q.x * dir.z;
      const iz = q.w * dir.z + q.x * dir.y - q.y * dir.x;
      const iw = -q.x * dir.x - q.y * dir.y - q.z * dir.z;
      const rx = ix * q.w + iw * -q.x + iy * -q.z - iz * -q.y;
      const ry = iy * q.w + iw * -q.y + iz * -q.x - ix * -q.z;
      const rz = iz * q.w + iw * -q.z + ix * -q.y - iy * -q.x;
      const distance = 150;
      return [pos.x + rx * distance, pos.y + ry * distance, pos.z + rz * distance];
    }
  } catch {
    // fall through
  }
  return [0, 0, 0];
}

// ── Main Entry Point ─────────────────────────────────────────────────────────

/**
 * Process a CSV file and create a 3D diagram with sized cubes in group containers.
 *
 * @param {File} file - The CSV file to process
 * @param {Function} onCreateObject - Callback to create a 3D object (type, position, extraData)
 * @param {string} currentSpaceId - Current space ID for persistence
 * @param {object} user - Firebase user object (null in trial mode)
 * @returns {{ success: boolean, objectsCreated: number, groupCount: number }}
 */
export async function processCsvFile(file, onCreateObject, currentSpaceId, user) {
  // 1. Read & parse CSV
  const text = await file.text();
  const { headers, rows } = parseCsv(text);

  if (rows.length === 0) {
    throw new Error('CSV file is empty or has no data rows.');
  }

  // 2. Detect columns
  const { groupColumn, labelColumn, numericColumn } = detectColumns(headers, rows);

  // 2.5 Filter out aggregate/summary rows where label is "total" etc.
  const filteredRows = filterAggregateRows(rows, labelColumn);

  // 3. Build groups & normalize
  const groups = buildGroups(filteredRows, groupColumn, labelColumn, numericColumn);

  if (groups.size === 0) {
    throw new Error('No valid data groups found in CSV.');
  }

  // 4. Layout each group and position groups side-by-side
  const basePosition = getCameraBasePosition();
  const groupEntries = Array.from(groups.entries());
  const groupLayouts = []; // { name, color, positionedRows, bounds, worldOffset }

  // First pass: layout each group locally and compute bounds
  for (let gi = 0; gi < groupEntries.length; gi++) {
    const [name, group] = groupEntries[gi];
    const positionedRows = layoutGroup(group.rows);
    const bounds = computeBounds(positionedRows);
    groupLayouts.push({
      name,
      color: getGroupColor(gi),
      positionedRows,
      bounds,
      worldOffset: [0, 0, 0],
    });
  }

  // Second pass: position groups horizontally (along X) with gaps
  let xCursor = 0;
  for (const gl of groupLayouts) {
    const groupWidth = gl.bounds.size[0] + CONTAINER_PADDING * 2;
    // Shift so group center aligns at xCursor + half-width
    const shiftX = xCursor + groupWidth / 2 - gl.bounds.center[0];
    gl.worldOffset = [
      basePosition[0] + shiftX,
      basePosition[1] - gl.bounds.center[1],
      basePosition[2] - gl.bounds.center[2],
    ];
    xCursor += groupWidth + DESIRED_GAP * 3;
  }

  // 5. Create objects
  let objectsCreated = 0;
  const allObjectsToSave = [];

  for (const gl of groupLayouts) {
    const [offX, offY, offZ] = gl.worldOffset;

    // Create data cubes
    for (const row of gl.positionedRows) {
      const worldPos = [
        row.position[0] + offX,
        row.position[1] + offY,
        row.position[2] + offZ,
      ];

      const objectId = onCreateObject('cube', worldPos, {
        scale: [row.scale, row.scale, row.scale],
        headerText: row.label,
        color: gl.color,
        faceTexts: {
          front: row.displayValue,
          back: '',
          top: '',
          bottom: '',
          right: '',
          left: '',
        },
        textStyle: { fontSize: 1.5, color: 'black', underline: false },
      });

      if (objectId) {
        objectsCreated++;

        // Collect for Firebase save
        if (!window.isTrialMode && user?.uid && currentSpaceId) {
          const cellCoords = getCellCoordinates({ x: worldPos[0], y: worldPos[1], z: worldPos[2] });
          const cellId = `${cellCoords.x},${cellCoords.y},${cellCoords.z}`;
          allObjectsToSave.push({
            id: objectId,
            type: 'cube',
            position: worldPos,
            scale: [row.scale, row.scale, row.scale],
            color: gl.color,
            headerText: row.label,
            cellId,
          });
        }
      }
    }

    // Create container cube for this group
    const containerBounds = computeBounds(
      gl.positionedRows.map((r) => ({
        ...r,
        position: [r.position[0] + offX, r.position[1] + offY, r.position[2] + offZ],
      }))
    );
    const cCenter = containerBounds.center;
    const cSize = containerBounds.size;

    // Container scale: size in world units / base cube size (10)
    const containerScale = [
      (cSize[0] + CONTAINER_PADDING * 2) / 10,
      (cSize[1] + CONTAINER_PADDING * 2) / 10,
      (cSize[2] + CONTAINER_PADDING * 2) / 10,
    ];

    const containerId = onCreateObject('cube', cCenter, {
      scale: containerScale,
      color: gl.color,
      headerText: gl.name,
      lineWidth: 2,
      merfolkData: {
        isContainer: true,
        nonInteractive: true,
        groupType: 'csv-group',
        groupLabel: gl.name,
        nodeCount: gl.positionedRows.length,
      },
      faceTexts: { front: '', back: '', top: '', bottom: '', right: '', left: '' },
      textStyle: { fontSize: 1.0, color: 'black', underline: false },
    });

    if (containerId) {
      objectsCreated++;
    }
  }

  return {
    success: objectsCreated > 0,
    objectsCreated,
    groupCount: groups.size,
    numericColumn,
    groupColumn: groupColumn || '(none)',
  };
}
