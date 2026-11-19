export const SPACE_CHILD_TABLES = [
  'user_presence',
  'chat_messages',
  'plan_tasks',
  'plans',
  'objects',
  'connections',
  'spatial_cells',
  'scan_jobs',
];

export async function existingTables(client, names) {
  const { rows } = await client.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = current_schema() AND table_name = ANY($1::text[])`,
    [names]
  );
  return new Set(rows.map((row) => row.table_name));
}

export async function deleteSpaceChildren(client, spaceIds) {
  if (!spaceIds || spaceIds.length === 0) return;
  const tables = await existingTables(client, SPACE_CHILD_TABLES);
  for (const table of SPACE_CHILD_TABLES) {
    if (!tables.has(table)) continue;
    await client.query(`DELETE FROM ${table} WHERE space_id = ANY($1::uuid[])`, [
      spaceIds,
    ]);
  }
}
