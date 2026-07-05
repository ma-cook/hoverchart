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

function normalize(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const map = { cellId: 'cell_id', cellX: 'cell_x', cellY: 'cell_y', cellZ: 'cell_z', spaceId: 'space_id', ownerId: 'owner_id', displayName: 'display_name', photoUrl: 'photo_url', lastUpdated: 'last_updated', updatedAt: 'updated_at', headerText: 'header_text', isPublic: 'is_public', sharedWith: 'shared_with' };
  for (const [camel, snake] of Object.entries(map)) {
    if (obj[camel] !== undefined && obj[snake] === undefined) {
      obj[snake] = obj[camel];
    }
  }
  // Derive cell_x/y/z from cell_id if not provided
  if (obj.cell_id && (obj.cell_x === undefined || obj.cell_y === undefined || obj.cell_z === undefined)) {
    const parts = obj.cell_id.split(',').map(Number);
    if (parts.length >= 3 && parts.every(n => !isNaN(n))) {
      if (obj.cell_x === undefined) obj.cell_x = parts[0];
      if (obj.cell_y === undefined) obj.cell_y = parts[1];
      if (obj.cell_z === undefined) obj.cell_z = parts[2];
    }
  }
  return obj;
}

router.get('/', async (req, res) => {
  const { spaceId } = req.params;
  const { cell, cell_id, cellId, x, y, z } = req.query;
  const effectiveCellId = cell_id || cellId;
  try {
    let query, params;
    if (effectiveCellId) {
      query = `SELECT * FROM objects WHERE space_id = $1 AND cell_id = $2 ORDER BY updated_at DESC`;
      params = [spaceId, effectiveCellId];
    } else if (x !== undefined && y !== undefined && z !== undefined) {
      query = `SELECT * FROM objects WHERE space_id = $1 AND cell_x = $2 AND cell_y = $3 AND cell_z = $4 ORDER BY updated_at DESC`;
      params = [spaceId, +x, +y, +z];
    } else if (cell) {
      const [cx, cy, cz] = cell.split(',').map(Number);
      query = `SELECT * FROM objects WHERE space_id = $1 AND cell_x = $2 AND cell_y = $3 AND cell_z = $4 ORDER BY updated_at DESC`;
      params = [spaceId, cx, cy, cz];
    } else {
      query = `SELECT * FROM objects WHERE space_id = $1 ORDER BY updated_at DESC LIMIT 500`;
      params = [spaceId];
    }
    const result = await pool.query(query, params);
    res.json(toCamel(result.rows));
  } catch (err) {
    console.error('List objects error:', err);
    res.status(500).json({ error: 'Failed to list objects' });
  }
});

router.post('/', async (req, res) => {
  const { spaceId } = req.params;
  const obj = normalize(req.body);
  if (!obj.id || !obj.cell_id || !obj.type) return res.status(400).json({ error: 'id, cell_id, and type are required' });
  try {
    const result = await pool.query(
      `INSERT INTO objects (id, space_id, cell_id, cell_x, cell_y, cell_z, position, scale, rotation, type, color, content, header_text, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (space_id, cell_id, id)
       DO UPDATE SET
         position = COALESCE($7, objects.position),
         scale = COALESCE($8, objects.scale),
         rotation = COALESCE($9, objects.rotation),
         type = COALESCE($10, objects.type),
         color = COALESCE($11, objects.color),
         content = COALESCE($12, objects.content),
         header_text = COALESCE($13, objects.header_text),
         metadata = COALESCE($14, objects.metadata),
         updated_at = NOW()
       RETURNING *`,
      [obj.id, spaceId, obj.cell_id, obj.cell_x, obj.cell_y, obj.cell_z,
       obj.position || [0, 0, 0], obj.scale || [1, 1, 1], obj.rotation || [0, 0, 0],
       obj.type, obj.color, obj.content, obj.header_text, obj.metadata || {}]
    );
    res.status(201).json(toCamel(result.rows[0]));
  } catch (err) {
    console.error('Upsert object error:', err);
    res.status(500).json({ error: 'Failed to upsert object' });
  }
});

router.patch('/:id', async (req, res) => {
  const { spaceId, id } = req.params;
  const updates = normalize(req.body);
  const fields = [];
  const values = [];
  let idx = 1;
  for (const key of ['position', 'scale', 'rotation', 'type', 'color', 'content', 'header_text', 'metadata', 'cell_id', 'cell_x', 'cell_y', 'cell_z']) {
    if (updates[key] !== undefined) {
      fields.push(`${key} = $${idx++}`);
      values.push(updates[key]);
    }
  }
  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
  fields.push(`updated_at = NOW()`);
  values.push(spaceId, id);
  try {
    const result = await pool.query(
      `UPDATE objects SET ${fields.join(', ')} WHERE space_id = $${idx++} AND id = $${idx} RETURNING *`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Object not found' });
    res.json(toCamel(result.rows[0]));
  } catch (err) {
    console.error('Update object error:', err);
    res.status(500).json({ error: 'Failed to update object' });
  }
});

router.delete('/:id', async (req, res) => {
  const { spaceId, id } = req.params;
  const { cell_id, cellId } = req.query;
  if (!cell_id && !cellId) return res.status(400).json({ error: 'cell_id query param required' });
  try {
    await pool.query(
      `DELETE FROM objects WHERE space_id = $1 AND cell_id = $2 AND id = $3`,
      [spaceId, cell_id || cellId, id]
    );
    res.json({ deleted: true });
  } catch (err) {
    console.error('Delete object error:', err);
    res.status(500).json({ error: 'Failed to delete object' });
  }
});
