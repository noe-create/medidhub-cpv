'use server';

import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';
import type { Setting } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function getSettings(): Promise<Setting[]> {
  const settings = await prisma.setting.findMany();
  return settings as any[];
}

export async function updateSettings(settingsToUpdate: Setting[]): Promise<{ success: boolean }> {
  await authorize('settings.manage');

  try {
    await prisma.$transaction(
      settingsToUpdate.map((setting) =>
        prisma.setting.upsert({
          where: { key: setting.key },
          update: { value: setting.value },
          create: { key: setting.key, value: setting.value },
        })
      )
    );

    revalidatePath('/login');
    revalidatePath('/dashboard/apariencia');

    return { success: true };
  } catch (error) {
    console.error("Error updating settings:", error);
    throw new Error('No se pudo guardar la configuración.');
  }
}
