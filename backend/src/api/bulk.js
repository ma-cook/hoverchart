import { Router } from 'express';
import pool from '../db.js';

export const router = Router();

router.post('/import', async (req, res) => {
  const { spaceId, objects, connections } = req.body;
  if (!spaceId) return res.status(400).json({ error: 'spaceId is required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let objCount = 0, connCount = 0;
    if (objects && objects.length > 0) {
      for (const obj of objects) {
        // Normalize frontend format
        if (obj.cellId && !obj.cell_id) obj.cell_id = obj.cellId;
        if (obj.cell_id && (obj.cell_x === undefined || obj.cell_y === undefined || obj.cell_z === undefined)) {
          const parts = obj.cell_id.split(',').map(Number);
          if (parts.length >= 3 && parts.every(n => !isNaN(n))) {
            if (obj.cell_x === undefined) obj.cell_x = parts[0];
            if (obj.cell_y === undefined) obj.cell_y = parts[1];
            if (obj.cell_z === undefined) obj.cell_z = parts[2];
          }
        }
        await client.query(
          `INSERT INTO objects (id, space_id, cell_id, cell_x, cell_y, cell_z, position, scale, rotation, type, color, content, header_text, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (space_id, cell_id, id) DO UPDATE SET
             position = $7, scale = $8, rotation = $9, type = $10, color = $11,
             content = $12, header_text = $13, metadata = $14, updated_at = NOW()`,
          [obj.id, spaceId, obj.cell_id, obj.cell_x, obj.cell_y, obj.cell_z,
           obj.position || [0, 0, 0], obj.scale || [1, 1, 1], obj.rotation || [0, 0, 0],
           obj.type, obj.color, obj.content, obj.header_text, obj.metadata || {}]
        );
        objCount++;
      }
    }
    if (connections && connections.length > 0) {
      for (const conn of connections) {
        // Normalize frontend format
        if (conn.start && typeof conn.start === 'object' && !conn.start_obj) {
          conn.start_obj = conn.start.objectId || conn.start.id;
          conn.start_data = conn.start;
          conn.end_obj = conn.end.objectId || conn.end.id;
          conn.end_data = conn.end;
        }
        if (conn.lineStyle && !conn.line_style) conn.line_style = conn.lineStyle;
        if (conn.cellId && !conn.cell_id) conn.cell_id = conn.cellId;
        await client.query(
          `INSERT INTO connections (id, space_id, cell_id, start_obj, end_obj, start_data, end_data, line_style, color, text, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (space_id, cell_id, id) DO UPDATE SET
             start_obj = $4, end_obj = $5, start_data = $6, end_data = $7,
             line_style = $8, color = $9, text = $10, metadata = $11, updated_at = NOW()`,
          [conn.id, spaceId, conn.cell_id, conn.start_obj, conn.end_obj,
           conn.start_data, conn.end_data, conn.line_style || 'straight',
           conn.color || '#000000', conn.text, conn.metadata || {}]
        );
        connCount++;
      }
    }
    await client.query('COMMIT');
    res.json({ imported: { objects: objCount, connections: connCount } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Bulk import error:', err);
    res.status(500).json({ error: 'Bulk import failed' });
  } finally {
    client.release();
  }
});

router.post('/delete', async (req, res) => {
  const { spaceId, cellId, objectIds, connectionIds } = req.body;
  if (!spaceId || !cellId) return res.status(400).json({ error: 'spaceId and cellId are required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let objCount = 0, connCount = 0;
    if (objectIds && objectIds.length > 0) {
      const result = await client.query(
        `DELETE FROM objects WHERE space_id = $1 AND cell_id = $2 AND id = ANY($3)`,
        [spaceId, cellId, objectIds]
      );
      objCount = result.rowCount;
    }
    if (connectionIds && connectionIds.length > 0) {
      const result = await client.query(
        `DELETE FROM connections WHERE space_id = $1 AND cell_id = $2 AND id = ANY($3)`,
        [spaceId, cellId, connectionIds]
      );
      connCount = result.rowCount;
    }
    await client.query('COMMIT');
    res.json({ deleted: { objects: objCount, connections: connCount } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Bulk delete error:', err);
    res.status(500).json({ error: 'Bulk delete failed' });
  } finally {
    client.release();
  }
});
