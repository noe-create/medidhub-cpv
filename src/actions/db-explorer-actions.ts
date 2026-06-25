'use server';

import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';

/**
 * Fetches the names of all tables in the database.
 * Requires 'database.view' permission.
 */
export async function getTables(): Promise<string[]> {
  await authorize('database.view');
  
  // PostgreSQL query to get table names
  const tables = await prisma.$queryRawUnsafe<{ tablename: string }[]>(
    "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' ORDER BY tablename"
  );
  
  return tables.map((t) => t.tablename);
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

  // Get columns from information_schema
  const columnsResult = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
    "SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND table_schema = 'public' ORDER BY ordinal_position",
    tableName
  );
  
  const columns = columnsResult.map((col) => col.column_name);

  if (columns.length === 0) {
      return { columns: [], rows: [] };
  }

  // Sanitize column names for the SELECT query to be safe
  const sanitizedColumns = columns.map(c => `"${c}"`).join(', ');

  const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT ${sanitizedColumns} FROM "${tableName}"`);
  
  return { columns, rows };
}
