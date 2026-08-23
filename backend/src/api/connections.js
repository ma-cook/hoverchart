import { Router } from 'express';
import pool from '../db.js';

export const router = Router({ mergeParams: true });

function toCamel(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamel);
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camel] = value && typeof value === 'object' && !(value instanceof Date) ? toCamel(value) : value;
  }
  return result;
}

// The client renders connections from a denormalized shape:
//   { id, cellId, start: { objectId, face, type, ... }, end: { ... }, styleType|lineStyle }
// The database stores the normalized columns (start_obj/end_obj ids +
// start_data/end_data JSON). Denormalize here so API responses match what
// the frontend expects — otherwise ConnectionsRenderer filters every
// DB-loaded connection out (missing start.objectId) and no lines render.
function denormalizeConnection(row) {
  const conn = toCamel(row);
  if (!conn || typeof conn !== 'object') return conn;

  let startData = conn.startData;
  let endData = conn.endData;
  // node-pg returns jsonb as objects, but be defensive about strings
  if (typeof startData === 'string') { try { startData = JSON.parse(startData); } catch { startData = undefined; } }
  if (typeof endData === 'string') { try { endData = JSON.parse(endData); } catch { endData = undefined; } }

  if (conn.start === undefined && startData && typeof startData === 'object') {
    conn.start = toCamel(startData);
  }
  if (conn.end === undefined && endData && typeof endData === 'object') {
    conn.end = toCamel(endData);
  }
  // Degenerate rows may carry only the id columns — synthesize minimal
  // endpoints so client filters (start?.objectId) still pass.
  if (conn.start === undefined && conn.startObj !== undefined) conn.start = {};
  if (conn.end === undefined && conn.endObj !== undefined) conn.end = {};
  // The *_obj id columns are authoritative — backfill objectId if the
  // embedded endpoint data predates it or was saved without it.
  if (conn.start && !conn.start.objectId && conn.startObj !== undefined) {
    conn.start.objectId = String(conn.startObj);
  }
  if (conn.end && !conn.end.objectId && conn.endObj !== undefined) {
    conn.end.objectId = String(conn.endObj);
  }
  return conn;
}

router.get('/', async (req, res) => {
  const { spaceId } = req.params;
  const { cell_id } = req.query;
  try {
    let result;
    if (cell_id) {
      // Support both a single cell and multiple (repeated) cell_id params,
      // e.g. ?cell_id=-1,0,1&cell_id=1,2,3. Cell IDs contain commas, so a
      // comma-joined list would be ambiguous — repeated params avoid that.
      const cellList = (Array.isArray(cell_id) ? cell_id : [cell_id])
        .map((c) => String(c).trim())
        .filter(Boolean);
      if (cellList.length > 0) {
        result = await pool.query(
          `SELECT * FROM connections WHERE space_id = $1 AND cell_id = ANY($2) ORDER BY updated_at DESC`,
          [spaceId, cellList]
        );
      } else {
        result = await pool.query(
          `SELECT * FROM connections WHERE space_id = $1 ORDER BY updated_at DESC LIMIT 500`,
          [spaceId]
        );
      }
    } else {
      result = await pool.query(
        `SELECT * FROM connections WHERE space_id = $1 ORDER BY updated_at DESC LIMIT 500`,
        [spaceId]
      );
    }
    res.json(result.rows.map(denormalizeConnection));
  } catch (err) {
    console.error('List connections error:', err);
    res.status(500).json({ error: 'Failed to list connections' });
  }
});

router.post('/', async (req, res) => {
  const { spaceId } = req.params;
  let conn = req.body;

  // Normalize frontend format (start/end objects) → backend format (start_obj/end_obj + start_data/end_data)
  if (conn.start && typeof conn.start === 'object' && !conn.start_obj) {
    conn.start_obj = conn.start.objectId || conn.start.id;
    conn.start_data = conn.start;
    conn.end_obj = conn.end.objectId || conn.end.id;
    conn.end_data = conn.end;
  }
  if (conn.lineStyle && !conn.line_style) conn.line_style = conn.lineStyle;
  if (conn.cellId && !conn.cell_id) conn.cell_id = conn.cellId;

  if (!conn.id || !conn.cell_id || !conn.start_obj || !conn.end_obj) {
    return res.status(400).json({ error: 'id, cell_id, start_obj, and end_obj are required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO connections (id, space_id, cell_id, start_obj, end_obj, start_data, end_data, line_style, color, text, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (space_id, cell_id, id)
       DO UPDATE SET
         start_obj = COALESCE($4, connections.start_obj),
         end_obj = COALESCE($5, connections.end_obj),
         start_data = COALESCE($6, connections.start_data),
         end_data = COALESCE($7, connections.end_data),
         line_style = COALESCE($8, connections.line_style),
         color = COALESCE($9, connections.color),
         text = COALESCE($10, connections.text),
         metadata = COALESCE($11, connections.metadata),
         updated_at = NOW()
       RETURNING *`,
      [conn.id, spaceId, conn.cell_id, conn.start_obj, conn.end_obj,
       conn.start_data, conn.end_data, conn.line_style || 'straight',
       conn.color || '#000000', conn.text, conn.metadata || {}]
    );
    res.status(201).json(denormalizeConnection(result.rows[0]));
  } catch (err) {
    console.error('Upsert connection error:', err);
    res.status(500).json({ error: 'Failed to upsert connection' });
  }
});

router.patch('/:id', async (req, res) => {
  const { spaceId, id } = req.params;
  let updates = req.body;
  if (updates.lineStyle && !updates.line_style) updates.line_style = updates.lineStyle;
  const fields = [];
  const values = [];
  let idx = 1;
  for (const key of ['start_obj', 'end_obj', 'start_data', 'end_data', 'line_style', 'color', 'text', 'metadata']) {
    if (updates[key] !== undefined) {
      fields.push(`${key} = $${idx++}`);
      values.push(updates[key]);
    }
  }
  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
  fields.push('updated_at = NOW()');
  values.push(spaceId, id);
  try {
    const idx = fields.length === 1 ? values.length - 1 : values.length;
    const { cell_id } = req.query;
    if (!cell_id) return res.status(400).json({ error: 'cell_id query param required' });
    const result = await pool.query(
      `UPDATE connections SET ${fields.join(', ')} WHERE space_id = $${idx + 1} AND cell_id = $${idx + 2} AND id = $${idx + 3} RETURNING *`,
      [...values, spaceId, cell_id, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Connection not found' });
    res.json(denormalizeConnection(result.rows[0]));
  } catch (err) {
    console.error('Update connection error:', err);
    res.status(500).json({ error: 'Failed to update connection' });
  }
});

router.delete('/:id', async (req, res) => {
  const { spaceId, id } = req.params;
  const { cell_id } = req.query;
  if (!cell_id) return res.status(400).json({ error: 'cell_id query param required' });
  try {
    await pool.query(
      `DELETE FROM connections WHERE space_id = $1 AND cell_id = $2 AND id = $3`,
      [spaceId, cell_id, id]
    );
    res.json({ deleted: true });
  } catch (err) {
    console.error('Delete connection error:', err);
    res.status(500).json({ error: 'Failed to delete connection' });
  }
});
