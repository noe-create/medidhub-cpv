

'use server';

import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import type { User, Persona, Genero } from '@/lib/types';
import 'server-only';

interface UserRow {
    id: string;
    username: string;
    password: string;
    roleId: string;
    specialtyId?: string;
    name?: string;
    personaId?: string;
}

export async function login(
    prevState: any,
    formData: FormData
): Promise<{ error?: string; success?: boolean }> {

    const db = await getDb();
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    console.log(`[AUTH] Attempting login for user: ${username}`);

    if (!username || !password) {
        return { error: 'Por favor, ingrese usuario y contraseña.' };
    }

    try {
        const userWithPassword = await db.get<UserRow>(`
        SELECT id, username, password, "roleId", "specialtyId", name, "personaId"
        FROM users 
        WHERE username = ?
    `, [username]);

        if (!userWithPassword) {
            console.log(`[AUTH] Login failed: User not found for username '${username}'`);
            return { error: 'Usuario no encontrado.' };
        }

        const passwordMatch = await bcrypt.compare(password, userWithPassword.password);

        if (!passwordMatch) {
            console.log(`[AUTH] Login failed: Password mismatch for user '${username}'`);
            return { error: 'Contraseña incorrecta.' };
        }

        console.log(`[AUTH] Password match for ${username}: ${passwordMatch}`);

        const { password: _, ...userRow } = userWithPassword;

        const role = await db.get<{ id: string; name: string }>('SELECT id, name FROM roles WHERE id = ?', [userRow.roleId]);
        if (!role) {
            console.error(`[AUTH] Critical error: Role with ID ${userRow.roleId} not found for user ${username}`);
            return { error: 'Error de configuración de cuenta: Rol no encontrado.' };
        }

        let persona: Pick<Persona, 'genero'> | undefined;
        if (userRow.personaId) {
            persona = await db.get<{ genero: Genero }>('SELECT genero FROM personas WHERE id = ?', [userRow.personaId]);
        }

        const specialty = userRow.specialtyId ? await db.get<{ id: string; name: string }>('SELECT id, name FROM specialties WHERE id = ?', [userRow.specialtyId]) : undefined;

        const permissionRows = await db.all<{ permissionId: string }>(
            'SELECT "permissionId" FROM role_permissions WHERE "roleId" = ?',
            [userRow.roleId]
        );

        const session = await getSession();
        session.isLoggedIn = true;
        session.user = {
            id: userRow.id,
            username: userRow.username,
            role: { id: role.id, name: role.name },
            specialty: specialty ? { id: specialty.id, name: specialty.name } : undefined,
            name: userRow.name || userRow.username,
            genero: persona?.genero
        };
        session.permissions = permissionRows.map(p => p.permissionId);

        await session.save();
        console.log(`[AUTH] Session saved successfully for user: ${username}`);

        return { success: true };

    } catch (error) {
        console.error('[AUTH] Login error:', error);
        return { error: 'Ha ocurrido un error inesperado.' };
    }
}

export async function logout() {
    const session = await getSession();
    session.destroy();
    redirect('/login');
}


export async function changePasswordForCurrentUser(data: { currentPassword?: string; newPassword?: string; }) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
        throw new Error('No autorizado.');
    }

    if (!data.currentPassword || !data.newPassword) {
        throw new Error('Todos los campos son requeridos.');
    }

    const db = await getDb();

    const userWithPassword = await db.get<{ password: string }>('SELECT password FROM users WHERE id = ?', [session.user.id]);
    if (!userWithPassword) {
        throw new Error('No se pudo encontrar al usuario actual.');
    }

    const isMatch = await bcrypt.compare(data.currentPassword, userWithPassword.password);
    if (!isMatch) {
        throw new Error('La contraseña actual es incorrecta.');
    }

    const newHashedPassword = await bcrypt.hash(data.newPassword, 10);

    await db.run('UPDATE users SET password = ? WHERE id = ?', [newHashedPassword, session.user.id]);
}


export async function getUsers(query?: string, page: number = 1, pageSize: number = 20) {
    const db = await getDb();

    let whereClause = `WHERE 1=1`;
    const params: any[] = [];
    if (query && query.trim().length > 1) {
        const searchQuery = `%${query.trim()}%`;
        whereClause += ` AND (u.username LIKE ? OR u.name LIKE ?)`;
        params.push(searchQuery, searchQuery);
    }

    const countResult = await db.get<{ count: number }>(`
        SELECT COUNT(*) as count 
        FROM users u 
        ${whereClause}
    `, params);
    const totalCount = countResult?.count || 0;

    const offset = (page - 1) * pageSize;

    // Add params for LIMIT and OFFSET *after* the count query
    params.push(pageSize, offset);

    interface UserDataFromDb {
        id: string;
        username: string;
        name: string;
        roleId: string;
        specialtyId?: string;
        personaId?: string;
    }

    const usersData = await db.all<UserDataFromDb[]>(`
    SELECT
    u.id, u.username, u.name, u."roleId", u."specialtyId", u."personaId"
        FROM users u
        ${whereClause}
        ORDER BY u.username
    LIMIT ? OFFSET ?
        `, params);

    const roles = await db.all<{ id: string; name: string }>('SELECT id, name FROM roles');
    const specialties = await db.all<{ id: string; name: string }>('SELECT id, name FROM specialties');

    const rolesMap = new Map(roles.map(r => [r.id, r.name]));
    const specialtiesMap = new Map(specialties.map(s => [s.id, s.name]));

    // Treat data from DB as 'any' to be safe, as db.all returns Promise<any[]>
    const users: User[] = usersData.map((u: any) => {
        // Ensure essential properties exist to prevent runtime errors
        const roleId = u.roleId || 'unknown';
        return {
            id: u.id,
            username: u.username,
            name: u.name,
            role: {
                id: roleId,
                name: rolesMap.get(roleId) || 'Rol no encontrado'
            },
            specialty: u.specialtyId ? { id: u.specialtyId, name: specialtiesMap.get(u.specialtyId) || 'Especialidad no encontrada' } : undefined,
        };
    });

    return { users, totalCount };
}

interface UserCreationData {
    username: string;
    password?: string;
    name: string;
    roleId: string;
    specialtyId?: string;
}

export async function createUser(data: UserCreationData) {
    const db = await getDb();
    try {
        if (!data.password || data.password.trim().length === 0) {
            throw new Error('La contraseña es requerida para crear un usuario.');
        }
        if (data.password.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres.');
        }
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const userId = `usr - ${uuidv4()} `;
        await db.run(
            'INSERT INTO users (id, username, password, "roleId", "specialtyId", name) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, data.username, hashedPassword, data.roleId, data.specialtyId || null, data.name || null]
        );
    } catch (error: any) {
        // Handle unique constraint violation for both SQLite and PostgreSQL
        if (error.code === 'SQLITE_CONSTRAINT' || (error.code === '23505' && error.constraint === 'users_username_key')) {
            throw new Error('El nombre de usuario ya existe. Por favor, elija otro.');
        }
        throw error;
    }
}

interface UserUpdateData {
    username: string;
    password?: string;
    name: string;
    roleId: string;
    specialtyId?: string;
}

export async function updateUser(id: string, data: UserUpdateData) {
    const db = await getDb();
    // Use a transaction to ensure atomicity of DB update and session update
    try {
        await db.exec('BEGIN');

        if (data.password && data.password.length > 0) {
            const hashedPassword = await bcrypt.hash(data.password, 10);
            await db.run(
                'UPDATE users SET username = ?, password = ?, "roleId" = ?, "specialtyId" = ?, name = ? WHERE id = ?',
                [data.username, hashedPassword, data.roleId, data.specialtyId || null, data.name || null, id]
            );
        } else {
            await db.run(
                'UPDATE users SET username = ?, "roleId" = ?, "specialtyId" = ?, name = ? WHERE id = ?',
                [data.username, data.roleId, data.specialtyId || null, data.name || null, id]
            );
        }

        const session = await getSession();
        if (session.user && session.user.id === id) {
            session.user.username = data.username;
            session.user.name = data.name || data.username;

            const role = await db.get<{ id: string; name: string }>('SELECT id, name FROM roles WHERE id = ?', [data.roleId]);
            session.user.role = role
                ? { id: role.id, name: role.name }
                : { id: data.roleId, name: 'Rol no encontrado' };

            if (data.specialtyId) {
                const specialty = await db.get<{ id: string; name: string }>('SELECT id, name FROM specialties WHERE id = ?', [data.specialtyId]);
                session.user.specialty = specialty
                    ? { id: specialty.id, name: specialty.name }
                    : { id: data.specialtyId, name: 'Especialidad no encontrada' };
            } else {
                session.user.specialty = undefined;
            }

            await session.save();
        }

        await db.exec('COMMIT');
    } catch (error) {
        await db.exec('ROLLBACK');
        console.error(`[AUTH] Failed to update user ${id}: `, error);
        throw error; // Re-throw the error to be handled by the caller
    }
}


export async function deleteUser(id: string) {
    const db = await getDb();
    const result = await db.run('DELETE FROM users WHERE id = ?', [id]);
    if (result.changes === 0) {
        throw new Error('No se pudo eliminar el usuario. Es posible que ya haya sido eliminado.');
    }
}
