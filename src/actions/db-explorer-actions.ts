
'use server';

import { getDb } from '@/lib/db';
import { authorize } from '@/lib/auth';

/**
 * Fetches the names of all tables in the database.
 * Requires 'database.view' permission.
 */
export async function getTables(): Promise<string[]> {
  await authorize('database.view');
  const db = await getDb();
  const tables = await db.all<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
  return tables.map((t) => t.name);
}

/**
 * Fetches all data from a specific table.
 * Requires 'database.view' permission.
 * @param tableName The name of the table to fetch data from.
 */
export async function getTableData(tableName: string): Promise<{ columns: string[]; rows: any[] }> {
  await authorize('database.view');

  if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
    throw new Error('Nombre de tabla inválido.');
  }

  const db = await getDb();
  
  // Using PRAGMA to get column names is safer
  const columnsResult = await db.all(`PRAGMA table_info(${tableName})`);
  const columns = columnsResult.map((col: any) => col.name);

  if (columns.length === 0) {
      return { columns: [], rows: [] };
  }

  // Sanitize column names for the SELECT query to be safe
  const sanitizedColumns = columns.map(c => `"${c}"`).join(', ');

  const rows = await db.all(`SELECT ${sanitizedColumns} FROM ${tableName}`);
  
  return { columns, rows };
}
