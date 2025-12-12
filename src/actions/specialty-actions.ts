
'use server';

import { getDb } from '@/lib/db';
import type { Specialty } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { authorize } from '@/lib/auth';

export async function getSpecialties(query?: string): Promise<Specialty[]> {
  await authorize('specialties.manage');
  const db = await getDb();
  
  let selectQuery = `SELECT * FROM specialties`;
  const params: any[] = [];
  if (query && query.trim().length > 0) {
    selectQuery += ` WHERE name LIKE ?`;
    params.push(`%${query}%`);
  }
  selectQuery += ' ORDER BY name';

  const specialties = await db.all(selectQuery, params);
  return specialties;
}

export async function createSpecialty(data: { name: string }): Promise<Specialty> {
  await authorize('specialties.manage');
  const db = await getDb();
  const newSpecialty = { ...data, id: `spec-${Date.now()}` };
  try {
    await db.run(
      'INSERT INTO specialties (id, name) VALUES (?, ?)',
      [newSpecialty.id, newSpecialty.name]
    );
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      throw new Error('Ya existe una especialidad con ese nombre.');
    }
    throw error;
  }
  revalidatePath('/dashboard/especialidades');
  return newSpecialty;
}

export async function updateSpecialty(id: string, data: { name: string }): Promise<Specialty> {
  await authorize('specialties.manage');
  const db = await getDb();
  try {
    const result = await db.run(
      'UPDATE specialties SET name = ? WHERE id = ?',
      [data.name, id]
    );
    if (result.changes === 0) throw new Error('Especialidad no encontrada.');
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      throw new Error('Ya existe una especialidad con ese nombre.');
    }
    throw error;
  }
  revalidatePath('/dashboard/especialidades');
  return { ...data, id };
}

export async function deleteSpecialty(id: string): Promise<{ success: boolean }> {
  await authorize('specialties.manage');
  const db = await getDb();
  
  const userCount = await db.get('SELECT COUNT(*) as count FROM users WHERE "specialtyId" = ?', [id]);
  if (userCount.count > 0) {
    throw new Error('No se puede eliminar la especialidad porque está asignada a uno o más usuarios.');
  }

  const result = await db.run('DELETE FROM specialties WHERE id = ?', [id]);
  if (result.changes === 0) throw new Error('Especialidad no encontrada para eliminar.');

  revalidatePath('/dashboard/especialidades');
  return { success: true };
}
