'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { authorize } from '@/lib/auth';
import type { Role, Permission } from '@/lib/types';
import { ALL_PERMISSIONS } from '@/lib/permissions';

export async function getRoles(): Promise<Role[]> {
  await authorize('roles.manage');
  const rows = await prisma.role.findMany({
    orderBy: { name: 'asc' }
  });
  return rows.map((role: any) => ({ ...role, hasSpecialty: !!role.hasSpecialty })) as any[];
}

export async function getRoleWithPermissions(roleId: string | number): Promise<(Omit<Role, 'permissions'> & { permissions: string[] }) | null> {
  await authorize('roles.manage');
  
  const roleRow = await prisma.role.findUnique({
    where: { id: Number(roleId) },
    include: {
      permissions: true
    }
  });

  if (!roleRow) return null;

  return {
    id: roleRow.id,
    name: roleRow.name,
    description: roleRow.description || undefined,
    hasSpecialty: roleRow.hasSpecialty,
    permissions: roleRow.permissions.map(p => p.permissionId),
  } as any;
}

export async function getAllPermissions(): Promise<Permission[]> {
  return ALL_PERMISSIONS;
}

export async function createRole(data: { name: string; description: string; hasSpecialty?: boolean; permissions: string[] }) {
  await authorize('roles.manage');

  try {
    const role = await prisma.$transaction(async (tx) => {
      const created = await tx.role.create({
        data: {
          name: data.name,
          description: data.description,
          hasSpecialty: !!data.hasSpecialty,
        }
      });

      if (data.permissions.length > 0) {
        await tx.rolePermission.createMany({
          data: data.permissions.map(permissionId => ({
            roleId: created.id,
            permissionId
          }))
        });
      }

      return created;
    });

    revalidatePath('/dashboard/seguridad/roles');
    return role;

  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new Error('Ya existe un rol con ese nombre.');
    }
    console.error("Error creating role:", error);
    throw new Error("No se pudo crear el rol.");
  }
}

export async function updateRole(id: string | number, data: { name: string; description: string; hasSpecialty?: boolean; permissions: string[] }) {
  await authorize('roles.manage');

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const role = await tx.role.update({
        where: { id: Number(id) },
        data: {
          name: data.name,
          description: data.description,
          hasSpecialty: !!data.hasSpecialty,
        }
      });

      // Simple way: delete and recreate permissions
      await tx.rolePermission.deleteMany({
        where: { roleId: role.id }
      });

      if (data.permissions.length > 0) {
        await tx.rolePermission.createMany({
          data: data.permissions.map(permissionId => ({
            roleId: role.id,
            permissionId
          }))
        });
      }

      return role;
    });

    revalidatePath('/dashboard/seguridad/roles');
    return updated;
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new Error('Ya existe un rol con ese nombre.');
    }
    throw error;
  }
}

export async function deleteRole(id: string | number) {
  await authorize('roles.manage');

  const roleIdNum = Number(id);

  // Hardcoded check for superuser (assuming it has a specific ID or we check by name)
  const role = await prisma.role.findUnique({ where: { id: roleIdNum } });
  if (role?.name === 'Superusuario') {
    throw new Error('El rol de Superusuario no puede ser eliminado.');
  }

  const userCount = await prisma.user.count({
    where: { roleId: roleIdNum }
  });
  
  if (userCount > 0) {
    throw new Error('No se puede eliminar el rol porque está asignado a uno o más usuarios.');
  }

  await prisma.role.delete({
    where: { id: roleIdNum }
  });
  
  revalidatePath('/dashboard/seguridad/roles');
  return { success: true };
}
