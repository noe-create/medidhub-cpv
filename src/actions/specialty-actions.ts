'use server';

import { prisma } from '@/lib/prisma';
import type { Specialty } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { authorize } from '@/lib/auth';

export async function getSpecialties(query?: string): Promise<Specialty[]> {
  await authorize('specialties.manage');
  
  const where: any = {};
  if (query && query.trim().length > 0) {
    where.name = { contains: query.trim(), mode: 'insensitive' };
  }

  const specialties = await prisma.specialty.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  return specialties as any[];
}

export async function createSpecialty(data: { name: string }): Promise<Specialty> {
  await authorize('specialties.manage');
  
  try {
    const specialty = await prisma.specialty.create({
      data: { name: data.name }
    });
    revalidatePath('/dashboard/especialidades');
    return specialty as any;
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new Error('Ya existe una especialidad con ese nombre.');
    }
    throw error;
  }
}

export async function updateSpecialty(id: number | string, data: { name: string }): Promise<Specialty> {
  await authorize('specialties.manage');
  
  try {
    const updated = await prisma.specialty.update({
      where: { id: Number(id) },
      data: { name: data.name }
    });
    revalidatePath('/dashboard/especialidades');
    return updated as any;
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new Error('Ya existe una especialidad con ese nombre.');
    }
    throw error;
  }
}

export async function deleteSpecialty(id: number | string): Promise<{ success: boolean }> {
  await authorize('specialties.manage');

  const userCount = await prisma.user.count({
    where: { specialtyId: Number(id) }
  });
  
  if (userCount > 0) {
    throw new Error('No se puede eliminar la especialidad porque está asignada a uno o más usuarios.');
  }

  try {
    await prisma.specialty.delete({
      where: { id: Number(id) }
    });
    revalidatePath('/dashboard/especialidades');
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2025') {
      throw new Error('Especialidad no encontrada para eliminar.');
    }
    throw error;
  }
}
