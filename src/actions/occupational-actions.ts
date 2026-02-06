'use server';

import { getDb } from '@/lib/db';
import { CompanySchema, JobPositionSchema, OccupationalEvaluationSchema, OccupationalIncidentSchema } from '@/lib/zod-schemas/occupational';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import { suggestMedicalExams } from '@/ai/flows/occupational';

export async function generateOccupationalSuggestions(jobTitle: string, jobDescription: string) {
    try {
        const result = await suggestMedicalExams({ jobTitle, jobDescription });
        // The result likely has { risks, suggestedExams, reasoning }
        // We might need to map these risks to our checkbox IDs or just return strings.
        return { success: true, data: result };
    } catch (error: any) {
        console.error("AI Suggestion Error:", error);
        return { success: false, error: "No se pudieron generar sugerencias. Intente de nuevo." };
    }
}


export async function createCompany(data: any) {
    const result = CompanySchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: result.error.errors[0].message };
    }

    try {
        const db = await getDb();
        const id = uuidv4();
        await db.run(
            `INSERT INTO empresas (id, name, rif, telefono, direccion) VALUES (?, ?, ?, ?, ?)`,
            [id, result.data.name, result.data.rif, result.data.telefono || '', result.data.direccion || '']
        );
        revalidatePath('/dashboard/ocupacional');
        return { success: true, id };
    } catch (error: any) {
        console.error("Error creating company:", error);
        return { success: false, error: error.message };
    }
}

export async function createJobPosition(data: any) {
    const result = JobPositionSchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: result.error.errors[0].message };
    }

    try {
        const db = await getDb();
        const id = uuidv4();
        // Serialize risks array to string for DB storage
        const risksString = result.data.risks ? JSON.stringify(result.data.risks) : '[]';

        await db.run(
            `INSERT INTO job_positions (id, name, description, "riskLevel", risks) VALUES (?, ?, ?, ?, ?)`,
            [id, result.data.name, result.data.description || '', result.data.riskLevel || 'Bajo', risksString]
        );
        revalidatePath('/dashboard/puestos');
        return { success: true, id };
    } catch (error: any) {
        console.error("Error creating job position:", error);
        return { success: false, error: error.message };
    }
}

export async function getJobPositions(search?: string, page: number = 1, pageSize: number = 10) {
    try {
        const db = await getDb();
        const offset = (page - 1) * pageSize;
        let query = `SELECT * FROM job_positions`;
        let countQuery = `SELECT COUNT(*) as count FROM job_positions`;
        const params: any[] = [];

        if (search) {
            query += ` WHERE name LIKE ? OR description LIKE ?`;
            countQuery += ` WHERE name LIKE ? OR description LIKE ?`;
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ` ORDER BY name ASC LIMIT ? OFFSET ?`;
        params.push(pageSize, offset);

        const positions = await db.all(query, params);
        const countResult = await db.get<{ count: number }>(countQuery, params.slice(0, params.length - 2));

        return {
            jobPositions: positions.map((p: any) => ({
                ...p,
                risks: p.risks ? JSON.parse(p.risks) : []
            })),
            totalCount: countResult?.count || 0
        };
    } catch (error: any) {
        console.error("Error fetching job positions:", error);
        // Return empty data instead of throwing to prevent UI crash
        return { jobPositions: [], totalCount: 0 };
    }
}

export async function updateJobPosition(data: any) {
    // Validate only partial since ID is required but others might be optional in a full update scenario
    // but JobPositionSchema requires name.
    const result = JobPositionSchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: result.error.errors[0].message };
    }

    if (!data.id) {
        return { success: false, error: "ID is required for update" };
    }

    try {
        const db = await getDb();
        const risksString = result.data.risks ? JSON.stringify(result.data.risks) : '[]';

        await db.run(
            `UPDATE job_positions SET name = ?, description = ?, "riskLevel" = ?, risks = ? WHERE id = ?`,
            [result.data.name, result.data.description || '', result.data.riskLevel || 'Bajo', risksString, data.id]
        );
        revalidatePath('/dashboard/puestos');
        return { success: true, ...result.data };
    } catch (error: any) {
        console.error("Error updating job position:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteJobPosition(id: string) {
    try {
        const db = await getDb();
        await db.run(`DELETE FROM job_positions WHERE id = ?`, [id]);
        revalidatePath('/dashboard/puestos');
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting job position:", error);
        return { success: false, error: error.message };
    }
}

export async function createOccupationalEvaluation(data: any) {
    const result = OccupationalEvaluationSchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: result.error.errors[0].message };
    }

    try {
        const db = await getDb();
        const id = uuidv4();

        // Ensure patient exists or create simplistic link (assuming personaId refers to personas table)
        // Note: The schema for occupational_health_evaluations has personaId NOT NULL.

        await db.run(
            `INSERT INTO occupational_health_evaluations (
                id, "personaId", "jobPositionId", "companyId", "evaluationDate", "patientType", "consultationPurpose",
                "occupationalRisks", "riskDetails", "personalHistory", "familyHistory", "lifestyle", "mentalHealth",
                "vitalSigns", "anthropometry", "physicalExamFindings", "diagnoses", "fitnessForWork",
                "occupationalRecommendations", "generalHealthPlan", "interconsultation", "nextFollowUp"
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                result.data.personaId,
                result.data.jobPositionId,
                result.data.companyId,
                result.data.evaluationDate,
                result.data.patientType,
                result.data.consultationPurpose,
                result.data.occupationalRisks || '',
                result.data.riskDetails || '',
                result.data.personalHistory || '',
                result.data.familyHistory || '',
                result.data.lifestyle || '',
                result.data.mentalHealth || '',
                result.data.vitalSigns || '{}',
                result.data.anthropometry || '{}',
                result.data.physicalExamFindings || '',
                result.data.diagnoses || '',
                result.data.fitnessForWork,
                result.data.occupationalRecommendations || '',
                result.data.generalHealthPlan || '',
                result.data.interconsultation || '',
                result.data.nextFollowUp || ''
            ]
        );

        revalidatePath('/dashboard/ocupacional');
        revalidatePath(`/dashboard/pacientes/${result.data.personaId}`);
        return { success: true, id };
    } catch (error: any) {
        console.error("Error creating occupational evaluation:", error);
        return { success: false, error: error.message };
    }
}

export async function getOccupationalEvaluationsByPerson(personaId: string) {
    try {
        const db = await getDb();
        const evaluations = await db.all(
            `SELECT oe.*, jp.name as "jobPositionName", e.name as "companyName" 
             FROM occupational_health_evaluations oe
             LEFT JOIN job_positions jp ON oe."jobPositionId" = jp.id
             LEFT JOIN empresas e ON oe."companyId" = e.id
             WHERE oe."personaId" = ?
             ORDER BY oe."evaluationDate" DESC`,
            [personaId]
        );
        return { success: true, data: evaluations };
    } catch (error: any) {
        console.error("Error fetching occupational evaluations:", error);
        return { success: false, error: error.message };
    }
}

export async function getOccupationalEvaluationsByCompany(companyId: string) {
    try {
        const db = await getDb();
        const evaluations = await db.all(
            `SELECT oe.*, p."primerNombre", p."primerApellido", p."cedulaNumero", jp.name as "jobPositionName"
             FROM occupational_health_evaluations oe
             JOIN personas p ON oe."personaId" = p.id
             LEFT JOIN job_positions jp ON oe."jobPositionId" = jp.id
             WHERE oe."companyId" = ?
             ORDER BY oe."evaluationDate" DESC`,
            [companyId]
        );
        return { success: true, data: evaluations };
    } catch (error: any) {
        console.error("Error fetching company evaluations:", error);
        return { success: false, error: error.message };
    }
}

export async function createOccupationalIncident(data: any) {
    const result = OccupationalIncidentSchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: result.error.errors[0].message };
    }

    try {
        const db = await getDb();
        const id = uuidv4();
        const now = new Date().toISOString();

        await db.run(
            `INSERT INTO occupational_incidents (
                id, "personaId", "companyId", "incidentDate", "incidentType", description, severity, witnesses, "actionsTaken", "reportedBy", "createdAt"
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                result.data.personaId,
                result.data.companyId,
                result.data.incidentDate,
                result.data.incidentType,
                result.data.description,
                result.data.severity,
                result.data.witnesses || '',
                result.data.actionsTaken || '',
                result.data.reportedBy,
                now
            ]
        );

        revalidatePath('/dashboard/salud-ocupacional');
        return { success: true, id };
    } catch (error: any) {
        console.error("Error creating occupational incident:", error);
        return { success: false, error: error.message };
    }
}

export async function getOccupationalIncidentsByCompany(companyId: string) {
    try {
        const db = await getDb();
        const incidents = await db.all(
            `SELECT oi.*, p."primerNombre", p."primerApellido", p."cedulaNumero"
             FROM occupational_incidents oi
             JOIN personas p ON oi."personaId" = p.id
             WHERE oi."companyId" = ?
             ORDER BY oi."incidentDate" DESC`,
            [companyId]
        );
        return { success: true, data: incidents };
    } catch (error: any) {
        console.error("Error fetching company incidents:", error);
        return { success: false, error: error.message };
    }
}

export async function getOccupationalIncidentsByPerson(personaId: string) {
    try {
        const db = await getDb();
        const incidents = await db.all(
            `SELECT oi.*, e.name as "companyName"
             FROM occupational_incidents oi
             JOIN empresas e ON oi."companyId" = e.id
             WHERE oi."personaId" = ?
             ORDER BY oi."incidentDate" DESC`,
            [personaId]
        );
        return { success: true, data: incidents };
    } catch (error: any) {
        console.error("Error fetching person incidents:", error);
        return { success: false, error: error.message };
    }
}
