

/**
 * Prisma helpers for MediHub CPV
 * Shared utility functions for computing values that were previously done in SQL.
 */

import type { Persona as PrismaPersona } from '@prisma/client';
import { calculateAge } from './utils';

/** Builds a computed full name string from persona fields */
export function buildNombreCompleto(p: Pick<PrismaPersona, 'primerNombre' | 'segundoNombre' | 'primerApellido' | 'segundoApellido'>): string {
    return [p.primerNombre, p.segundoNombre, p.primerApellido, p.segundoApellido]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/** Builds a computed cedula string from persona fields */
export function buildCedula(p: Pick<PrismaPersona, 'nacionalidad' | 'cedulaNumero'>): string | null {
    if (p.nacionalidad && p.cedulaNumero) {
        return `${p.nacionalidad}-${p.cedulaNumero}`;
    }
    return null;
}

/** Standard select for persona fields (avoids selecting all columns when not needed) */
export const personaSelect = {
    id: true,
    primerNombre: true,
    segundoNombre: true,
    primerApellido: true,
    segundoApellido: true,
    nacionalidad: true,
    cedulaNumero: true,
    fechaNacimiento: true,
    genero: true,
    telefono1: true,
    telefono2: true,
    email: true,
    direccion: true,
    representanteId: true,
    createdAt: true,
} as const;

/** Transform a Prisma Persona row to add computed fields */
export function enrichPersona(p: any) {
    if (!p) return p;
    return {
        ...p,
        nombreCompleto: buildNombreCompleto(p),
        cedula: buildCedula(p),
    };
}

/** Transform a Prisma Consultation row to add computed fields to nested objects */
export function enrichConsultation(c: any) {
    if (!c) return c;
    
    const enriched = { ...c };
    
    if (enriched.paciente && enriched.paciente.persona) {
        enriched.paciente.persona = enrichPersona(enriched.paciente.persona);
        enriched.paciente.nombreCompleto = enriched.paciente.persona.nombreCompleto;
        enriched.paciente.cedula = enriched.paciente.persona.cedula;
        enriched.paciente.genero = enriched.paciente.persona.genero;
        enriched.paciente.fechaNacimiento = enriched.paciente.persona.fechaNacimiento;
        enriched.paciente.edad = enriched.paciente.persona.fechaNacimiento ? calculateAge(enriched.paciente.persona.fechaNacimiento) : null;

        // Compute Departamento / Área
        const p = enriched.paciente.persona;
        let departamento = 'Privado';
        if (p.titular) {
            departamento = p.titular.unidadServicio?.name || 'Privado';
        } else if (p.beneficiarios && p.beneficiarios.length > 0) {
            departamento = p.beneficiarios[0].titular?.unidadServicio?.name || 'Beneficiario';
        }
        enriched.paciente.departamento = departamento;
    }

    // Extract Doctor name from relation or snapshot
    if (enriched.doctor && enriched.doctor.persona) {
        enriched.doctor.persona = enrichPersona(enriched.doctor.persona);
        enriched.doctorName = enriched.doctor.persona.nombreCompleto;
    }
    
    // Handle JSON fields if they are strings (sometimes happens with queryRaw or specific prisma versions)
    const jsonFields = ['motivoConsulta', 'antecedentesPersonales', 'antecedentesGinecoObstetricos', 'antecedentesPediatricos', 'signosVitales', 'occupationalReferral'];
    jsonFields.forEach(field => {
        if (typeof enriched[field] === 'string') {
            try {
                enriched[field] = JSON.parse(enriched[field]);
            } catch (e) {
                // Keep as is if parsing fails
            }
        }
    });
    
    // Map treatmentOrders (plural) to treatmentOrder (singular) for the UI
    if (enriched.treatmentOrders && enriched.treatmentOrders.length > 0) {
        enriched.treatmentOrder = enriched.treatmentOrders[0];
    }

    return enriched;
}
