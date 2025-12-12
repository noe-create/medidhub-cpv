
'use server';

import { getDb } from '@/lib/db';
import { authorize } from '@/lib/auth';
import type { Setting } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function getSettings(): Promise<Setting[]> {
  const db = await getDb();
  const settings = await db.all('SELECT key, value FROM settings');
  return settings;
}

export async function updateSettings(settingsToUpdate: Setting[]): Promise<{ success: boolean }> {
  await authorize('settings.manage');
  const db = await getDb();

  try {
    await db.exec('BEGIN');
    for (const setting of settingsToUpdate) {
      await db.run(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
        [setting.key, setting.value]
      );
    }
    await db.exec('COMMIT');

    revalidatePath('/login');
    revalidatePath('/dashboard/apariencia');

    return { success: true };
  } catch (error) {
    await db.exec('ROLLBACK');
    console.error("Error updating settings:", error);
    throw new Error('No se pudo guardar la configuración.');
  }
}
