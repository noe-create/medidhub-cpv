import { z } from 'zod';

export const CompanySchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "El nombre es obligatorio"),
    rif: z.string().min(1, "El RIF es obligatorio"),
    telefono: z.string().optional(),
    direccion: z.string().optional(),
});


export const RiskLevelSchema = z.enum(['Bajo', 'Medio', 'Alto', 'Muy Alto']);

export const JobPositionSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'El nombre es requerido'),
    description: z.string().optional(),
    riskLevel: RiskLevelSchema.optional(),
    risks: z.array(z.string()).optional(),
    mandatoryExams: z.array(z.string()).optional(), // New field for Profesiogram
});

export type JobPosition = z.infer<typeof JobPositionSchema>;

export const OccupationalEvaluationSchema = z.object({
    id: z.string().optional(),
    personaId: z.string().min(1, 'La persona es requerida'),
    pacienteId: z.string().optional(),
    jobPositionId: z.string().optional(),
    companyId: z.string().optional(),
    companyName: z.string().optional(),
    evaluationDate: z.string().min(1, 'La fecha es requerida'), // ISO string
    patientType: z.string(), // Ingreso, Periodico, Egreso, etc.
    consultationPurpose: z.string(),

    // Legacy fields or fallback
    jobPosition: z.string().optional(),
    jobDescription: z.string().optional(),

    occupationalRisks: z.string(), // detailed text or JSON string
    riskDetails: z.string(),

    personalHistory: z.string(),
    familyHistory: z.string(),
    lifestyle: z.string(),
    mentalHealth: z.string().optional(),

    vitalSigns: z.string(), // JSON string likely
    anthropometry: z.string(), // JSON string likely
    physicalExamFindings: z.string(),

    diagnoses: z.string(),

    fitnessForWork: z.enum(['Apto', 'No Apto', 'Apto con Restricciones']),
    occupationalRecommendations: z.string(),
    generalHealthPlan: z.string(),
    interconsultation: z.string().optional(),
    nextFollowUp: z.string().optional(),
});

export type OccupationalEvaluation = z.infer<typeof OccupationalEvaluationSchema>;

export const AptitudeUpdateSchema = z.object({
    id: z.string(),
    fitnessForWork: z.enum(['Apto', 'No Apto', 'Apto con Restricciones']),
    occupationalRecommendations: z.string(),
});

export const OccupationalIncidentSchema = z.object({
    id: z.string().optional(),
    personaId: z.string().min(1, 'La persona es requerida'),
    companyId: z.string().min(1, 'La empresa es requerida'),
    incidentDate: z.string().min(1, 'La fecha es requerida'),
    incidentType: z.string().min(1, 'El tipo de incidente es requerido'),
    description: z.string().min(5, 'La descripción debe tener al menos 5 caracteres'),
    severity: z.enum(['Leve', 'Moderado', 'Grave', 'Fatal']),
    witnesses: z.string().optional(),
    actionsTaken: z.string().optional(),
    reportedBy: z.string().min(1, 'El reportador es requerido'),
});

export type OccupationalIncident = z.infer<typeof OccupationalIncidentSchema>;
