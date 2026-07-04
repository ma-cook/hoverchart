import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'migrations');

export async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  const { rows: applied } = await pool.query('SELECT name FROM _migrations');
  const appliedNames = new Set(applied.map((r) => r.name));

  let files;
  try {
    files = await fs.readdir(MIGRATIONS_DIR);
  } catch {
    console.log('No migrations directory found, skipping');
    return;
  }

  files.sort();
  for (const file of files) {
    if (!file.endsWith('.sql') || appliedNames.has(file)) continue;
    const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
    console.log(`Applying migration: ${file}...`);
    await pool.query(sql);
    await pool.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
    console.log(`Applied: ${file}`);
  }
}

// Allow running directly
const isMain = process.argv[1] && (
  process.argv[1] === fileURLToPath(import.meta.url)
);
if (isMain) {
  runMigrations()
    .then(() => {
      console.log('Migrations complete');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
