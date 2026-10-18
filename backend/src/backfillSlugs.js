import pool from './db.js';
import { buildSpaceSlug, uniqueSlug } from './utils/slug.js';

/**
 * Assign a slug to every space that predates the slug column (or was created
 * before slug generation existed). Idempotent: only rows with a NULL/empty
 * slug are touched, and existing slugs are preloaded so nothing collides.
 * Called once at API startup, after migrations have added the column.
 */
export async function backfillSlugs() {
  const column = await pool.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_name = 'spaces' AND column_name = 'slug'`
  );
  if (column.rows.length === 0) return;

  const { rows: pending } = await pool.query(
    `SELECT s.id, s.name, u.display_name, u.email
     FROM spaces s
     LEFT JOIN users u ON u.id = s.owner_id
     WHERE s.slug IS NULL OR s.slug = ''`
  );
  if (pending.length === 0) return;

  const { rows: existing } = await pool.query(
    `SELECT slug FROM spaces WHERE slug IS NOT NULL AND slug <> ''`
  );
  const taken = new Set(existing.map((r) => r.slug));

  console.log(`[slug] backfilling ${pending.length} space slug(s)...`);
  let failed = 0;
  for (const row of pending) {
    const base = buildSpaceSlug(
      { display_name: row.display_name, email: row.email },
      row.name
    );
    const slug = await uniqueSlug(base, (c) => Promise.resolve(taken.has(c)));
    taken.add(slug);
    try {
      await pool.query(`UPDATE spaces SET slug = $1 WHERE id = $2`, [
        slug,
        row.id,
      ]);
    } catch (err) {
      failed += 1;
      console.error(`[slug] failed to backfill space ${row.id}:`, err.message);
    }
  }
  console.log(
    `[slug] backfill complete (${pending.length - failed}/${pending.length})`
  );
}
