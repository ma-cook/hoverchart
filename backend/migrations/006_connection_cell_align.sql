-- Align connection cell_id with the SOURCE OBJECT's center cell.
--
-- Scanned connections were persisted under the cell of their source *face*
-- point (start_data.position), which is up to ~5 units off the object center.
-- Near a cell boundary that face point rounds into a neighbouring cell that is
-- never loaded, so the cell-scoped connection poller never fetched those rows
-- and their lines never rendered. Objects are stored by center position, so
-- connections must be re-keyed the same way.
--
-- The client now writes corrected cell_ids going forward; this migration
-- repairs existing rows. Both objects and connections are partitioned with
-- CELL_SIZE = 15000, so the new cell is floor(coord / 15000) per axis.
--
-- start_data is the JSONB source endpoint; the object center lives at
-- start_data->'cube'->'position'. Fall back to start_data->'position' (the
-- face point) when the center is absent so nothing is dropped. Only rows whose
-- endpoint carries a 3-element numeric array are touched.
CREATE TEMP TABLE _conn_cell_recompute ON COMMIT DROP AS
SELECT
  c.space_id,
  c.id,
  c.cell_id AS old_cell_id,
  CASE
    WHEN jsonb_typeof(COALESCE(c.start_data -> 'cube' -> 'position', c.start_data -> 'position')) = 'array'
     AND jsonb_array_length(COALESCE(c.start_data -> 'cube' -> 'position', c.start_data -> 'position')) >= 3
    THEN
      floor((COALESCE(c.start_data -> 'cube' -> 'position', c.start_data -> 'position') ->> 0)::float / 15000)::int
      || ',' ||
      floor((COALESCE(c.start_data -> 'cube' -> 'position', c.start_data -> 'position') ->> 1)::float / 15000)::int
      || ',' ||
      floor((COALESCE(c.start_data -> 'cube' -> 'position', c.start_data -> 'position') ->> 2)::float / 15000)::int
    ELSE NULL
  END AS new_cell_id
FROM connections c
WHERE c.start_data IS NOT NULL;

-- Drop stale rows that would collide with an already-correct row at the target
-- cell (e.g. a rescan already re-saved the connection under the center cell).
DELETE FROM connections c
USING _conn_cell_recompute r
WHERE r.new_cell_id IS NOT NULL
  AND r.new_cell_id <> r.old_cell_id
  AND c.space_id = r.space_id
  AND c.id = r.id
  AND c.cell_id = r.old_cell_id
  AND EXISTS (
    SELECT 1 FROM connections c2
    WHERE c2.space_id = r.space_id
      AND c2.id = r.id
      AND c2.cell_id = r.new_cell_id
  );

-- Move the remaining rows whose computed cell differs from their stored cell.
UPDATE connections c
SET cell_id = r.new_cell_id
FROM _conn_cell_recompute r
WHERE r.new_cell_id IS NOT NULL
  AND r.new_cell_id <> r.old_cell_id
  AND c.space_id = r.space_id
  AND c.id = r.id
  AND c.cell_id = r.old_cell_id;
