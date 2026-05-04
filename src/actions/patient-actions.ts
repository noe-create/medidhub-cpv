

'use server';

import { prisma } from '@/lib/prisma';
import { buildNombreCompleto, buildCedula, enrichPersona, enrichConsultation } from '@/lib/prisma-helpers';
import { Prisma } from '@prisma/client';
import type {
    Persona,
    Titular,
    Beneficiario,
    Empresa,
    Patient,
    PatientStatus,
    Cie10Code,
    Consultation,
    CreateConsultationInput,
    SearchResult,
    BeneficiarioConTitular,
    PacienteConInfo,
    TreatmentOrder,
    CreateTreatmentExecutionInput,
    TreatmentExecution,
    HistoryEntry,
    MorbidityReportRow,
    OperationalReportData,
    LabOrder,
    MotivoConsulta,
    TreatmentOrderItem,
    User,
    PatientSummary,
    Invoice,
    OccupationalHealthEvaluation,
    Service,
    ServiceType,
    UnidadServicio
} from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { calculateAge } from '@/lib/utils';
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';
// import { summarizePatientHistory } from '@/ai/flows/summarize-patient-history';


// --- Helpers ---
const fullNameSql = `TRIM(p."primerNombre" || ' ' || COALESCE(p."segundoNombre", '') || ' ' || p."primerApellido" || ' ' || COALESCE(p."segundoApellido", ''))`;
const titularNameSql = `TRIM(p_titular."primerNombre" || ' ' || COALESCE(p_titular."segundoNombre", '') || ' ' || p_titular."primerApellido" || ' ' || COALESCE(p_titular."segundoApellido", ''))`;
const fullCedulaSql = `CASE WHEN p.nacionalidad IS NOT NULL AND p."cedulaNumero" IS NOT NULL THEN p.nacionalidad || '-' || p."cedulaNumero" ELSE NULL END`;
const fullCedulaSearchSql = `(p.nacionalidad || '-' || p."cedulaNumero")`;

// --- Date Helpers ---
function parseDateToIso(dateStr: any): string | null {
    if (!dateStr) return null;
    const str = String(dateStr).trim();
    if (!str) return null;

    // Handle DD/MM/YYYY or YYYY/MM/DD or DD-MM-YYYY
    const slashParts = str.split('/');
    const dashParts = str.split('-');
    const parts = slashParts.length === 3 ? slashParts : (dashParts.length === 3 ? dashParts : []);

    if (parts.length === 3) {
        const first = parseInt(parts[0], 10);
        const second = parseInt(parts[1], 10);
        const third = parseInt(parts[2], 10);

        if (isNaN(first) || isNaN(second) || isNaN(third)) return null;

        let day: number, month: number, year: number;
        if (third > 31) { // Format: DD/MM/YYYY (likely)
            day = first; month = second; year = third;
        } else if (first > 100) { // Format: YYYY/MM/DD
            year = first; month = second; day = third;
        } else { // Default assumption: DD/MM/YYYY
            day = first; month = second; year = third;
        }

        // Validate components
        if (month < 1 || month > 12 || day < 1 || day > 31) return null;

        const date = new Date(Date.UTC(year, month - 1, day));
        if (!isNaN(date.getTime()) && date.getUTCFullYear() === year) {
            return date.toISOString();
        }
    }

    // Fallback: Standard JS Date parsing
    const fallback = new Date(str);
    if (!isNaN(fallback.getTime())) {
        // Ensure we normalize to UTC midnight to avoid timezone shifts
        return new Date(Date.UTC(fallback.getUTCFullYear(), fallback.getUTCMonth(), fallback.getUTCDate())).toISOString();
    }

    return null;
}

// --- Authorization Helpers ---
async function ensureAdminPermission() {
    const session = await getSession();
    // 1: superuser, 2: admin
    const adminRoles = [1, 2];
    const roleId = Number(session.user?.role.id);
    const roleName = session.user?.role.name;
    
    if (!session.isLoggedIn || !session.user || (!adminRoles.includes(roleId) && roleName !== 'Superusuario' && roleName !== 'Admin')) {
        throw new Error('Acción no autorizada. Se requiere rol de administrador o superusuario.');
    }
}

async function ensureDataEntryPermission() {
    const session = await getSession();
    // 1-7: All seeded roles have some data entry permission or clinical role
    const allowedRoles = [1, 2, 3, 4, 5, 6, 7];
    const roleId = Number(session.user?.role.id);
    const roleName = session.user?.role.name;

    if (!session.isLoggedIn || !session.user || (!allowedRoles.includes(roleId) && roleName !== 'Superusuario')) {
        throw new Error('Acción no autorizada. Se requiere permiso para ingreso de datos.');
    }
}

// --- Unidades de Servicio Actions ---

export async function getUnidadesServicio(): Promise<UnidadServicio[]> {
    return await prisma.unidadServicio.findMany({
        where: { isActive: true },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
}

export async function getAllUnidadesServicio(): Promise<UnidadServicio[]> {
    return await prisma.unidadServicio.findMany({
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
}

export async function createUnidadServicio(data: { name: string; category?: string }): Promise<UnidadServicio> {
    await ensureAdminPermission();
    return await prisma.unidadServicio.create({
        data: { name: data.name, category: data.category || null },
    });
}

export async function updateUnidadServicio(id: string, data: { name: string; category?: string; isActive?: boolean }): Promise<UnidadServicio> {
    await ensureAdminPermission();
    return await prisma.unidadServicio.update({
        where: { id: Number(id) },
        data: { name: data.name, category: data.category || null, isActive: data.isActive !== false },
    });
}

export async function deleteUnidadServicio(id: string): Promise<{ success: boolean }> {
    await ensureAdminPermission();
    const usage = await prisma.titular.count({ where: { unidadServicioId: Number(id) } });
    if (usage > 0) {
        throw new Error(`Esta unidad de servicio está asignada a ${usage} titular(es). No se puede eliminar.`);
    }
    await prisma.unidadServicio.delete({ where: { id: Number(id) } });
    return { success: true };
}

/**
 * Resolves a unidadServicio text value to its ID in the unidades_servicio table.
 * If the text doesn't exist yet, it creates a new entry.
 */
async function resolveUnidadServicioId(unidadServicioText: string): Promise<number> {
    const existing = await prisma.unidadServicio.findFirst({
        where: { name: { equals: unidadServicioText, mode: 'insensitive' } },
    });
    if (existing) return existing.id;

    const created = await prisma.unidadServicio.create({
        data: { name: unidadServicioText, category: 'Otros' },
    });
    return created.id;
}

// --- Persona Actions (Centralized Person Management) ---

async function getOrCreatePersona(personaData: Omit<Persona, 'id' | 'fechaNacimiento'> & { fechaNacimiento: string; representanteId?: number; }) {
    let existingPersona;
    if (personaData.nacionalidad && personaData.cedulaNumero) {
        existingPersona = await prisma.persona.findFirst({
            where: { nacionalidad: personaData.nacionalidad, cedulaNumero: personaData.cedulaNumero },
            select: { id: true },
        });
    }

    if (existingPersona) {
        return existingPersona.id;
    }

    const age = calculateAge(new Date(personaData.fechaNacimiento));
    if (age < 18 && !personaData.cedulaNumero && !personaData.representanteId) {
        throw new Error('Un menor de edad sin cédula debe tener un representante asignado.');
    }

    // Safeguard: Remove computed fields that are not in the schema
    const { nombreCompleto, cedula, edad, age: _, ...cleanPersonaData } = personaData as any;

    const created = await prisma.persona.create({
        data: {
            primerNombre: cleanPersonaData.primerNombre,
            segundoNombre: cleanPersonaData.segundoNombre || null,
            primerApellido: cleanPersonaData.primerApellido,
            segundoApellido: cleanPersonaData.segundoApellido || null,
            nacionalidad: cleanPersonaData.nacionalidad || null,
            cedulaNumero: cleanPersonaData.cedulaNumero || null,
            fechaNacimiento: new Date(cleanPersonaData.fechaNacimiento),
            genero: cleanPersonaData.genero,
            telefono1: cleanPersonaData.telefono1 || null,
            telefono2: cleanPersonaData.telefono2 || null,
            email: cleanPersonaData.email || null,
            direccion: cleanPersonaData.direccion || null,
            representanteId: cleanPersonaData.representanteId || null,
        },
    });

    await getOrCreatePaciente(created.id);
    return created.id;
}


// --- NEW: Full Persona Profile ---
export async function getFullPersonaProfile(personaId: number | string) {
    const id = Number(personaId);
    const persona = await prisma.persona.findUnique({ where: { id } });
    if (!persona) return null;

    const titularRow = await prisma.titular.findUnique({
        where: { personaId: id },
        include: { unidadServicio: true },
    });
    const titularInfo = titularRow ? {
        ...titularRow,
        unidadServicio: titularRow.unidadServicio.name,
    } : null;

    const beneficiarioRows = await prisma.beneficiario.findMany({
        where: { personaId: id },
        include: {
            titular: {
                include: { persona: true },
            },
        },
    });
    const beneficiarioInfo = beneficiarioRows.map(b => ({
        ...b,
        titularNombre: buildNombreCompleto(b.titular.persona),
    }));

    const waitlistHistory = await prisma.waitlistEntry.findMany({
        where: { personaId: id },
        orderBy: { checkInTime: 'desc' },
    });

    return {
        persona: enrichPersona(persona),
        titularInfo,
        beneficiarioInfo,
        waitlistHistory,
    };
}

export async function getPersonas(
    query?: string, 
    page: number = 1, 
    pageSize: number = 15, 
    onlyUnlinked: boolean = false
): Promise<{ personas: Persona[], totalCount: number }> {
    let excludedIds: number[] = [];
    
    if (onlyUnlinked) {
        const userPersonas = await prisma.user.findMany({
            where: { personaId: { not: null } },
            select: { personaId: true },
        });
        excludedIds = userPersonas.map(u => u.personaId!).filter(Boolean);
    }

    const baseWhere: any = {};
    if (onlyUnlinked && excludedIds.length > 0) {
        baseWhere.id = { notIn: excludedIds };
    }

    if (query && query.trim().length > 1) {
        const searchQuery = `%${query.trim()}%`;
        
        // Build exclusion clause for raw SQL if needed
        const exclusionClause = onlyUnlinked ? `AND p.id NOT IN (SELECT "personaId" FROM users WHERE "personaId" IS NOT NULL)` : '';

        const countResult = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
            `SELECT COUNT(*) as count FROM personas p
             WHERE 1=1 ${exclusionClause}
             AND (${fullNameSql} ILIKE $1 OR ${fullCedulaSearchSql} ILIKE $2 OR p.email ILIKE $3)`,
            searchQuery, searchQuery, searchQuery
        );
        const totalCount = Number(countResult[0]?.count || 0);

        const offset = (page - 1) * pageSize;
        const rows = await prisma.$queryRawUnsafe<any[]>(
            `SELECT p.* FROM personas p
             WHERE 1=1 ${exclusionClause}
             AND (${fullNameSql} ILIKE $1 OR ${fullCedulaSearchSql} ILIKE $2 OR p.email ILIKE $3)
             ORDER BY p."primerNombre", p."primerApellido"
             LIMIT $4 OFFSET $5`,
            searchQuery, searchQuery, searchQuery, pageSize, offset
        );

        const personas = rows.map((row: any) => enrichPersona({ ...row, fechaNacimiento: new Date(row.fechaNacimiento) }));
        return { personas, totalCount };
    }

    const totalCount = await prisma.persona.count({ where: baseWhere });
    const offset = (page - 1) * pageSize;

    const rows = await prisma.persona.findMany({
        where: baseWhere,
        orderBy: [{ primerNombre: 'asc' }, { primerApellido: 'asc' }],
        skip: offset,
        take: pageSize,
    });

    const personas = rows.map(row => enrichPersona(row));
    return { personas, totalCount };
}

export async function getPersonaById(personaId: string): Promise<Persona | null> {
    const row = await prisma.persona.findUnique({ where: { id: Number(personaId) } });
    if (!row) return null;
    return enrichPersona(row);
}


// --- Titular Actions ---

export async function getTitulares(query?: string, page: number = 1, pageSize: number = 10): Promise<{ titulares: Titular[], totalCount: number }> {
    const offset = (page - 1) * pageSize;

    if (query && query.trim().length > 1) {
        const searchQuery = `%${query.trim()}%`;
        const whereClause = `WHERE ${fullNameSql} ILIKE $1 OR ${fullCedulaSearchSql} ILIKE $2`;

        const countResult = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
            `SELECT COUNT(*) as count FROM titulares t JOIN personas p ON t."personaId" = p.id ${whereClause}`,
            searchQuery, searchQuery
        );
        const totalCount = Number(countResult[0]?.count || 0);

        const rows = await prisma.$queryRawUnsafe<any[]>(
            `SELECT t.id as "titularIdTable", t."personaId", t."unidadServicioId", t."numeroFicha",
             p.*, us.name as "unidadServicioNombre",
             (SELECT COUNT(*) FROM beneficiarios b WHERE b."titularId" = t.id) as "beneficiariosCount"
             FROM titulares t JOIN personas p ON t."personaId" = p.id
             LEFT JOIN unidades_servicio us ON t."unidadServicioId" = us.id
             ${whereClause} ORDER BY p."primerNombre", p."primerApellido" LIMIT $3 OFFSET $4`,
            searchQuery, searchQuery, pageSize, offset
        );

        const titulares = rows.map((row: any) => ({
            id: row.titularIdTable,
            personaId: row.personaId,
            unidadServicio: row.unidadServicioNombre || '',
            unidadServicioId: row.unidadServicioId,
            numeroFicha: row.numeroFicha,
            beneficiariosCount: Number(row.beneficiariosCount),
            persona: enrichPersona(row),
        }));
        return { titulares, totalCount };
    }

    // No-query path: use Prisma Client
    const totalCount = await prisma.titular.count();
    const rows = await prisma.titular.findMany({
        include: {
            persona: true,
            unidadServicio: true,
            _count: { select: { beneficiarios: true } },
        },
        orderBy: { persona: { primerNombre: 'asc' } },
        skip: offset,
        take: pageSize,
    });

    const titulares = rows.map(row => ({
        id: row.id,
        personaId: row.personaId,
        unidadServicio: row.unidadServicio.name,
        unidadServicioId: row.unidadServicioId,
        numeroFicha: row.numeroFicha,
        beneficiariosCount: row._count.beneficiarios,
        persona: enrichPersona(row.persona),
    }));

    return { titulares, totalCount };
}


export async function getTitularById(id: string): Promise<Titular | null> {
    const row = await prisma.titular.findUnique({
        where: { id: Number(id) },
        include: { persona: true, unidadServicio: true },
    });
    if (!row) return null;

    return {
        id: row.id,
        personaId: row.personaId,
        unidadServicio: row.unidadServicio.name,
        unidadServicioId: row.unidadServicioId,
        numeroFicha: row.numeroFicha,
        persona: enrichPersona(row.persona),
    };
}


export async function createTitular(data: {
    persona: Omit<Persona, 'id' | 'fechaNacimiento' | 'nombreCompleto' | 'cedula'> & { fechaNacimiento: Date };
    unidadServicio: string;
    numeroFicha?: string;
} | {
    personaId: string;
    unidadServicio: string;
    numeroFicha?: string;
}) {
    await ensureDataEntryPermission();

    let personaId: number;

    if ('personaId' in data) {
        personaId = Number(data.personaId);
    } else {
        const personaData = { ...data.persona, fechaNacimiento: data.persona.fechaNacimiento.toISOString() };
        personaId = await getOrCreatePersona(personaData as any);
    }

    const existingTitular = await prisma.titular.findUnique({ where: { personaId } });
    if (existingTitular) {
        throw new Error('Esta persona ya tiene el rol de titular.');
    }

    const unidadServicioId = await resolveUnidadServicioId(data.unidadServicio);

    const titular = await prisma.titular.create({
        data: {
            personaId,
            unidadServicioId,
            numeroFicha: data.numeroFicha || null,
        },
    });

    revalidatePath('/dashboard/pacientes');
    return { id: titular.id, personaId };
}

export async function updateTitular(titularId: string, personaId: string, data: Omit<Persona, 'id' | 'fechaNacimiento' | 'nombreCompleto' | 'cedula'> & { fechaNacimiento: Date; unidadServicio: string; representanteId?: string; numeroFicha?: string; }) {
    await ensureDataEntryPermission();

    await updatePersona(personaId, data);

    const unidadServicioId = await resolveUnidadServicioId(data.unidadServicio);

    await prisma.titular.update({
        where: { id: Number(titularId) },
        data: {
            unidadServicioId,
            numeroFicha: data.numeroFicha || null,
        },
    });

    revalidatePath('/dashboard/pacientes');
    revalidatePath(`/dashboard/pacientes/${titularId}/beneficiarios`);
    return { id: titularId };
}


export async function deleteTitular(id: string): Promise<{ success: boolean }> {
    await ensureDataEntryPermission();

    const beneficiaryCount = await prisma.beneficiario.count({ where: { titularId: Number(id) } });
    if (beneficiaryCount > 0) {
        throw new Error('Este titular tiene beneficiarios asociados. Por favor, gestione los beneficiarios primero.');
    }

    await prisma.titular.delete({ where: { id: Number(id) } });

    revalidatePath('/dashboard/pacientes');
    return { success: true };
}


// --- Beneficiary Actions ---

export async function getBeneficiarios(titularId: string): Promise<Beneficiario[]> {
    const rows = await prisma.beneficiario.findMany({
        where: { titularId: Number(titularId) },
        include: { persona: true },
        orderBy: { persona: { primerNombre: 'asc' } },
    });

    return rows.map(row => ({
        id: row.id,
        titularId: row.titularId,
        personaId: row.personaId,
        persona: enrichPersona(row.persona),
    }));
}

export async function getAllBeneficiarios(query?: string): Promise<BeneficiarioConTitular[]> {
    if (query && query.trim().length > 1) {
        const searchQuery = `%${query.trim()}%`;
        const rows = await prisma.$queryRawUnsafe<any[]>(
            `SELECT b.id, b."personaId", b."titularId", p.*,
             ${titularNameSql} as "titularNombre"
             FROM beneficiarios b
             JOIN personas p ON b."personaId" = p.id
             JOIN titulares t ON b."titularId" = t.id
             JOIN personas p_titular ON t."personaId" = p_titular.id
             WHERE ${fullNameSql} ILIKE $1 OR ${fullCedulaSearchSql} ILIKE $2 OR ${titularNameSql} ILIKE $3
             ORDER BY p."primerNombre", p."primerApellido"`,
            searchQuery, searchQuery, searchQuery
        );
        return rows.map((row: any) => ({
            id: row.id,
            personaId: row.personaId,
            titularId: row.titularId,
            titularNombre: row.titularNombre,
            persona: enrichPersona({ ...row, fechaNacimiento: new Date(row.fechaNacimiento) }),
        }));
    }

    // No-query path: use Prisma Client
    const rows = await prisma.beneficiario.findMany({
        include: {
            persona: true,
            titular: { include: { persona: true } },
        },
        orderBy: { persona: { primerNombre: 'asc' } },
    });

    return rows.map(row => ({
        id: row.id,
        personaId: row.personaId,
        titularId: row.titularId,
        titularNombre: buildNombreCompleto(row.titular.persona),
        persona: enrichPersona(row.persona),
    }));
}


export async function createBeneficiario(titularId: string, data: { persona: Omit<Persona, 'id' | 'fechaNacimiento' | 'nombreCompleto' | 'cedula'> & { fechaNacimiento: Date } } | { personaId: string }): Promise<Beneficiario> {
    await ensureDataEntryPermission();
    let personaId: number;

    if ('personaId' in data) {
        const existing = await prisma.beneficiario.findFirst({
            where: { personaId: Number(data.personaId), titularId: Number(titularId) },
        });
        if (existing) {
            throw new Error('Esta persona ya es beneficiaria de este titular.');
        }
        personaId = Number(data.personaId);
    } else {
        const personaData = { ...data.persona, fechaNacimiento: data.persona.fechaNacimiento.toISOString() };
        personaId = await getOrCreatePersona(personaData as any);
    }

    const beneficiario = await prisma.beneficiario.create({
        data: { titularId: Number(titularId), personaId },
        include: { persona: true },
    });

    revalidatePath(`/dashboard/pacientes/${titularId}/beneficiarios`);
    revalidatePath('/dashboard/pacientes');
    revalidatePath('/dashboard/beneficiarios');

    return {
        id: beneficiario.id,
        titularId,
        personaId,
        persona: enrichPersona(beneficiario.persona),
    };
}


export async function updateBeneficiario(beneficiarioId: string, personaId: string, data: Omit<Persona, 'id' | 'fechaNacimiento' | 'nombreCompleto' | 'cedula'> & { fechaNacimiento: Date }): Promise<Beneficiario> {
    await ensureDataEntryPermission();

    await updatePersona(personaId, data as any);

    const beneficiarioRow = await prisma.beneficiario.findUnique({
        where: { id: Number(beneficiarioId) },
        include: { persona: true },
    });

    if (!beneficiarioRow) {
        throw new Error("No se pudo encontrar el beneficiario para actualizar la ruta.");
    }

    revalidatePath(`/dashboard/pacientes/${beneficiarioRow.titularId}/beneficiarios`);
    revalidatePath('/dashboard/beneficiarios');

    return {
        id: beneficiarioId,
        titularId: beneficiarioRow.titularId,
        personaId: personaId,
        persona: enrichPersona(beneficiarioRow.persona),
    };
}

export async function deleteBeneficiario(id: string): Promise<{ success: boolean; titularId: string }> {
    await ensureDataEntryPermission();

    const beneficiario = await prisma.beneficiario.findUnique({
        where: { id: Number(id) },
        select: { titularId: true },
    });
    if (!beneficiario) {
        throw new Error('Beneficiario no encontrado para eliminar');
    }

    await prisma.beneficiario.delete({ where: { id: Number(id) } });

    revalidatePath(`/dashboard/pacientes/${beneficiario.titularId}/beneficiarios`);
    revalidatePath('/dashboard/pacientes');
    revalidatePath('/dashboard/beneficiarios');

    return { success: true, titularId: String(beneficiario.titularId) };
}


// --- Patient Check-in and Search Actions ---

export async function searchPeopleForCheckin(query: string): Promise<SearchResult[]> {
    const searchQuery = `%${query.trim()}%`;
    const hasQuery = query && query.trim().length > 0;

    // Use $queryRawUnsafe for ILIKE fullname search
    let personas: any[];
    if (hasQuery) {
        personas = await prisma.$queryRawUnsafe<any[]>(
            `SELECT p.*, ${fullNameSql} as "nombreCompleto", ${fullCedulaSql} as cedula
             FROM personas p
             WHERE p.id NOT IN (SELECT "personaId" FROM users WHERE "personaId" IS NOT NULL)
             AND (${fullNameSql} ILIKE $1 OR ${fullCedulaSearchSql} ILIKE $2)
             ORDER BY "primerNombre", "primerApellido" LIMIT 50`,
            searchQuery, searchQuery
        );
    } else {
        personas = await prisma.$queryRawUnsafe<any[]>(
            `SELECT p.*, ${fullNameSql} as "nombreCompleto", ${fullCedulaSql} as cedula
             FROM personas p
             WHERE p.id NOT IN (SELECT "personaId" FROM users WHERE "personaId" IS NOT NULL)
             ORDER BY "primerNombre", "primerApellido" LIMIT 50`
        );
    }

    if (personas.length === 0) return [];

    const personaIds = personas.map((p: any) => Number(p.id));

    // Batch load titulares and beneficiarios using Prisma
    const titularesInfo = await prisma.titular.findMany({
        where: { personaId: { in: personaIds } },
        include: { unidadServicio: true },
    });
    const beneficiariosInfo = await prisma.beneficiario.findMany({
        where: { personaId: { in: personaIds } },
        include: { titular: { include: { persona: true } } },
    });

    const titularesMap = new Map(titularesInfo.map(t => [t.personaId, t]));
    const beneficiariosMap = new Map<number, any[]>();
    beneficiariosInfo.forEach(b => {
        if (!beneficiariosMap.has(b.personaId)) {
            beneficiariosMap.set(b.personaId, []);
        }
        beneficiariosMap.get(b.personaId)!.push({
            titularId: b.titularId,
            titularNombre: buildNombreCompleto(b.titular.persona),
        });
    });

    const results: SearchResult[] = personas.map((p: any) => ({
        persona: {
            ...p,
            fechaNacimiento: new Date(p.fechaNacimiento),
        },
        titularInfo: titularesMap.get(p.id) ? {
            id: titularesMap.get(p.id)!.id,
            unidadServicio: titularesMap.get(p.id)!.unidadServicio.name,
        } : undefined,
        beneficiarioDe: beneficiariosMap.get(p.id) || []
    }));

    return results;
}

export async function getAccountTypeByTitularId(titularId: string): Promise<string | null> {
    const row = await prisma.titular.findUnique({
        where: { id: Number(titularId) },
        include: { unidadServicio: true },
    });
    if (row?.unidadServicio) {
        if (["Gerencia General", "Recursos Humanos", "Junta Directiva"].includes(row.unidadServicio.name)) {
            return 'Empleado';
        }
        return 'Afiliado Corporativo';
    }
    return 'Privado';
}

// --- Waitlist Actions ---

async function getOrCreatePaciente(personaId: number | string): Promise<number> {
    const pid = Number(personaId);
    const existing = await prisma.paciente.findUnique({ where: { personaId: pid }, select: { id: true } });
    if (existing) return existing.id;

    const created = await prisma.paciente.create({ data: { personaId: pid } });
    return created.id;
}

export async function getWaitlist(): Promise<Patient[]> {
    const rows = await prisma.waitlistEntry.findMany({
        where: { status: { notIn: ['Completado'] } },
        include: { persona: { select: { fechaNacimiento: true, genero: true } } },
        orderBy: { checkInTime: 'asc' },
    });

    return rows.map((row: any) => ({
        ...row,
        fechaNacimiento: row.persona.fechaNacimiento,
        genero: row.persona.genero,
        isReintegro: !!row.isReintegro,
    }));
}

export async function addPatientToWaitlist(data: Omit<Patient, 'id' | 'pacienteId'>): Promise<Patient> {
    const pacienteId = await getOrCreatePaciente(data.personaId);

    const entry = await prisma.waitlistEntry.create({
        data: {
            personaId: Number(data.personaId),
            pacienteId: pacienteId,
            name: data.name,
            kind: data.kind,
            serviceType: data.serviceType,
            accountType: data.accountType,
            status: data.status,
            checkInTime: data.checkInTime,
            isReintegro: data.isReintegro || false,
        },
    });

    revalidatePath('/dashboard');
    return { ...data, id: entry.id, pacienteId } as any;
}

export async function updatePatientStatus(
    id: string,
    status: PatientStatus,
    rescheduledDateTime?: Date
): Promise<{ success: boolean }> {
    if (status === 'Cancelado') {
        const patient = await prisma.waitlistEntry.findUnique({ where: { id: Number(id) } });
        if (!patient) throw new Error('Paciente en lista de espera no encontrado');
    }

    const updateData: any = { status };
    if (status === 'Pospuesto' && rescheduledDateTime) {
        updateData.checkInTime = rescheduledDateTime;
    }

    await prisma.waitlistEntry.update({
        where: { id: Number(id) },
        data: updateData,
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/sala-de-espera');
    revalidatePath('/dashboard/consulta');
    return { success: true };
}

export async function removePatientFromWaitlist(id: string): Promise<{ success: boolean }> {
    await prisma.waitlistEntry.delete({
        where: { id: Number(id) },
    });
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/sala-de-espera');
    return { success: true };
}


// --- EHR Actions ---

async function parseConsultation(row: any): Promise<Consultation | null> {
    if (!row) return null;
    const { fum, ...restOfGineco } = row.antecedentesGinecoObstetricos ? JSON.parse(row.antecedentesGinecoObstetricos) : {};

    const diagnoses = await prisma.consultationDiagnosis.findMany({
        where: { consultationId: row.id },
        select: { cie10Code: true, cie10Description: true },
    });
    const documents = await prisma.consultationDocument.findMany({
        where: { consultationId: row.id },
        orderBy: { uploadedAt: 'asc' },
    });

    const orderRow = await prisma.treatmentOrder.findFirst({ where: { consultationId: row.id } });
    let treatmentOrder: TreatmentOrder | undefined = undefined;
    if (orderRow) {
        const items = await prisma.treatmentOrderItem.findMany({ where: { treatmentOrderId: orderRow.id } });
        treatmentOrder = { ...orderRow, items: items as any[], createdAt: new Date(orderRow.createdAt) } as any;
    }

    const invoiceRow = await prisma.invoice.findFirst({ where: { consultationId: row.id } });
    let invoice: Invoice | undefined = undefined;
    if (invoiceRow) {
        const items = await prisma.invoiceItem.findMany({ where: { invoiceId: invoiceRow.id } });
        invoice = { ...invoiceRow, items: items as any[], createdAt: new Date(invoiceRow.createdAt) } as any;
    }

    // Load paciente + persona + waitlist info via raw query for computed fields
    const pacienteRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT p.*, w."serviceType", w."accountType", w.kind, w.name,
         CASE WHEN w.kind = 'beneficiario' THEN 'Beneficiario' ELSE COALESCE(w."accountType", 'Privado') END as departamento,
         ${fullNameSql} as "nombreCompleto", ${fullCedulaSql} as cedula
         FROM pacientes pac
         JOIN personas p ON pac."personaId" = p.id
         JOIN waitlist w ON pac.id = w."pacienteId"
         WHERE pac.id = $1`,
        row.pacienteId
    );
    const pacienteRow = pacienteRows[0];

    const paciente = {
        ...pacienteRow,
        fechaNacimiento: pacienteRow ? new Date(pacienteRow.fechaNacimiento) : undefined,
    };

    return {
        ...row,
        paciente,
        consultationDate: new Date(row.consultationDate),
        motivoConsulta: row.motivoConsulta ? JSON.parse(row.motivoConsulta) : undefined,
        signosVitales: row.signosVitales ? JSON.parse(row.signosVitales) : undefined,
        antecedentesPersonales: row.antecedentesPersonales ? JSON.parse(row.antecedentesPersonales) : undefined,
        antecedentesGinecoObstetricos: row.antecedentesGinecoObstetricos ? { ...restOfGineco, fum: fum ? new Date(fum) : undefined } : undefined,
        antecedentesPediatricos: row.antecedentesPediatricos ? JSON.parse(row.antecedentesPediatricos) : undefined,
        diagnoses,
        documents: documents.map((d: any) => ({ ...d, uploadedAt: new Date(d.uploadedAt) })),
        treatmentOrder,
        invoice,
    };
}


export async function getPatientHistory(personaId: string): Promise<HistoryEntry[]> {
    const pid = Number(personaId);

    const consultationsRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT c.* FROM consultations c
         JOIN pacientes pac ON c."pacienteId" = pac.id
         WHERE pac."personaId" = $1
         ORDER BY c."consultationDate" DESC`,
        pid
    );

    const consultations: HistoryEntry[] = [];
    if (consultationsRows) {
        for (const row of consultationsRows) {
            const parsedConsultation = await parseConsultation(row);
            if (parsedConsultation) {
                consultations.push({
                    type: 'consultation' as const,
                    data: parsedConsultation
                });
            }
        }
    }

    const labOrdersRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT lo.*, c."treatmentPlan", (SELECT string_agg("cie10Description", '; ') FROM consultation_diagnoses WHERE "consultationId" = lo."consultationId") as "diagnosticoPrincipal"
         FROM lab_orders lo
         JOIN pacientes pac ON lo."pacienteId" = pac.id
         JOIN consultations c ON lo."consultationId" = c.id
         WHERE pac."personaId" = $1
         ORDER BY lo."orderDate" DESC`,
        pid
    );

    const labOrders: HistoryEntry[] = [];
    if (labOrdersRows) {
        for (const orderRow of labOrdersRows as any[]) {
            const items = await prisma.labOrderItem.findMany({
                where: { labOrderId: orderRow.id },
                select: { testName: true },
            });
            const personaRows = await prisma.$queryRawUnsafe<any[]>(
                `SELECT p.*, ${fullNameSql} as "nombreCompleto", ${fullCedulaSql} as cedula,
                 w.kind,
                 CASE WHEN w.kind = 'beneficiario' THEN 'Beneficiario' ELSE COALESCE(w."accountType", 'Privado') END as departamento,
                 COALESCE(w."accountType", 'Privado') as "accountType"
                 FROM personas p
                 LEFT JOIN waitlist w ON p.id = w."personaId" AND w.status = 'Completado'
                 WHERE p.id = $1
                 ORDER BY w."checkInTime" DESC LIMIT 1`,
                pid
            );
            const persona = personaRows[0];
            labOrders.push({
                type: 'lab_order' as const,
                data: {
                    ...orderRow,
                    orderDate: new Date(orderRow.orderDate),
                    tests: items.map(i => i.testName),
                    paciente: {
                        ...persona,
                        fechaNacimiento: persona ? new Date(persona.fechaNacimiento) : undefined,
                    } as any,
                    diagnosticoPrincipal: orderRow.diagnosticoPrincipal,
                    treatmentPlan: orderRow.treatmentPlan
                } as any
            });
        }
    }


    const allHistory = [...consultations, ...labOrders];

    allHistory.sort((a, b) => {
        const dateA = a.type === 'consultation' ? a.data.consultationDate : a.data.orderDate;
        const dateB = b.type === 'consultation' ? b.data.consultationDate : b.data.orderDate;
        return dateB.getTime() - dateA.getTime();
    });

    return allHistory;
}


export async function createConsultation(data: CreateConsultationInput): Promise<Consultation> {
    const session = await getSession();
    const user = session.user;
    if (!user) {
        throw new Error('Acción no autorizada. Debe iniciar sesión.');
    }
    const roleId = Number(user.role.id);
    const roleName = user.role.name;
    const allowedClinicalRoles = [1, 4, 5, 6]; // Superusuario, Enfermera, Pediatra, Familiar

    if (!allowedClinicalRoles.includes(roleId) && roleName !== 'Superusuario') {
        throw new Error('Acción no autorizada. Se requiere rol de doctor, enfermera o superusuario.');
    }
    
    const isNurse = roleId === 4 || roleName === 'Enfermera';

    const consultationDate = new Date();

    const consultation = await prisma.$transaction(async (tx) => {
        // Look for existing consultation for this waitlist entry
        const existing = await tx.consultation.findFirst({
            where: { waitlistId: Number(data.waitlistId) }
        });

        // Find or create Doctor record for this user if they are clinical staff
        let doctorId: number | undefined;
        const dbUser = await prisma.user.findUnique({
            where: { id: Number(user.id) },
            include: { 
                role: true,
                persona: {
                    include: { doctor: true }
                }
            }
        });

        if (dbUser?.persona?.doctor) {
            doctorId = dbUser.persona.doctor.id;
        } else if (dbUser && dbUser.role.hasSpecialty) {
            let personaId = dbUser.personaId;
            if (!personaId) {
                const names = (dbUser.name || dbUser.username).split(' ');
                const primerNombre = names[0] || 'Médico';
                const primerApellido = names[1] || 'Asociado';
                const newPersona = await prisma.persona.create({
                    data: {
                        primerNombre,
                        primerApellido,
                        fechaNacimiento: new Date(1980, 0, 1),
                        genero: 'Masculino',
                    }
                });
                personaId = newPersona.id;
                await prisma.user.update({
                    where: { id: dbUser.id },
                    data: { personaId }
                });
            }

            const newDoctor = await prisma.doctor.create({
                data: {
                    personaId: personaId,
                    // specialtyId: dbUser.specialtyId, // SpecialtyId is no longer on User
                }
            });
            doctorId = newDoctor.id;
        }

        const consultationData: any = {
            pacienteId: Number(data.pacienteId),
            waitlistId: data.waitlistId ? Number(data.waitlistId) : undefined,
            consultationDate,
            motivoConsulta: data.motivoConsulta ? JSON.stringify(data.motivoConsulta) : undefined,
            enfermedadActual: data.enfermedadActual || undefined,
            enfermedadActualNinguno: data.enfermedadActualNinguno ?? false,
            revisionPorSistemas: data.revisionPorSistemas || undefined,
            revisionPorSistemasNinguno: data.revisionPorSistemasNinguno ?? false,
            antecedentesPersonales: data.antecedentesPersonales ? JSON.stringify(data.antecedentesPersonales) : undefined,
            antecedentesFamiliares: data.antecedentesFamiliares || undefined,
            antecedentesGinecoObstetricos: data.antecedentesGinecoObstetricos ? JSON.stringify(data.antecedentesGinecoObstetricos) : undefined,
            antecedentesPediatricos: data.antecedentesPediatricos ? JSON.stringify(data.antecedentesPediatricos) : undefined,
            signosVitales: data.signosVitales ? JSON.stringify(data.signosVitales) : undefined,
            examenFisicoGeneral: data.examenFisicoGeneral || undefined,
            treatmentPlan: data.treatmentPlan || undefined,
            treatmentPlanNotApplicable: data.treatmentPlanNotApplicable ?? false,
            diagnosticoLibre: data.diagnosticoLibre || undefined,
            diagnosticoLibreNinguno: data.diagnosticoLibreNinguno ?? false,
            radiologyOrders: data.radiologyOrder || undefined,
            reposo: data.reposo || undefined,
            isReintegro: data.isReintegro || false,
            occupationalReferral: data.occupationalReferral ? JSON.stringify(data.occupationalReferral) : undefined,
            doctorName: user.name || user.username,
            doctorId: doctorId,
        };

        const created = existing 
            ? await tx.consultation.update({ where: { id: existing.id }, data: consultationData })
            : await tx.consultation.create({ data: consultationData });

        if (data.diagnoses && data.diagnoses.length > 0) {
            // If updating, we might want to clear old diagnoses, or just add. 
            // For a "partial" to "final" transition, doctors will add diagnoses.
            if (existing) {
                await tx.consultationDiagnosis.deleteMany({ where: { consultationId: existing.id } });
            }
            for (const diagnosis of data.diagnoses) {
                await tx.consultationDiagnosis.create({
                    data: { consultationId: created.id, cie10Code: diagnosis.cie10Code, cie10Description: diagnosis.cie10Description },
                });
            }
        }

        if (data.documents && data.documents.length > 0) {
            for (const doc of data.documents) {
                await tx.consultationDocument.create({
                    data: {
                        consultationId: created.id,
                        fileName: doc.fileName,
                        fileType: doc.fileType,
                        documentType: doc.documentType,
                        description: doc.description,
                        fileData: doc.fileData,
                        uploadedAt: new Date(),
                    },
                });
            }
        }

        if (data.treatmentItems) {
            // Remove any draft treatment orders for this consultation before creating final one
            await tx.treatmentOrder.deleteMany({ 
                where: { consultationId: created.id, status: 'Pendiente' } 
            });

            if (data.treatmentItems.length > 0) {
                const order = await tx.treatmentOrder.create({
                    data: {
                        pacienteId: Number(data.pacienteId),
                        consultationId: created.id,
                        status: 'Pendiente',
                        createdAt: new Date(),
                    },
                });

                for (const item of data.treatmentItems) {
                    await tx.treatmentOrderItem.create({
                        data: {
                            treatmentOrderId: order.id,
                            medicamentoProcedimiento: item.medicamentoProcedimiento,
                            dosis: item.dosis,
                            via: item.via,
                            frecuencia: item.frecuencia,
                            duracion: item.duracion,
                            instrucciones: item.instrucciones,
                            status: item.requiereAplicacionInmediata ? 'Pendiente' : 'Solo Récipe',
                        },
                    });
                }
            }
        }

        // Check for active survey
        const activeSurvey = await tx.survey.findFirst({ where: { isActive: true } });
        if (activeSurvey) {
            await tx.surveyInvitation.create({
                data: {
                    consultationId: created.id,
                    surveyId: activeSurvey.id,
                    createdAt: new Date(),
                },
            });
        }

        // Update waitlist entry status
        // If nurse is doing intake, keep it "En Consulta" or set it if it was "Esperando"
        // If it's a doctor (or anyone else with clinical access), mark as "Completado"
        await tx.waitlistEntry.update({
            where: { id: Number(data.waitlistId) },
            data: { status: isNurse ? 'En Consulta' : 'Completado' },
        });

        // Lab Orders
        if (data.labOrders && data.labOrders.length > 0) {
            const order = await tx.labOrder.create({
                data: {
                    pacienteId: Number(data.pacienteId),
                    consultationId: consultation.id,
                    status: 'Pendiente'
                }
            });

            for (const testName of data.labOrders) {
                await tx.labOrderItem.create({
                    data: {
                        labOrderId: order.id,
                        testName,
                        status: 'Pendiente'
                    }
                });
            }
        }

        return created;
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/hce');
    revalidatePath('/dashboard/bitacora');
    revalidatePath('/dashboard/lista-pacientes');
    revalidatePath('/dashboard/sala-de-espera');

    const createdConsultationRaw = await prisma.consultation.findUnique({ 
        where: { id: consultation.id },
        include: {
            paciente: { include: { persona: true } },
            diagnoses: true,
            treatmentOrders: { include: { items: true } },
            doctor: { include: { persona: true } }
        }
    });
    const createdConsultation = enrichConsultation(createdConsultationRaw);

    if (!createdConsultation) {
        throw new Error('Failed to retrieve the created consultation after saving.');
    }

    return createdConsultation;
}

/**
 * Saves a partial consultation draft to the database.
 * This is used for real-time sync between nursing and doctors.
 * It DOES NOT complete the consultation or change waitlist status.
 */
export async function saveConsultationDraft(data: Partial<CreateConsultationInput> & { labOrders?: string[] }) {
    const session = await getSession();
    const user = session.user;
    if (!user) throw new Error('No autorizado');
    
    if (!data.waitlistId) throw new Error('WaitlistId es requerido para guardar borrador.');

    return await prisma.$transaction(async (tx) => {
        const existing = await tx.consultation.findFirst({
            where: { waitlistId: Number(data.waitlistId) }
        });

        const consultationData: any = {
            pacienteId: Number(data.pacienteId),
            waitlistId: Number(data.waitlistId),
            motivoConsulta: data.motivoConsulta ? JSON.stringify(data.motivoConsulta) : undefined,
            enfermedadActual: data.enfermedadActual || undefined,
            enfermedadActualNinguno: data.enfermedadActualNinguno ?? undefined,
            revisionPorSistemas: data.revisionPorSistemas || undefined,
            revisionPorSistemasNinguno: data.revisionPorSistemasNinguno ?? undefined,
            antecedentesPersonales: data.antecedentesPersonales ? JSON.stringify(data.antecedentesPersonales) : undefined,
            antecedentesFamiliares: data.antecedentesFamiliares || undefined,
            antecedentesGinecoObstetricos: data.antecedentesGinecoObstetricos ? JSON.stringify(data.antecedentesGinecoObstetricos) : undefined,
            antecedentesPediatricos: data.antecedentesPediatricos ? JSON.stringify(data.antecedentesPediatricos) : undefined,
            signosVitales: data.signosVitales ? JSON.stringify(data.signosVitales) : undefined,
            examenFisicoGeneral: data.examenFisicoGeneral || undefined,
            treatmentPlan: data.treatmentPlan || undefined,
            treatmentPlanNotApplicable: data.treatmentPlanNotApplicable ?? undefined,
            radiologyOrders: data.radiologyOrder || undefined,
            reposo: data.reposo || undefined,
            diagnosticoLibre: data.diagnosticoLibre || undefined,
            diagnosticoLibreNinguno: data.diagnosticoLibreNinguno ?? undefined,
        };

        if (existing) {
            const { pacienteId, waitlistId, ...updateData } = consultationData;
            const updated = await tx.consultation.update({ where: { id: existing.id }, data: updateData });
            
            // Sync Diagnoses in Draft
            if (data.diagnoses) {
                await tx.consultationDiagnosis.deleteMany({ where: { consultationId: updated.id } });
                for (const diagnosis of data.diagnoses) {
                    await tx.consultationDiagnosis.create({
                        data: { consultationId: updated.id, cie10Code: diagnosis.cie10Code, cie10Description: diagnosis.cie10Description },
                    });
                }
            }

            // Sync Treatment Items in Draft
            if (data.treatmentItems) {
                // Delete existing draft orders
                await tx.treatmentOrder.deleteMany({ 
                    where: { consultationId: updated.id, status: 'Pendiente' } 
                });

                if (data.treatmentItems.length > 0) {
                    const order = await tx.treatmentOrder.create({
                        data: {
                            pacienteId: Number(data.pacienteId),
                            consultationId: updated.id,
                            status: 'Pendiente',
                            createdAt: new Date(),
                        },
                    });

                    for (const item of data.treatmentItems) {
                        await tx.treatmentOrderItem.create({
                            data: {
                                treatmentOrderId: order.id,
                                medicamentoProcedimiento: item.medicamentoProcedimiento,
                                dosis: item.dosis,
                                via: item.via,
                                frecuencia: item.frecuencia,
                                duracion: item.duracion,
                                instrucciones: item.instrucciones,
                                status: item.requiereAplicacionInmediata ? 'Pendiente' : 'Solo Récipe',
                            },
                        });
                    }
                }
            }
            // Sync Lab Orders in Draft
            if (data.labOrders) {
                // Delete existing draft lab orders and their items
                const existingOrders = await tx.labOrder.findMany({
                    where: { consultationId: updated.id, status: 'Pendiente' }
                });
                for (const order of existingOrders) {
                    await tx.labOrderItem.deleteMany({ where: { labOrderId: order.id } });
                }
                await tx.labOrder.deleteMany({ 
                    where: { consultationId: updated.id, status: 'Pendiente' } 
                });

                if (data.labOrders.length > 0) {
                    const order = await tx.labOrder.create({
                        data: {
                            pacienteId: Number(data.pacienteId),
                            consultationId: updated.id,
                            status: 'Pendiente'
                        },
                    });

                    for (const testName of data.labOrders) {
                        await tx.labOrderItem.create({
                            data: {
                                labOrderId: order.id,
                                testName,
                                status: 'Pendiente'
                            }
                        });
                    }
                }
            }
            return updated;
        } else {
            const created = await tx.consultation.create({ 
                data: {
                    ...consultationData,
                    doctorName: user.name || user.username,
                } 
            });

            // Initial Diagnoses
            if (data.diagnoses && data.diagnoses.length > 0) {
                for (const diagnosis of data.diagnoses) {
                    await tx.consultationDiagnosis.create({
                        data: { consultationId: created.id, cie10Code: diagnosis.cie10Code, cie10Description: diagnosis.cie10Description },
                    });
                }
            }

            // Initial Treatment Items
            if (data.treatmentItems && data.treatmentItems.length > 0) {
                const order = await tx.treatmentOrder.create({
                    data: {
                        pacienteId: Number(data.pacienteId),
                        consultationId: created.id,
                        status: 'Pendiente',
                        createdAt: new Date(),
                    },
                });

                for (const item of data.treatmentItems) {
                    await tx.treatmentOrderItem.create({
                        data: {
                            treatmentOrderId: order.id,
                            medicamentoProcedimiento: item.medicamentoProcedimiento,
                            dosis: item.dosis,
                            via: item.via,
                            frecuencia: item.frecuencia,
                            duracion: item.duracion,
                            instrucciones: item.instrucciones,
                            status: item.requiereAplicacionInmediata ? 'Pendiente' : 'Solo Récipe',
                        },
                    });
                }
            }
            // Sync Lab Orders in New Draft
            if (data.labOrders && data.labOrders.length > 0) {
                const order = await tx.labOrder.create({
                    data: {
                        pacienteId: Number(data.pacienteId),
                        consultationId: created.id,
                        status: 'Pendiente'
                    },
                });

                for (const testName of data.labOrders) {
                    await tx.labOrderItem.create({
                        data: {
                            labOrderId: order.id,
                            testName,
                            status: 'Pendiente'
                        }
                    });
                }
            }

            return created;
        }
    });
}


// --- Company Actions (Largely unchanged) ---

export async function getEmpresas(query?: string, page: number = 1, pageSize: number = 10): Promise<{ empresas: Empresa[], totalCount: number }> {
    const where: any = {};
    if (query && query.trim().length > 1) {
        where.OR = [
            { name: { contains: query.trim(), mode: 'insensitive' } },
            { rif: { contains: query.trim(), mode: 'insensitive' } },
        ];
    }

    const totalCount = await prisma.empresa.count({ where });
    const offset = (page - 1) * pageSize;
    const empresas = await prisma.empresa.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: offset,
        take: pageSize,
    });

    return { empresas, totalCount };
}

export async function createEmpresa(data: Omit<Empresa, 'id'>): Promise<Empresa> {
    await ensureDataEntryPermission();
    const empresa = await prisma.empresa.create({
        data: { name: data.name, rif: data.rif, telefono: data.telefono, direccion: data.direccion },
    });
    revalidatePath('/dashboard/empresas');
    revalidatePath('/dashboard/pacientes');
    return empresa;
}

export async function updateEmpresa(data: Empresa): Promise<Empresa> {
    await ensureAdminPermission();
    const updated = await prisma.empresa.update({
        where: { id: Number(data.id) },
        data: { name: data.name, rif: data.rif, telefono: data.telefono, direccion: data.direccion },
    });
    revalidatePath('/dashboard/empresas');
    revalidatePath('/dashboard/pacientes');
    return updated;
}

export async function deleteEmpresa(id: string): Promise<{ success: boolean }> {
    await ensureAdminPermission();
    await prisma.empresa.delete({ where: { id: Number(id) } });
    revalidatePath('/dashboard/empresas');
    revalidatePath('/dashboard/pacientes');
    return { success: true };
}

// --- Central Person Management Actions ---

export async function createPersona(data: Omit<Persona, 'id' | 'fechaNacimiento' | 'nombreCompleto' | 'cedula' | 'createdAt'> & { fechaNacimiento: Date, representanteId?: string }): Promise<string> {
    await ensureDataEntryPermission();

    const age = calculateAge(data.fechaNacimiento);
    if (age < 18 && !data.cedulaNumero && !data.representanteId) {
        throw new Error('Un menor de edad sin cédula debe tener un representante asignado.');
    }

    if (data.nacionalidad && data.cedulaNumero) {
        const existing = await prisma.persona.findFirst({
            where: { nacionalidad: data.nacionalidad, cedulaNumero: data.cedulaNumero },
        });
        if (existing) {
            throw new Error('Ya existe una persona con esa cédula.');
        }
    }

    const persona = await prisma.persona.create({
        data: {
            primerNombre: data.primerNombre,
            segundoNombre: data.segundoNombre || null,
            primerApellido: data.primerApellido,
            segundoApellido: data.segundoApellido || null,
            nacionalidad: data.nacionalidad || null,
            cedulaNumero: data.cedulaNumero || null,
            fechaNacimiento: data.fechaNacimiento,
            genero: data.genero,
            telefono1: data.telefono1 || null,
            telefono2: data.telefono2 || null,
            email: data.email || null,
            direccion: data.direccion || null,
            representanteId: data.representanteId ? Number(data.representanteId) : null,
        },
    });

    await getOrCreatePaciente(persona.id);
    revalidatePath('/dashboard/personas');
    return String(persona.id);
}

export async function bulkCreatePersonas(
    personasData: (Omit<Persona, 'id' | 'fechaNacimiento' | 'nombreCompleto'> & { fechaNacimiento: string })[]
): Promise<{ imported: number; skipped: number; errors: string[] }> {
    await ensureDataEntryPermission();
    let importedCount = 0;
    let skippedCount = 0;
    const errorMessages: string[] = [];
    const seenInBatch = new Set<string>();

    for (const [index, data] of personasData.entries()) {
        const missingFields = [];
        if (!data.primerNombre) missingFields.push('primer nombre');
        if (!data.primerApellido) missingFields.push('primer apellido');
        if (!data.fechaNacimiento) missingFields.push('fecha de nacimiento');
        if (!data.genero) missingFields.push('género');

        const personName = `${data.primerNombre} ${data.primerApellido}`.trim() || `Fila ${index + 1}`;

        if (missingFields.length > 0) {
            skippedCount++;
            errorMessages.push(`${personName}: Faltan campos requeridos (${missingFields.join(', ')}).`);
            continue;
        }

        const { cedula: cedulaCompleta } = data;
        let nacionalidad: string | null = null;
        let cedulaNumero: string | null = null;

        if (cedulaCompleta) {
            const parts = cedulaCompleta.split('-');
            if (parts.length === 2 && (parts[0] === 'V' || parts[0] === 'E') && /^\d+$/.test(parts[1])) {
                nacionalidad = parts[0];
                cedulaNumero = parts[1];
            } else {
                nacionalidad = 'V';
                cedulaNumero = cedulaCompleta;
            }
        }

        const isoDate = parseDateToIso(data.fechaNacimiento);

        if (!isoDate) {
            skippedCount++;
            errorMessages.push(`${personName}: Fecha '${data.fechaNacimiento}' inválida. Use DD/MM/AAAA.`);
            continue;
        }

        if (nacionalidad && cedulaNumero) {
            const existingPersona = await prisma.persona.findFirst({
                where: { nacionalidad, cedulaNumero },
                select: { id: true },
            });
            if (existingPersona) {
                await prisma.persona.update({
                    where: { id: existingPersona.id },
                    data: {
                        primerNombre: data.primerNombre,
                        segundoNombre: data.segundoNombre || null,
                        primerApellido: data.primerApellido,
                        segundoApellido: data.segundoApellido || null,
                        fechaNacimiento: new Date(isoDate),
                        genero: data.genero,
                        telefono1: data.telefono1 || null,
                        telefono2: data.telefono2 || null,
                        email: data.email || null,
                        direccion: data.direccion || null,
                    },
                });
                importedCount++;
                continue;
            }

            const batchKey = `${nacionalidad}-${cedulaNumero}`;
            if (seenInBatch.has(batchKey)) {
                skippedCount++;
                errorMessages.push(`${personName}: Duplicado dentro del archivo (Cédula ${nacionalidad}-${cedulaNumero}).`);
                continue;
            }
            seenInBatch.add(batchKey);
        }

        const persona = await prisma.persona.create({
            data: {
                primerNombre: data.primerNombre,
                segundoNombre: data.segundoNombre || null,
                primerApellido: data.primerApellido,
                segundoApellido: data.segundoApellido || null,
                nacionalidad: nacionalidad,
                cedulaNumero: cedulaNumero,
                fechaNacimiento: new Date(isoDate),
                genero: data.genero,
                telefono1: data.telefono1 || null,
                telefono2: data.telefono2 || null,
                email: data.email || null,
                direccion: data.direccion || null,
            },
        });

        await getOrCreatePaciente(persona.id);
        importedCount++;
    }

    revalidatePath('/dashboard/personas');
    return { imported: importedCount, skipped: skippedCount, errors: errorMessages };
}

export async function bulkCreateTitulares(
    titularesData: any[]
): Promise<{ imported: number; skipped: number; errors: string[] }> {
    await ensureDataEntryPermission();
    let importedCount = 0;
    let skippedCount = 0;
    const errorMessages: string[] = [];
    const seenInBatch = new Set<string>();

    try {
        await prisma.$transaction(async (tx) => {
            for (const [index, row] of titularesData.entries()) {
                const data = {
                    primerNombre: row.primerNombre || row['Primer Nombre'],
                    segundoNombre: row.segundoNombre || row['Segundo Nombre'],
                    primerApellido: row.primerApellido || row['Primer Apellido'],
                    segundoApellido: row.segundoApellido || row['Segundo Apellido'],
                    nacionalidad: row.nacionalidad || row['Nacionalidad'],
                    cedulaNumero: String(row.cedulaNumero || row['Cédula'] || ''),
                    fechaNacimiento: row.fechaNacimiento || row['Fecha de Nacimiento'],
                    genero: row.genero || row['Género'],
                    unidadServicio: row.unidadServicio || row['Unidad/Servicio'],
                    numeroFicha: row.numeroFicha || row['Número de Ficha'] || row['Ficha'],
                    telefono1: row.telefono1 || row['Teléfono 1'],
                    telefono2: row.telefono2 || row['Teléfono 2'],
                    email: row.email || row['Email'],
                    direccion: row.direccion || row['Dirección']
                };

                const personName = `${data.primerNombre} ${data.primerApellido}`.trim() || `Fila ${index + 1}`;

                const missingFields = [];
                if (!data.primerNombre) missingFields.push('primer nombre');
                if (!data.primerApellido) missingFields.push('primer apellido');
                if (!data.fechaNacimiento) missingFields.push('fecha de nacimiento');
                if (!data.genero) missingFields.push('género');
                if (!data.unidadServicio) missingFields.push('unidad/servicio');

                if (missingFields.length > 0) {
                    skippedCount++;
                    errorMessages.push(`${personName}: Faltan campos requeridos (${missingFields.join(', ')}).`);
                    continue;
                }

                let nacionalidad = 'V';
                let cedulaNumero = data.cedulaNumero.trim();

                if (cedulaNumero.includes('-')) {
                    const parts = cedulaNumero.split('-');
                    if ((parts[0] === 'V' || parts[0] === 'E') && /^\d+$/.test(parts[1])) {
                        nacionalidad = parts[0];
                        cedulaNumero = parts[1];
                    } else {
                        cedulaNumero = cedulaNumero.replace(/\D/g, '');
                    }
                } else {
                    cedulaNumero = cedulaNumero.replace(/\D/g, '');
                }

                const isoDate = parseDateToIso(data.fechaNacimiento);

                if (!isoDate) {
                    skippedCount++;
                    errorMessages.push(`${personName}: Fecha '${data.fechaNacimiento}' inválida. Use DD/MM/AAAA.`);
                    continue;
                }

                if (cedulaNumero) {
                    const batchKey = `${nacionalidad}-${cedulaNumero}`;
                    if (seenInBatch.has(batchKey)) {
                        skippedCount++;
                        errorMessages.push(`${personName}: Duplicado dentro del archivo (Cédula ${batchKey}).`);
                        continue;
                    }
                    seenInBatch.add(batchKey);

                    const existingPersona = await tx.persona.findFirst({
                        where: { nacionalidad, cedulaNumero }
                    });
                    
                    let personaId: number;

                    if (existingPersona) {
                        personaId = existingPersona.id;
                        
                        await tx.persona.update({
                            where: { id: personaId },
                            data: {
                                primerNombre: data.primerNombre,
                                segundoNombre: data.segundoNombre || null,
                                primerApellido: data.primerApellido,
                                segundoApellido: data.segundoApellido || null,
                                fechaNacimiento: new Date(isoDate),
                                genero: data.genero,
                                telefono1: data.telefono1 || null,
                                telefono2: data.telefono2 || null,
                                email: data.email || null,
                                direccion: data.direccion || null,
                            }
                        });

                        const existingTitular = await tx.titular.findUnique({
                            where: { personaId: personaId }
                        });
                        if (existingTitular) {
                            const unidadServicioId = await resolveUnidadServicioId(data.unidadServicio);
                            await tx.titular.update({
                                where: { id: existingTitular.id },
                                data: {
                                    unidadServicioId: unidadServicioId,
                                    numeroFicha: data.numeroFicha ? String(data.numeroFicha) : null,
                                }
                            });
                            importedCount++;
                            continue;
                        }
                    } else {
                        const createdPersona = await tx.persona.create({
                            data: {
                                primerNombre: data.primerNombre,
                                segundoNombre: data.segundoNombre || null,
                                primerApellido: data.primerApellido,
                                segundoApellido: data.segundoApellido || null,
                                nacionalidad,
                                cedulaNumero,
                                fechaNacimiento: new Date(isoDate),
                                genero: data.genero,
                                telefono1: data.telefono1 || null,
                                telefono2: data.telefono2 || null,
                                email: data.email || null,
                                direccion: data.direccion || null,
                            }
                        });
                        personaId = createdPersona.id;
                        
                        // Ensure they are also in the patients table
                        const existingPaciente = await tx.paciente.findUnique({ where: { personaId } });
                        if (!existingPaciente) {
                            await tx.paciente.create({ data: { personaId } });
                        }
                    }

                    const unidadServicioId = await resolveUnidadServicioId(data.unidadServicio);
                    await tx.titular.create({
                        data: {
                            personaId: personaId,
                            unidadServicioId: unidadServicioId,
                            numeroFicha: data.numeroFicha ? String(data.numeroFicha) : null,
                        }
                    });
                    
                    importedCount++;
                } else {
                    skippedCount++;
                    errorMessages.push(`${personName}: Cédula es requerida para el proceso de importación masiva.`);
                }
            }
        });

        revalidatePath('/dashboard/pacientes');
        return { imported: importedCount, skipped: skippedCount, errors: errorMessages };
    } catch (error: any) {
        console.error("Error bulk creating titulares:", error);
        throw new Error(`Error masivo al insertar titulares: ${error.message || 'Error desconocido'}.`);
    }
}


export async function updatePersona(personaId: string, data: Omit<Persona, 'id' | 'fechaNacimiento' | 'nombreCompleto' | 'cedula'> & { fechaNacimiento: Date; representanteId?: string; }) {
    await ensureDataEntryPermission();

    const age = calculateAge(data.fechaNacimiento);
    if (age < 18 && !data.cedulaNumero && !data.representanteId) {
        throw new Error('Un menor de edad sin cédula debe tener un representante asignado.');
    }

    if (data.nacionalidad && data.cedulaNumero) {
        const existing = await prisma.persona.findFirst({
            where: {
                nacionalidad: data.nacionalidad,
                cedulaNumero: data.cedulaNumero,
                id: { not: Number(personaId) },
            },
        });
        if (existing) {
            throw new Error('Ya existe otra persona con la misma cédula.');
        }
    }

    const updated = await prisma.persona.update({
        where: { id: Number(personaId) },
        data: {
            primerNombre: data.primerNombre,
            segundoNombre: data.segundoNombre || null,
            primerApellido: data.primerApellido,
            segundoApellido: data.segundoApellido || null,
            nacionalidad: data.nacionalidad || null,
            cedulaNumero: data.cedulaNumero || null,
            fechaNacimiento: data.fechaNacimiento,
            genero: data.genero,
            telefono1: data.telefono1 || null,
            telefono2: data.telefono2 || null,
            email: data.email || null,
            direccion: data.direccion || null,
            representanteId: data.representanteId ? Number(data.representanteId) : null,
        },
    });

    revalidatePath('/dashboard/personas');
    revalidatePath('/dashboard/pacientes');
    revalidatePath('/dashboard/beneficiarios');
    revalidatePath('/dashboard/lista-pacientes');
    revalidatePath('/dashboard/bitacora');

    return enrichPersona(updated);
}


export async function deletePersona(personaId: string): Promise<{ success: boolean }> {
    await ensureDataEntryPermission();
    const pid = Number(personaId);

    const titular = await prisma.titular.findUnique({ where: { personaId: pid } });
    if (titular) {
        const beneficiaryCount = await prisma.beneficiario.count({ where: { titularId: titular.id } });
        if (beneficiaryCount > 0) {
            throw new Error('No se puede eliminar esta persona porque es un titular con beneficiarios asociados. Por favor, gestione los beneficiarios primero desde el módulo de Titulares.');
        }
    }

    await prisma.persona.delete({ where: { id: pid } });

    revalidatePath('/dashboard/personas');
    revalidatePath('/dashboard/pacientes');
    revalidatePath('/dashboard/beneficiarios');
    revalidatePath('/dashboard/lista-pacientes');
    revalidatePath('/dashboard/bitacora');

    return { success: true };
}


// --- CIE-10 Actions ---
export async function getManagedCie10Codes(
    query?: string,
    page?: number,
    pageSize?: number
): Promise<{ codes: Cie10Code[]; totalCount: number }> {
    const where: any = {};
    if (query && query.trim().length > 0) {
        where.OR = [
            { code: { contains: query.trim(), mode: 'insensitive' } },
            { description: { contains: query.trim(), mode: 'insensitive' } },
        ];
    }

    const totalCount = await prisma.cie10Code.count({ where });

    const findOptions: any = { where, orderBy: { code: 'asc' } };
    if (page && pageSize) {
        findOptions.skip = (page - 1) * pageSize;
        findOptions.take = pageSize;
    }

    const codes = await prisma.cie10Code.findMany(findOptions);
    return { codes, totalCount };
}

export async function createCie10Code(data: Cie10Code): Promise<Cie10Code> {
    await ensureAdminPermission();
    try {
        await prisma.cie10Code.create({
            data: { code: data.code.toUpperCase(), description: data.description },
        });
    } catch (error: any) {
        if (error.code === 'P2002') {
            throw new Error('El código CIE-10 ya existe.');
        }
        throw error;
    }
    revalidatePath('/dashboard/cie10');
    return data;
}

export async function updateCie10Code(code: string, data: { description: string }): Promise<Cie10Code> {
    await ensureAdminPermission();
    await prisma.cie10Code.update({
        where: { code },
        data: { description: data.description },
    });
    revalidatePath('/dashboard/cie10');
    return { code, description: data.description };
}

export async function deleteCie10Code(code: string): Promise<{ success: boolean }> {
    await ensureAdminPermission();
    const usage = await prisma.consultationDiagnosis.count({ where: { cie10Code: code } });
    if (usage > 0) {
        throw new Error('Este código CIE-10 está en uso y no puede ser eliminado.');
    }
    await prisma.cie10Code.delete({ where: { code } });
    revalidatePath('/dashboard/cie10');
    return { success: true };
}

export async function bulkCreateCie10Codes(codes: Cie10Code[]): Promise<{ imported: number; skipped: number }> {
    await ensureAdminPermission();
    let importedCount = 0;

    for (const code of codes) {
        try {
            await prisma.cie10Code.create({
                data: { code: code.code.toUpperCase(), description: code.description },
            });
            importedCount++;
        } catch (error: any) {
            if (error.code === 'P2002') {
                // Skip duplicates
                continue;
            }
            throw new Error('Error masivo al insertar códigos CIE-10.');
        }
    }

    revalidatePath('/dashboard/cie10');
    return {
        imported: importedCount,
        skipped: codes.length - importedCount,
    };
}


export async function searchCie10Codes(query: string): Promise<Cie10Code[]> {
    if (!query || query.trim().length < 2) return [];
    const results = await prisma.cie10Code.findMany({
        where: {
            OR: [
                { code: { contains: query.trim(), mode: 'insensitive' } },
                { description: { contains: query.trim(), mode: 'insensitive' } },
            ],
        },
        take: 20,
    });

    return results.map(r => ({
        code: r.code,
        description: r.description
    }));
}

export async function getListaPacientes(query?: string): Promise<PacienteConInfo[]> {
    let whereClause = '';
    const params: any[] = [];

    if (query && query.trim().length > 1) {
        const searchQuery = `%${query.trim()}%`;
        whereClause = `WHERE ${fullNameSql} ILIKE $1 OR ${fullCedulaSearchSql} ILIKE $2 OR p.email ILIKE $3`;
        params.push(searchQuery, searchQuery, searchQuery);
    }

    const rows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT p.id, ${fullNameSql} as "nombreCompleto", ${fullCedulaSql} as cedula,
         p.nacionalidad, p."cedulaNumero", p."fechaNacimiento", p.genero, p.telefono1, p.telefono2, p.email,
         MAX(CASE WHEN t.id IS NOT NULL THEN 1 ELSE 0 END) as "isTitular",
         MAX(CASE WHEN b.id IS NOT NULL THEN 1 ELSE 0 END) as "isBeneficiario"
         FROM personas p
         LEFT JOIN titulares t ON p.id = t."personaId"
         LEFT JOIN beneficiarios b ON p.id = b."personaId"
         JOIN pacientes ON p.id = pacientes."personaId"
         ${whereClause}
         GROUP BY p.id ORDER BY p."primerNombre", p."primerApellido"`,
        ...params
    );

    return rows.map((row: any) => {
        const roles = [];
        if (row.isTitular) roles.push('Titular');
        if (row.isBeneficiario) roles.push('Beneficiario');

        return {
            ...row,
            fechaNacimiento: new Date(row.fechaNacimiento),
            roles: roles.length > 0 ? roles : ['Sin Rol'],
        };
    });
}

// --- Treatment Log Actions ---

export async function getPacienteByPersonaId(personaId: string): Promise<{ id: string } | null> {
    const paciente = await prisma.paciente.findUnique({
        where: { personaId: Number(personaId) },
        select: { id: true },
    });
    return paciente ? { id: String(paciente.id) } : null;
}

export async function getTreatmentOrders(query?: string): Promise<TreatmentOrder[]> {
    const offset = 0; // Not used in original, but could be added for pagination

    let orderIds: number[] = [];

    if (query && query.trim().length > 1) {
        const searchQuery = `%${query.trim()}%`;
        const results = await prisma.$queryRawUnsafe<{ id: number }[]>(
            `SELECT o.id
             FROM treatment_orders o
             JOIN pacientes pac ON o."pacienteId" = pac.id
             JOIN personas p ON pac."personaId" = p.id
             WHERE ${fullNameSql} ILIKE $1 OR ${fullCedulaSearchSql} ILIKE $2
             ORDER BY o."createdAt" DESC`,
            searchQuery, searchQuery
        );
        orderIds = results.map(r => r.id);
    } else {
        const results = await prisma.treatmentOrder.findMany({
            select: { id: true },
            orderBy: { createdAt: 'desc' },
        });
        orderIds = results.map(r => r.id);
    }

    if (orderIds.length === 0) {
        return [];
    }

    const rows = await prisma.treatmentOrder.findMany({
        where: { id: { in: orderIds } },
        include: {
            paciente: {
                include: { persona: true }
            },
            consultation: {
                include: { diagnoses: true }
            },
            items: {
                where: { status: 'Pendiente' }
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    const filteredRows = rows.filter(row => row.items.length > 0);

    return filteredRows.map(row => ({
        id: row.id,
        pacienteId: row.pacienteId,
        consultationId: row.consultationId,
        status: row.status,
        createdAt: row.createdAt,
        diagnosticoPrincipal: row.consultation.diagnoses.map(d => d.cie10Description).join('; '),
        items: row.items as any[],
        paciente: {
            id: row.pacienteId,
            personaId: row.paciente.personaId,
            nombreCompleto: buildNombreCompleto(row.paciente.persona),
            cedula: buildCedula(row.paciente.persona),
        }
    })) as any[];
}

export async function createTreatmentExecution(data: CreateTreatmentExecutionInput): Promise<TreatmentExecution> {
    const session = await getSession();
    
    if (!session.isLoggedIn || !session.user) {
        throw new Error('Acción no autorizada.');
    }

    const roleId = Number(session.user.role.id);
    const roleName = session.user.role.name;
    const allowedClinicalRoles = [1, 5, 6, 4]; // Superuser, Pediatrician, Family, Nurse
    
    if (!allowedClinicalRoles.includes(roleId) && roleName !== 'Superusuario') {
        throw new Error('Acción no autorizada.');
    }
    const executedBy = session.user.name || session.user.username;
    const executionTime = new Date();

    const created = await prisma.$transaction(async (tx) => {
        const execution = await tx.treatmentExecution.create({
            data: {
                treatmentOrderItemId: Number(data.treatmentOrderItemId),
                executionTime: executionTime,
                observations: data.observations || null,
                executedBy: executedBy,
            }
        });

        await tx.treatmentOrderItem.update({
            where: { id: Number(data.treatmentOrderItemId) },
            data: { status: 'Administrado' }
        });

        return execution;
    });

    revalidatePath('/dashboard/bitacora');
    revalidatePath('/dashboard/hce');

    return {
        id: created.id,
        treatmentOrderItemId: created.treatmentOrderItemId,
        executionTime: created.executionTime,
        observations: created.observations || undefined,
        executedBy: created.executedBy,
    };
}

export async function updateTreatmentOrderStatus(orderId: string, status: 'En Progreso' | 'Completado' | 'Cancelado'): Promise<{ success: boolean }> {
    const session = await getSession();
    const roleId = Number(session.user?.role.id);
    const roleName = session.user?.role.name;
    const allowedClinicalRoles = [1, 5, 6, 4];

    if (!session.isLoggedIn || !session.user || (!allowedClinicalRoles.includes(roleId) && roleName !== 'Superusuario')) {
        throw new Error('Acción no autorizada.');
    }

    if (status === 'Completado') {
        const executionCount = await prisma.treatmentExecution.count({
            where: {
                treatmentOrderItem: {
                    treatmentOrderId: Number(orderId)
                }
            }
        });
        if (executionCount === 0) {
            throw new Error('No se puede completar una orden de tratamiento sin haber registrado al menos una ejecución.');
        }

        const pendingCount = await prisma.treatmentOrderItem.count({
            where: {
                treatmentOrderId: Number(orderId),
                status: 'Pendiente'
            }
        });
        if (pendingCount > 0) {
            throw new Error('No se puede completar la orden. Aún hay ítems pendientes de administrar.');
        }
    }

    await prisma.treatmentOrder.update({
        where: { id: Number(orderId) },
        data: { status }
    });

    revalidatePath('/dashboard/bitacora');
    return { success: true };
}


// --- Lab Order Actions ---
export async function createLabOrder(consultationId: string, pacienteId: string, tests: string[]): Promise<LabOrder> {
    const session = await getSession();
    const roleId = Number(session.user?.role.id);
    const roleName = session.user?.role.name;
    const allowedDocRoles = [1, 5, 6];

    if (!session.isLoggedIn || !session.user || (!allowedDocRoles.includes(roleId) && roleName !== 'Superusuario')) {
        throw new Error('Acción no autorizada.');
    }

    const orderDate = new Date();

    const created = await prisma.$transaction(async (tx) => {
        const order = await tx.labOrder.create({
            data: {
                pacienteId: Number(pacienteId),
                consultationId: Number(consultationId),
                orderDate: orderDate,
                status: 'Pendiente',
            }
        });

        for (const testName of tests) {
            await tx.labOrderItem.create({
                data: {
                    labOrderId: order.id,
                    testName,
                }
            });
        }

        return order;
    });

    revalidatePath('/dashboard/hce');

    const paciente = await prisma.paciente.findUnique({
        where: { id: Number(pacienteId) },
        include: { persona: true }
    });

    const consultation = await prisma.consultation.findUnique({
        where: { id: Number(consultationId) },
        include: { diagnoses: true }
    });

    return {
        id: created.id,
        pacienteId: String(created.pacienteId),
        consultationId: String(created.consultationId),
        orderDate: created.orderDate,
        status: created.status,
        tests,
        paciente: {
            ...enrichPersona(paciente!.persona),
            id: paciente!.id,
        } as any,
        diagnosticoPrincipal: consultation?.diagnoses.map(d => d.cie10Description).join('; '),
        treatmentPlan: consultation?.treatmentPlan || undefined,
    };
}


// --- Dashboard KPI Actions ---

export async function getWaitlistCount(): Promise<number> {
    return await prisma.waitlistEntry.count({
        where: { status: { notIn: ['Completado', 'Cancelado'] } },
    });
}

export async function getTodayConsultationsCount(): Promise<number> {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    return await prisma.consultation.count({
        where: { consultationDate: { gte: todayStart, lte: todayEnd } },
    });
}

export async function getTodayRegisteredPeopleCount(): Promise<number> {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    return await prisma.persona.count({
        where: { createdAt: { gte: todayStart, lte: todayEnd } },
    });
}


// --- HCE Patient Summary ---
export async function getPatientSummary(personaId: string): Promise<PatientSummary> {
    // const history = await getPatientHistory(personaId);

    // const consultationHistory = history.filter(entry => {
    //   if (entry.type !== 'consultation') return false;
    //   // Ensure there is some text content to summarize
    //   return entry.data.motivoConsulta || entry.data.enfermedadActual || entry.data.diagnoses.length > 0 || entry.data.treatmentPlan;
    // });

    // if (consultationHistory.length === 0) {
    //   return {
    //     knownAllergies: [],
    //     chronicOrImportantDiagnoses: [],
    //     currentMedications: [],
    //   };
    // }

    // const historyString = consultationHistory
    //   .map(entry => {
    //     if (entry.type === 'consultation') {
    //       const c = entry.data;
    //       let entryStr = `Fecha: ${c.consultationDate.toLocaleDateString('es-VE')}\n`;
    //       if (c.motivoConsulta) {
    //         entryStr += `Motivo: ${c.motivoConsulta.sintomas.join(', ')} ${c.motivoConsulta.otros || ''}\n`;
    //       }
    //       entryStr += `Enfermedad Actual: ${c.enfermedadActual || 'N/A'}\n`;
    //       if (c.antecedentesPersonales?.alergicos?.length) {
    //           entryStr += `Alergias Registradas: ${c.antecedentesPersonales.alergicos.join(', ')}\n`;
    //       }
    //        if (c.antecedentesPersonales?.alergicosOtros) {
    //           entryStr += `Otras Alergias: ${c.antecedentesPersonales.alergicosOtros}\n`;
    //       }
    //       if (c.antecedentesPersonales?.medicamentos) {
    //           entryStr += `Medicamentos Anteriores: ${c.antecedentesPersonales.medicamentos}\n`;
    //       }
    //       if (c.diagnoses.length > 0) {
    //           entryStr += `Diagnósticos: ${c.diagnoses.map(d => `${d.cie10Description} (${d.cie10Code})`).join('; ')}\n`;
    //       }
    //       entryStr += `Plan de Tratamiento: ${c.treatmentPlan || 'N/A'}\n`;
    //       if (c.treatmentOrder?.items.length) {
    //           entryStr += `Receta: ${c.treatmentOrder.items.map(i => `${i.medicamentoProcedimiento} ${i.dosis || ''}`).join('; ')}\n`;
    //       }
    //       return entryStr;
    //     }
    //     return '';
    //   })
    //   .join('\n---\n')
    //   .trim();

    // if (!historyString || historyString.trim() === '') {
    //   return {
    //     knownAllergies: [],
    //     chronicOrImportantDiagnoses: [],
    //     currentMedications: [],
    //   };
    // }

    // const summary = await summarizePatientHistory({ history: historyString });

    // return summary;
    return {
        knownAllergies: [],
        chronicOrImportantDiagnoses: [],
        currentMedications: [],
    };
}

// --- Occupational Health Actions ---
export async function createOccupationalHealthEvaluation(personaId: string, data: Omit<OccupationalHealthEvaluation, 'id' | 'personaId' | 'evaluationDate'>): Promise<OccupationalHealthEvaluation> {
    const evaluationDate = new Date();

    const created = await prisma.occupationalHealthEvaluation.create({
        data: {
            personaId: Number(personaId),
            companyId: data.companyId ? Number(data.companyId) : null,
            companyName: data.companyName || null,
            evaluationDate: evaluationDate,
            patientType: data.patientType,
            consultationPurpose: data.consultationPurpose,
            jobPosition: data.jobPosition,
            jobDescription: data.jobDescription,
            occupationalRisks: JSON.stringify(data.occupationalRisks),
            riskDetails: data.riskDetails,
            personalHistory: data.personalHistory,
            familyHistory: data.familyHistory,
            lifestyle: JSON.stringify(data.lifestyle),
            mentalHealth: data.mentalHealth || null,
            vitalSigns: JSON.stringify(data.vitalSigns),
            anthropometry: JSON.stringify(data.anthropometry),
            physicalExamFindings: data.physicalExamFindings,
            diagnoses: JSON.stringify(data.diagnoses),
            fitnessForWork: data.fitnessForWork,
            occupationalRecommendations: data.occupationalRecommendations,
            generalHealthPlan: data.generalHealthPlan,
            interconsultation: data.interconsultation || null,
            nextFollowUp: data.nextFollowUp || null,
        }
    });

    revalidatePath('/dashboard/historial-ocupacional');

    return {
        ...data,
        id: created.id,
        personaId,
        evaluationDate,
    };
}


export async function getOccupationalHealthHistory(personaId: string): Promise<OccupationalHealthEvaluation[]> {
    const rows = await prisma.occupationalHealthEvaluation.findMany({
        where: { personaId: Number(personaId) },
        orderBy: { evaluationDate: 'desc' }
    });

    return rows.map(row => ({
        ...row,
        personaId: String(row.personaId),
        companyId: row.companyId ? String(row.companyId) : undefined,
        evaluationDate: row.evaluationDate,
        nextFollowUp: row.nextFollowUp || undefined,
        occupationalRisks: JSON.parse(row.occupationalRisks as string),
        lifestyle: JSON.parse(row.lifestyle as string),
        vitalSigns: JSON.parse(row.vitalSigns as string),
        anthropometry: JSON.parse(row.anthropometry as string),
        diagnoses: JSON.parse(row.diagnoses as string),
    })) as any[];
}

export async function getServices(query?: string): Promise<Service[]> {
    const where: any = {};
    if (query && query.trim().length > 1) {
        where.OR = [
            { name: { contains: query.trim(), mode: 'insensitive' } },
            { description: { contains: query.trim(), mode: 'insensitive' } },
        ];
    }
    return await prisma.service.findMany({ where, orderBy: { name: 'asc' } });
}

export async function createService(data: Omit<Service, 'id'>): Promise<Service> {
    await ensureAdminPermission();
    const service = await prisma.service.create({
        data: { name: data.name, description: data.description, price: data.price },
    });
    revalidatePath('/dashboard/servicios');
    return service;
}

export async function updateService(id: string, data: Omit<Service, 'id'>): Promise<Service> {
    await ensureAdminPermission();
    const updated = await prisma.service.update({
        where: { id: Number(id) },
        data: { name: data.name, description: data.description, price: data.price },
    });
    revalidatePath('/dashboard/servicios');
    return updated;
}

export async function deleteService(id: string): Promise<{ success: boolean }> {
    await ensureAdminPermission();
    await prisma.service.delete({ where: { id: Number(id) } });
    revalidatePath('/dashboard/servicios');
    return { success: true };
}


// --- Reports ---

export async function getMorbidityReport(params: { from: Date; to: Date }): Promise<MorbidityReportRow[]> {
    const { from, to } = params;
    const fromDate = startOfDay(from);
    const toDate = endOfDay(to);

    const rows = await prisma.$queryRawUnsafe<MorbidityReportRow[]>(
        `SELECT "cie10Code", "cie10Description", COUNT(*)::int as frequency
         FROM consultation_diagnoses
         WHERE "consultationId" IN (
            SELECT id FROM consultations WHERE "consultationDate" BETWEEN $1 AND $2
         )
         GROUP BY "cie10Code", "cie10Description"
         ORDER BY frequency DESC`,
        fromDate, toDate
    );

    return rows;
}


export async function getOperationalReport(params: { from: Date; to: Date }): Promise<OperationalReportData> {
    const { from, to } = params;
    const fromDate = startOfDay(from);
    const toDate = endOfDay(to);

    const totalConsultations = await prisma.consultation.count({
        where: { consultationDate: { gte: fromDate, lte: toDate } }
    });

    const newPeopleRegistered = await prisma.persona.count({
        where: { createdAt: { gte: fromDate, lte: toDate } }
    });

    const consultationsByServiceResult = await prisma.$queryRawUnsafe<any[]>(
        `SELECT w."serviceType", COUNT(c.id)::int as count
         FROM consultations c
         JOIN waitlist w ON c."waitlistId" = w.id
         WHERE c."consultationDate" BETWEEN $1 AND $2
         GROUP BY w."serviceType"`,
        fromDate, toDate
    );

    const patientDemographics = await prisma.$queryRawUnsafe<any[]>(
        `SELECT p.genero, p."fechaNacimiento"
         FROM consultations c
         JOIN pacientes pac ON c."pacienteId" = pac.id
         JOIN personas p ON pac."personaId" = p.id
         WHERE c."consultationDate" BETWEEN $1 AND $2`,
        fromDate, toDate
    );

    let men = 0;
    let women = 0;
    let children = 0;
    let adults = 0;
    let seniors = 0;

    patientDemographics.forEach(p => {
        if (p.genero === 'Masculino') men++;
        if (p.genero === 'Femenino') women++;
        const age = calculateAge(new Date(p.fechaNacimiento));
        if (age < 18) children++;
        else if (age >= 18 && age < 60) adults++;
        else seniors++;
    });

    return {
        totalConsultations,
        newPeopleRegistered,
        consultationsByService: consultationsByServiceResult.map(r => ({
            serviceType: r.serviceType,
            count: r.count
        })),
        demographics: {
            byGender: { men, women },
            byAgeGroup: { children, adults, seniors },
        }
    };
}

// --- Appointments Report ---

export async function getAppointmentsReport(params: {
    dateFrom?: Date;
    dateTo?: Date;
    serviceType?: string;
    status?: string;
}): Promise<Array<{
    fecha: string;
    hora: string;
    cedula: string | null;
    paciente: string;
    servicio: string;
    medico: string;
    estado: string;
    isReintegro: boolean;
    departamento: string;
}>> {
    // Default to last 30 days if no dates provided
    const fromDate = params.dateFrom ? startOfDay(params.dateFrom) : startOfDay(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const toDate = params.dateTo ? endOfDay(params.dateTo) : endOfDay(new Date());

    let query = `
        SELECT 
            w."checkInTime" as fecha,
            ${fullCedulaSql} as cedula,
            ${fullNameSql} as paciente,
            w."serviceType" as servicio,
            w."accountType" as departamento,
            COALESCE(TRIM(pm."primerNombre" || ' ' || pm."primerApellido"), 'No asignado') as medico,
            w."isReintegro",
            CASE 
                WHEN w.status = 'Completado' THEN 'Completada'
                WHEN w.status = 'Cancelado' THEN 'Cancelada'
                ELSE 'Pendiente'
            END as estado
        FROM waitlist w
        LEFT JOIN pacientes pac ON w."pacienteId" = pac.id
        LEFT JOIN personas p ON pac."personaId" = p.id
        LEFT JOIN users u ON w."personaId" = u."personaId"
        LEFT JOIN personas pm ON u."personaId" = pm.id
        WHERE w."checkInTime" >= $1 AND w."checkInTime" <= $2
    `;

    const queryParams: any[] = [fromDate, toDate];

    // Add service type filter if provided
    if (params.serviceType && params.serviceType !== 'todos') {
        query += ` AND w."serviceType" = $${queryParams.length + 1}`;
        queryParams.push(params.serviceType);
    }

    // Add status filter if provided
    if (params.status && params.status !== 'todos') {
        if (params.status === 'Completada') {
            query += ` AND w.status = 'Completado'`;
        } else if (params.status === 'Cancelada') {
            query += ` AND w.status = 'Cancelado'`;
        } else if (params.status === 'Pendiente') {
            query += ` AND w.status NOT IN ('Completado', 'Cancelado')`;
        }
    }

    query += ` ORDER BY w."checkInTime" DESC LIMIT 1000`;

    const rows = await prisma.$queryRawUnsafe<any[]>(query, ...queryParams);

    return rows.map((row: any) => {
        const fechaObj = new Date(row.fecha);
        return {
            fecha: fechaObj.toLocaleDateString('es-VE'),
            hora: fechaObj.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }),
            cedula: row.cedula || 'Sin cédula',
            paciente: row.paciente,
            servicio: row.servicio,
            medico: row.medico,
            estado: row.estado,
            isReintegro: !!row.isReintegro,
            departamento: row.departamento || 'Privado',
        };
    });
}

export async function searchClinicEmployees(query: string): Promise<SearchResult[]> {
    const searchQuery = `%${query.trim()}%`;
    const hasQuery = query && query.trim().length > 0;

    const personasQuery = `
        SELECT p.*, ${fullNameSql} as "nombreCompleto", ${fullCedulaSql} as cedula,
               t.id as titular_id, t."unidadServicioId", t."numeroFicha"
        FROM personas p
        JOIN titulares t ON p.id = t."personaId"
        WHERE 1=1
        ${hasQuery ? `AND (${fullNameSql} ILIKE $1 OR ${fullCedulaSearchSql} ILIKE $2)` : ''}
        ORDER BY "primerNombre", "primerApellido"
        LIMIT 50
    `;

    const personasParams = hasQuery ? [searchQuery, searchQuery] : [];
    const rows = await prisma.$queryRawUnsafe<any[]>(personasQuery, ...personasParams);

    return rows.map((row: any) => ({
        persona: {
            ...row,
            id: row.id,
            fechaNacimiento: new Date(row.fechaNacimiento),
        },
        titularInfo: {
            id: row.titular_id,
            unidadServicioId: row.unidadServicioId,
            numeroFicha: row.numeroFicha
        }
    }));
}

export async function getRecentPatients(limit: number = 5) {
    try {
        const personas = await prisma.persona.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                primerNombre: true,
                segundoNombre: true,
                primerApellido: true,
                segundoApellido: true,
                nacionalidad: true,
                cedulaNumero: true,
                createdAt: true,
            }
        });

        const { enrichPersona } = await import('@/lib/prisma-helpers');
        return personas.map(enrichPersona);
    } catch (error) {
        console.error("Error fetching recent patients:", error);
        return [];
    }
}

export async function getConsultationByWaitlistId(waitlistId: number) {
    try {
        const consultation = await prisma.consultation.findFirst({
            where: { waitlistId: Number(waitlistId) },
            include: {
                diagnoses: true,
                treatmentOrders: {
                    include: { items: true }
                }
            }
        });

        if (!consultation) return null;

        const { enrichConsultation } = await import('@/lib/prisma-helpers');
        return enrichConsultation(consultation);
    } catch (error) {
        console.error("Error fetching consultation by waitlistId:", error);
        return null;
    }
}

export async function getCompletedConsultations(params: {
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
    page?: number;
    pageSize?: number;
}) {
    const { dateFrom, dateTo, search, page = 1, pageSize = 50 } = params;
    const skip = (page - 1) * pageSize;

    let whereClause: any = {};

    if (dateFrom && dateTo) {
        whereClause.consultationDate = {
            gte: dateFrom,
            lte: dateTo,
        };
    } else if (dateFrom) {
        whereClause.consultationDate = { gte: dateFrom };
    } else if (dateTo) {
        whereClause.consultationDate = { lte: dateTo };
    }

    if (search && search.trim().length > 0) {
        const searchTerm = `%${search.trim()}%`;
        const matchingPersonas = await prisma.$queryRawUnsafe<{ id: number }[]>(
            `SELECT id FROM personas WHERE ${fullNameSql} ILIKE $1 OR ${fullCedulaSearchSql} ILIKE $2`,
            searchTerm, searchTerm
        );
        const personaIds = matchingPersonas.map(p => p.id);
        
        whereClause.paciente = {
            personaId: { in: personaIds }
        };
    }

    const totalCount = await prisma.consultation.count({ where: whereClause });

    const consultations = await prisma.consultation.findMany({
        where: whereClause,
        include: {
            paciente: {
                include: { 
                    persona: {
                        include: {
                            titular: { include: { unidadServicio: true } },
                            beneficiarios: {
                                include: {
                                    titular: { include: { unidadServicio: true } }
                                }
                            }
                        }
                    }
                }
            },
            waitlistEntry: true,
            diagnoses: true,
            treatmentOrders: {
                include: { 
                    items: true 
                }
            },
            doctor: {
                include: {
                    persona: true,
                    specialty: true
                }
            }
        },
        orderBy: { consultationDate: 'desc' },
        skip,
        take: pageSize,
    });

    const { enrichConsultation } = await import('@/lib/prisma-helpers');
    const enriched = consultations.map(c => enrichConsultation(c as any));

    return { consultations: enriched, totalCount };
}


