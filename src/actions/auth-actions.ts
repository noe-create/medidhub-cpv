

'use server';

import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import type { User, Persona } from '@/lib/types';
import 'server-only';

export async function login(
    prevState: any,
    formData: FormData
): Promise<{ error?: string; success?: boolean }> {
    'use server';

    const db = await getDb();
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    console.log(`[AUTH] Attempting login for user: ${username}`);

    if (!username || !password) {
        return { error: 'Por favor, ingrese usuario y contraseña.' };
    }

    try {
        const userWithPassword: (User & { password: string }) | undefined = await db.get(`
        SELECT id, username, password, "roleId", "specialtyId", name, "personaId"
        FROM users 
        WHERE username = ?
    `, [username]);

        if (!userWithPassword) {
            console.log(`[AUTH] Login failed: User not found for username '${username}'`);
            return { error: 'Usuario o contraseña incorrectos.' };
        }

        const passwordMatch = await bcrypt.compare(password, userWithPassword.password);

        if (!passwordMatch) {
            console.log(`[AUTH] Login failed: Password mismatch for user '${username}'`);
            return { error: 'Usuario o contraseña incorrectos.' };
        }

        console.log(`[AUTH] Password match for ${username}: ${passwordMatch}`);

        const { password: _, ...userRow } = userWithPassword;

        const role = await db.get('SELECT id, name FROM roles WHERE id = ?', [userRow.roleId]);
        if (!role) {
            console.error(`[AUTH] Critical error: Role with ID ${userRow.roleId} not found for user ${username}`);
            return { error: 'Error de configuración de cuenta: Rol no encontrado.' };
        }

        let persona: Persona | undefined;
        if (userRow.personaId) {
            persona = await db.get('SELECT genero FROM personas WHERE id = ?', [userRow.personaId]);
        }

        const specialty = userRow.specialtyId ? await db.get('SELECT id, name FROM specialties WHERE id = ?', [userRow.specialtyId]) : undefined;

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

    const countResult = await db.get(`
        SELECT COUNT(*) as count 
        FROM users u 
        ${whereClause}
    `, params);
    const totalCount = countResult?.count || 0;

    const offset = (page - 1) * pageSize;
    params.push(pageSize, offset);

    const usersData = await db.all(`
        SELECT 
            u.id, u.username, u.name, u."roleId", u."specialtyId", u."personaId"
        FROM users u
        ${whereClause}
        ORDER BY u.username
        LIMIT ? OFFSET ?
    `, params);

    const roles = await db.all('SELECT id, name FROM roles');
    const specialties = await db.all('SELECT id, name FROM specialties');

    const rolesMap = new Map(roles.map(r => [r.id, r.name]));
    const specialtiesMap = new Map(specialties.map(s => [s.id, s.name]));

    const users: User[] = usersData.map((u: any) => ({
        id: u.id,
        username: u.username,
        name: u.name,
        role: {
            id: u.roleId,
            name: rolesMap.get(u.roleId) || u.roleId
        },
        specialty: u.specialtyId ? { id: u.specialtyId, name: specialtiesMap.get(u.specialtyId) || u.specialtyId } : undefined,
    }));

    return { users, totalCount };
}

export async function createUser(data: any) {
    const db = await getDb();
    try {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const userId = `usr-${Date.now()}`;
        await db.run(
            'INSERT INTO users (id, username, password, "roleId", "specialtyId", name) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, data.username, hashedPassword, data.roleId, data.specialtyId || null, data.name || null]
        );
    } catch (error: any) {
        if (error.code === 'SQLITE_CONSTRAINT' && error.message.includes('users.username')) {
            throw new Error('El nombre de usuario ya existe. Por favor, elija otro.');
        }
        throw error;
    }
}

export async function updateUser(id: string, data: any) {
    const db = await getDb();
    const session = await getSession();

    if (data.password) {
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

    if (session.user && session.user.id === id) {
        session.user.username = data.username;
        session.user.name = data.name || data.username;
        const role = await db.get('SELECT id, name FROM roles WHERE id = ?', [data.roleId]);
        if (role) session.user.role = role;
        const specialty = data.specialtyId ? await db.get('SELECT id, name FROM specialties WHERE id = ?', [data.specialtyId]) : undefined;
        if (specialty) session.user.specialty = specialty;

        await session.save();
    }
}


export async function deleteUser(id: string) {
    const db = await getDb();
    await db.run('DELETE FROM users WHERE id = ?', [id]);
}
