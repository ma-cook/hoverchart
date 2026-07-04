import { readFileSync } from 'fs';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const firestoreData = JSON.parse(readFileSync('firestore-export.json', 'utf-8'));

  for (const [uid, userData] of Object.entries(firestoreData)) {
    const { data } = userData;

    if (data.email || data.displayName) {
      await pool.query(
        `INSERT INTO users (id, email, display_name, photo_url, metadata)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
           email = $2, display_name = $3, photo_url = $4, metadata = $5`,
        [uid, data.email || null, data.displayName || data.display_name || null,
         data.photoURL || data.photo_url || null, data.metadata || data.customMetadata || {}]
      );
    }

    for (const [spaceId, space] of Object.entries(userData.spaces || {})) {
      const sd = space.data || {};
      await pool.query(
        `INSERT INTO spaces (id, owner_id, name, is_public, shared_with, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           name = $3, is_public = $4, shared_with = $5, metadata = $6`,
        [spaceId, uid, sd.name || 'Untitled', sd.isPublic || sd.is_public || false,
         JSON.stringify(sd.sharedWith || sd.shared_with || []), sd.metadata || {}]
      );

      for (const [cellId, cell] of Object.entries(space.cells || {})) {
        const cd = cell.data || {};
        if (cd.x !== undefined && cd.y !== undefined && cd.z !== undefined) {
          await pool.query(
            `INSERT INTO spatial_cells (id, space_id, x, y, z, bounds)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (space_id, id) DO NOTHING`,
            [cellId, spaceId, cd.x, cd.y, cd.z, cd.bounds || null]
          );
        }

        for (const [objId, obj] of Object.entries(cell.objects || {})) {
          await pool.query(
            `INSERT INTO objects (id, space_id, cell_id, cell_x, cell_y, cell_z, position, scale, rotation, type, color, content, header_text, metadata)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             ON CONFLICT (space_id, cell_id, id) DO UPDATE SET
               position = $7, scale = $8, rotation = $9, type = $10, color = $11,
               content = $12, header_text = $13, metadata = $14`,
            [objId, spaceId, cellId, obj.cell_x ?? cd.x, obj.cell_y ?? cd.y, obj.cell_z ?? cd.z,
             obj.position || [0, 0, 0], obj.scale || [1, 1, 1], obj.rotation || [0, 0, 0],
             obj.type || 'object', obj.color || null, obj.content || null,
             obj.headerText || obj.header_text || null, obj.metadata || {}]
          );
        }

        for (const [connId, conn] of Object.entries(cell.connections || {})) {
          await pool.query(
            `INSERT INTO connections (id, space_id, cell_id, start_obj, end_obj, start_data, end_data, line_style, color, text, metadata)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT (space_id, cell_id, id) DO UPDATE SET
               start_obj = $4, end_obj = $5, start_data = $6, end_data = $7,
               line_style = $8, color = $9, text = $10, metadata = $11`,
            [connId, spaceId, cellId, conn.startObj || conn.start_obj,
             conn.endObj || conn.end_obj, conn.startData || conn.start_data || null,
             conn.endData || conn.end_data || null, conn.lineStyle || conn.line_style || 'straight',
             conn.color || '#000000', conn.text || null, conn.metadata || {}]
          );
        }
      }
    }
    console.log(`Imported user ${uid}`);
  }

  console.log('Import complete');
  await pool.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
