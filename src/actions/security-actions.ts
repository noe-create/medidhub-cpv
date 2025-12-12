
'use server';

import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { authorize } from '@/lib/auth';
import type { Role, Permission } from '@/lib/types';
import { ALL_PERMISSIONS } from '@/lib/permissions';

export async function getRoles(): Promise<Role[]> {
  await authorize('roles.manage');
  const db = await getDb();
  const rows = await db.all('SELECT id, name, description, "hasSpecialty" FROM roles ORDER BY name');
  return rows.map(role => ({ ...role, hasSpecialty: !!role.hasSpecialty }));
}

export async function getRoleWithPermissions(roleId: string): Promise<(Role & { permissions: string[] }) | null> {
    await authorize('roles.manage');
    const db = await getDb();
    const roleRow = await db.get('SELECT id, name, description, "hasSpecialty" FROM roles WHERE id = ?', [roleId]);
    if (!roleRow) return null;

    const role: Role = { ...roleRow, hasSpecialty: !!roleRow.hasSpecialty };

    const rows = await db.all<{permissionId: string}>(
        'SELECT "permissionId" FROM role_permissions WHERE "roleId" = ?',
        [roleId]
    );
    
    return {
        ...role,
        permissions: rows.map(p => p.permissionId),
    };
}

export async function getAllPermissions(): Promise<Permission[]> {
    return ALL_PERMISSIONS;
}

export async function createRole(data: { name: string; description: string; hasSpecialty?: boolean; permissions: string[] }) {
  await authorize('roles.manage');
  const db = await getDb();
  
  try {
    const roleId = `role-${Date.now()}`;
    
    await db.exec('BEGIN');

    await db.run('INSERT INTO roles (id, name, description, "hasSpecialty") VALUES (?, ?, ?, ?)', [roleId, data.name, data.description, data.hasSpecialty ? 1 : 0]);
    
    for (const permissionId of data.permissions) {
      await db.run('INSERT INTO role_permissions ("roleId", "permissionId") VALUES (?, ?)', [roleId, permissionId]);
    }

    await db.exec('COMMIT');

    revalidatePath('/dashboard/seguridad/roles');
    const newRole = await db.get('SELECT * FROM roles WHERE id = ?', [roleId]);
    return newRole;

  } catch (error) {
    await db.exec('ROLLBACK');
    if ((error as any).code === 'SQLITE_CONSTRAINT') { 
      throw new Error('Ya existe un rol con ese nombre.');
    }
    console.error("Error creating role:", error);
    throw new Error("No se pudo crear el rol.");
  }
}

export async function updateRole(id: string, data: { name: string; description: string; hasSpecialty?: boolean; permissions: string[] }) {
  await authorize('roles.manage');
  const db = await getDb();

  await db.exec('BEGIN');
  try {
    await db.run('UPDATE roles SET name = ?, description = ?, "hasSpecialty" = ? WHERE id = ?', [data.name, data.description, data.hasSpecialty ? 1 : 0, id]);
    
    await db.run('DELETE FROM role_permissions WHERE "roleId" = ?', [id]);
    for (const permissionId of data.permissions) {
      await db.run('INSERT INTO role_permissions ("roleId", "permissionId") VALUES (?, ?)', [id, permissionId]);
    }

    await db.exec('COMMIT');
  } catch (error) {
    await db.exec('ROLLBACK');
    if ((error as any).code === 'SQLITE_CONSTRAINT') {
      throw new Error('Ya existe un rol con ese nombre.');
    }
    throw error;
  }

  revalidatePath('/dashboard/seguridad/roles');
  const updatedRole = await db.get('SELECT * FROM roles WHERE id = ?', [id]);
  return updatedRole;
}

export async function deleteRole(id: string) {
  await authorize('roles.manage');
  const db = await getDb();
  
  if (id === 'superuser') {
    throw new Error('El rol de Superusuario no puede ser eliminado.');
  }

  const userCountResult = await db.get('SELECT COUNT(*) as count FROM users WHERE "roleId" = ?', [id]);
  if (userCountResult && userCountResult.count > 0) {
    throw new Error('No se puede eliminar el rol porque está asignado a uno o más usuarios.');
  }

  await db.run('DELETE FROM roles WHERE id = ?', [id]);
  revalidatePath('/dashboard/seguridad/roles');
  return { success: true };
}
