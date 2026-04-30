'use server';

import { prisma } from '@/lib/prisma';
import { CompanySchema, JobPositionSchema, OccupationalEvaluationSchema, OccupationalIncidentSchema } from '@/lib/zod-schemas/occupational';
import { revalidatePath } from 'next/cache';
import { suggestMedicalExams } from '@/ai/flows/occupational';

export async function generateOccupationalSuggestions(jobTitle: string, jobDescription: string) {
    try {
        const result = await suggestMedicalExams({ jobTitle, jobDescription });
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
        const company = await prisma.empresa.create({
            data: {
                name: result.data.name,
                rif: result.data.rif,
                telefono: result.data.telefono || '',
                direccion: result.data.direccion || ''
            }
        });
        revalidatePath('/dashboard/ocupacional');
        return { success: true, id: company.id };
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
        const risksString = result.data.risks ? JSON.stringify(result.data.risks) : '[]';

        const position = await prisma.jobPosition.create({
            data: {
                name: result.data.name,
                description: result.data.description || '',
                riskLevel: result.data.riskLevel || 'Bajo',
                risks: risksString
            }
        });
        revalidatePath('/dashboard/puestos');
        return { success: true, id: position.id };
    } catch (error: any) {
        console.error("Error creating job position:", error);
        return { success: false, error: error.message };
    }
}

export async function getJobPositions(search?: string, page: number = 1, pageSize: number = 10) {
    try {
        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [positions, totalCount] = await Promise.all([
            prisma.jobPosition.findMany({
                where,
                orderBy: { name: 'asc' },
                take: pageSize,
                skip: (page - 1) * pageSize,
            }),
            prisma.jobPosition.count({ where })
        ]);

        return {
            jobPositions: positions.map((p: any) => ({
                ...p,
                risks: p.risks ? JSON.parse(p.risks) : []
            })),
            totalCount
        };
    } catch (error: any) {
        console.error("Error fetching job positions:", error);
        return { jobPositions: [], totalCount: 0 };
    }
}

export async function updateJobPosition(data: any) {
    const result = JobPositionSchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: result.error.errors[0].message };
    }

    if (data.id === undefined) {
        return { success: false, error: "ID is required for update" };
    }

    try {
        const risksString = result.data.risks ? JSON.stringify(result.data.risks) : '[]';

        const updated = await prisma.jobPosition.update({
            where: { id: Number(data.id) },
            data: {
                name: result.data.name,
                description: result.data.description || '',
                riskLevel: result.data.riskLevel || 'Bajo',
                risks: risksString
            }
        });
        revalidatePath('/dashboard/puestos');
        return { success: true, ...updated };
    } catch (error: any) {
        console.error("Error updating job position:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteJobPosition(id: string) {
    try {
        await prisma.jobPosition.delete({
            where: { id: Number(id) }
        });
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
        const evaluation = await prisma.occupationalHealthEvaluation.create({
            data: {
                personaId: Number(result.data.personaId),
                jobPositionId: result.data.jobPositionId ? Number(result.data.jobPositionId) : null,
                companyId: result.data.companyId ? Number(result.data.companyId) : null,
                evaluationDate: new Date(result.data.evaluationDate),
                patientType: result.data.patientType,
                consultationPurpose: result.data.consultationPurpose,
                jobDescription: result.data.jobDescription || '',
                occupationalRisks: result.data.occupationalRisks || '',
                riskDetails: result.data.riskDetails || '',
                personalHistory: result.data.personalHistory || '',
                familyHistory: result.data.familyHistory || '',
                lifestyle: result.data.lifestyle || '',
                mentalHealth: result.data.mentalHealth || '',
                vitalSigns: result.data.vitalSigns || '{}',
                anthropometry: result.data.anthropometry || '{}',
                physicalExamFindings: result.data.physicalExamFindings || '',
                diagnoses: result.data.diagnoses || '',
                fitnessForWork: result.data.fitnessForWork,
                occupationalRecommendations: result.data.occupationalRecommendations || '',
                generalHealthPlan: result.data.generalHealthPlan || '',
                interconsultation: result.data.interconsultation || '',
                nextFollowUp: result.data.nextFollowUp ? new Date(result.data.nextFollowUp) : null,
            }
        });

        revalidatePath('/dashboard/ocupacional');
        revalidatePath(`/dashboard/pacientes/${result.data.personaId}`);
        return { success: true, id: evaluation.id };
    } catch (error: any) {
        console.error("Error creating occupational evaluation:", error);
        return { success: false, error: error.message };
    }
}

export async function getOccupationalEvaluationsByPerson(personaId: number | string) {
    try {
        const evaluations = await prisma.occupationalHealthEvaluation.findMany({
            where: { personaId: Number(personaId) },
            include: {
                jobPosition: true,
                company: true,
            },
            orderBy: { evaluationDate: 'desc' },
        });

        // Map to include flattened names for backward compatibility if needed
        const mapped = evaluations.map(oe => ({
            ...oe,
            jobPositionName: oe.jobPosition?.name,
            companyName: oe.company?.name,
        }));

        return { success: true, data: mapped };
    } catch (error: any) {
        console.error("Error fetching occupational evaluations:", error);
        return { success: false, error: error.message };
    }
}

export async function getOccupationalEvaluationsByCompany(companyId: number | string) {
    try {
        const evaluations = await prisma.occupationalHealthEvaluation.findMany({
            where: { companyId: Number(companyId) },
            include: {
                persona: true,
                jobPosition: true,
            },
            orderBy: { evaluationDate: 'desc' },
        });

        const mapped = evaluations.map(oe => ({
            ...oe,
            primerNombre: oe.persona.primerNombre,
            primerApellido: oe.persona.primerApellido,
            cedulaNumero: oe.persona.cedulaNumero,
            jobPositionName: oe.jobPosition?.name,
        }));

        return { success: true, data: mapped };
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
        const incident = await prisma.occupationalIncident.create({
            data: {
                personaId: Number(result.data.personaId),
                companyId: Number(result.data.companyId),
                incidentDate: new Date(result.data.incidentDate),
                incidentType: result.data.incidentType,
                description: result.data.description,
                severity: result.data.severity,
                witnesses: result.data.witnesses || '',
                actionsTaken: result.data.actionsTaken || '',
                reportedBy: result.data.reportedBy,
            }
        });

        revalidatePath('/dashboard/salud-ocupacional');
        return { success: true, id: incident.id };
    } catch (error: any) {
        console.error("Error creating occupational incident:", error);
        return { success: false, error: error.message };
    }
}

export async function getOccupationalIncidentsByCompany(companyId: number | string) {
    try {
        const incidents = await prisma.occupationalIncident.findMany({
            where: { companyId: Number(companyId) },
            include: {
                persona: true,
            },
            orderBy: { incidentDate: 'desc' },
        });

        const mapped = incidents.map(oi => ({
            ...oi,
            primerNombre: oi.persona.primerNombre,
            primerApellido: oi.persona.primerApellido,
            cedulaNumero: oi.persona.cedulaNumero,
        }));

        return { success: true, data: mapped };
    } catch (error: any) {
        console.error("Error fetching company incidents:", error);
        return { success: false, error: error.message };
    }
}

export async function getOccupationalIncidentsByPerson(personaId: number | string) {
    try {
        const incidents = await prisma.occupationalIncident.findMany({
            where: { personaId: Number(personaId) },
            include: {
                company: true,
            },
            orderBy: { incidentDate: 'desc' },
        });

        const mapped = incidents.map(oi => ({
            ...oi,
            companyName: oi.company.name,
        }));

        return { success: true, data: mapped };
    } catch (error: any) {
        console.error("Error fetching person incidents:", error);
        return { success: false, error: error.message };
    }
}
