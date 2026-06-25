'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import * as bcrypt from 'bcryptjs';
import type { User, Genero } from '@/lib/types';
import 'server-only';
import { revalidatePath } from 'next/cache';

export async function login(
    prevState: any,
    formData: FormData
): Promise<{ error?: string; success?: boolean }> {

    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    console.log(`[AUTH] Attempting login for user: ${username}`);

    if (!username || !password) {
        return { error: 'Por favor, ingrese usuario y contraseña.' };
    }

    try {
        const userWithPassword = await prisma.user.findUnique({
            where: { username },
            include: {
                role: {
                    include: {
                        permissions: true
                    }
                },
                persona: {
                    include: {
                        doctor: {
                            include: { specialty: true }
                        }
                    }
                }
            }
        });

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

        const session = await getSession();
        session.isLoggedIn = true;
        const { buildNombreCompleto } = await import('@/lib/prisma-helpers');
        
        session.user = {
            id: userWithPassword.id,
            username: userWithPassword.username,
            role: { id: userWithPassword.role.id, name: userWithPassword.role.name },
            specialty: userWithPassword.persona?.doctor?.specialty ? { 
                id: userWithPassword.persona.doctor.specialty.id, 
                name: userWithPassword.persona.doctor.specialty.name 
            } : undefined,
            name: userWithPassword.persona ? buildNombreCompleto(userWithPassword.persona) : userWithPassword.username,
            genero: userWithPassword.persona?.genero as Genero | undefined
        };
        session.permissions = userWithPassword.role.permissions.map(p => p.permissionId);

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

    const user = await prisma.user.findUnique({
        where: { id: Number(session.user.id) },
        select: { password: true }
    });

    if (!user) {
        throw new Error('No se pudo encontrar al usuario actual.');
    }

    const isMatch = await bcrypt.compare(data.currentPassword, user.password);
    if (!isMatch) {
        throw new Error('La contraseña actual es incorrecta.');
    }

    const newHashedPassword = await bcrypt.hash(data.newPassword, 10);

    await prisma.user.update({
        where: { id: Number(session.user.id) },
        data: { password: newHashedPassword }
    });
}


export async function getUsers(query?: string, page: number = 1, pageSize: number = 20) {
    const where: any = {};
    if (query && query.trim().length > 1) {
        const q = query.trim();
        where.OR = [
            { username: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } },
        ];
    }

    const [usersData, totalCount] = await Promise.all([
        prisma.user.findMany({
            where,
            include: {
                role: true,
                persona: {
                    include: {
                        doctor: {
                            include: { specialty: true }
                        }
                    }
                }
            },
            orderBy: { username: 'asc' },
            take: pageSize,
            skip: (page - 1) * pageSize,
        }),
        prisma.user.count({ where })
    ]);

    const { buildNombreCompleto } = await import('@/lib/prisma-helpers');

    const users: User[] = usersData.map((u) => ({
        id: u.id,
        username: u.username,
        name: u.persona ? buildNombreCompleto(u.persona) : u.username,
        personaId: u.personaId || undefined,
        fechaNacimiento: u.persona?.fechaNacimiento || undefined,
        persona: u.persona ? {
            ...u.persona,
            nombreCompleto: buildNombreCompleto(u.persona)
        } : undefined,
        role: {
            id: u.role.id,
            name: u.role.name
        },
        specialty: u.persona?.doctor?.specialty ? { 
            id: u.persona.doctor.specialty.id, 
            name: u.persona.doctor.specialty.name 
        } : undefined,
    }));

    return { users, totalCount };
}

interface UserCreationData {
    username: string;
    password?: string;
    name: string;
    roleId: number;
    specialtyId?: number;
    fechaNacimiento?: string;
    personaId?: string | number;
}

export async function createUser(data: UserCreationData) {
    try {
        if (!data.password || data.password.trim().length === 0) {
            throw new Error('La contraseña es requerida para crear un usuario.');
        }
        if (data.password.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres.');
        }
        const hashedPassword = await bcrypt.hash(data.password, 10);

        let personaId = data.personaId ? Number(data.personaId) : null;

        // If no personaId provided, create one from the name/date fields
        if (!personaId && data.name) {
            const names = data.name.trim().split(' ');
            const persona = await prisma.persona.create({
                data: {
                    primerNombre: names[0] || '',
                    primerApellido: names[1] || names[names.length - 1] || '',
                    fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : new Date(1990, 0, 1),
                    genero: 'Masculino', // Default
                }
            });
            personaId = persona.id;
        }
        
        const user = await prisma.user.create({
            data: {
                username: data.username,
                password: hashedPassword,
                roleId: Number(data.roleId),
                personaId: personaId,
            }
        });

        // If role is clinical and specialty is provided, ensure Doctor record exists
        const clinicalRoleIds = [3, 4, 5, 6]; // Medico, Especialista, etc.
        if (clinicalRoleIds.includes(Number(data.roleId)) && personaId) {
            await prisma.doctor.upsert({
                where: { personaId: personaId },
                update: { specialtyId: data.specialtyId ? Number(data.specialtyId) : undefined },
                create: {
                    personaId: personaId,
                    specialtyId: data.specialtyId ? Number(data.specialtyId) : 1, // Default or selected
                }
            });
        }
        revalidatePath('/dashboard/configuracion/usuarios');
    } catch (error: any) {
        if (error.code === 'P2002') {
            throw new Error('El nombre de usuario ya existe. Por favor, elija otro.');
        }
        throw error;
    }
}

interface UserUpdateData {
    username: string;
    password?: string;
    name: string;
    roleId: number;
    specialtyId?: number;
    fechaNacimiento?: string;
}

export async function updateUser(id: number | string, data: UserUpdateData) {
    try {
        const updateData: any = {
            username: data.username,
            roleId: Number(data.roleId),
        };

        if (data.password && data.password.length > 0) {
            updateData.password = await bcrypt.hash(data.password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: Number(id) },
            data: updateData,
            include: {
                role: true,
                persona: {
                    include: {
                        doctor: {
                            include: { specialty: true }
                        }
                    }
                }
            }
        });

        // Update Persona name/date if linked
        if (updatedUser.personaId) {
            const personaData: any = {};
            if (data.name) {
                const names = data.name.split(' ');
                personaData.primerNombre = names[0] || '';
                personaData.primerApellido = names[1] || names[names.length - 1] || '';
            }
            if (data.fechaNacimiento) {
                personaData.fechaNacimiento = new Date(data.fechaNacimiento);
            }

            if (Object.keys(personaData).length > 0) {
                await prisma.persona.update({
                    where: { id: updatedUser.personaId },
                    data: personaData
                });
            }
        }

        // Update Doctor specialty if linked
        if (updatedUser.persona?.doctor && data.specialtyId) {
            await prisma.doctor.update({
                where: { id: updatedUser.persona.doctor.id },
                data: { specialtyId: Number(data.specialtyId) }
            });
        }

        const { buildNombreCompleto } = await import('@/lib/prisma-helpers');

        const session = await getSession();
        if (session.user && session.user.id === Number(id)) {
            session.user.username = updatedUser.username;
            session.user.name = updatedUser.persona ? buildNombreCompleto(updatedUser.persona) : updatedUser.username;
            session.user.role = { id: updatedUser.role.id, name: updatedUser.role.name };
            session.user.specialty = updatedUser.persona?.doctor?.specialty 
                ? { id: updatedUser.persona.doctor.specialty.id, name: updatedUser.persona.doctor.specialty.name } 
                : undefined;

            await session.save();
        }
        revalidatePath('/dashboard/configuracion/usuarios');
    } catch (error: any) {
        console.error(`[AUTH] Failed to update user ${id}: `, error);
        throw error;
    }
}


export async function deleteUser(id: number | string) {
    try {
        await prisma.user.delete({
            where: { id: Number(id) }
        });
        revalidatePath('/dashboard/configuracion/usuarios');
    } catch (error: any) {
        if (error.code === 'P2025') {
            throw new Error('No se pudo eliminar el usuario. Es posible que ya haya sido eliminado.');
        }
        throw error;
    }
}
