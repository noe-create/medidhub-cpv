'use server';

import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getDashboardStats() {
    try {
        const db = await getDb();
        const today = new Date().toISOString().split('T')[0];

        // Parallelize queries for performance
        const results = await Promise.all([
            // Waiting List
            db.get<{ count: number }>(`SELECT COUNT(*) as count FROM waitlist WHERE status = 'En espera'`),
            // In Consultation
            db.get<{ count: number }>(`SELECT COUNT(*) as count FROM waitlist WHERE status = 'En consulta'`),
            // Total Patients
            db.get<{ count: number }>(`SELECT COUNT(*) as count FROM pacientes`),
            // Companies
            db.get<{ count: number }>(`SELECT COUNT(*) as count FROM empresas`),
            // Occupational Evaluations
            db.get<{ count: number }>(`SELECT COUNT(*) as count FROM occupational_health_evaluations`),
            // Users
            db.get<{ count: number }>(`SELECT COUNT(*) as count FROM users`),
            // Beneficiaries
            db.get<{ count: number }>(`SELECT COUNT(*) as count FROM beneficiarios`),
            // Titulars
            db.get<{ count: number }>(`SELECT COUNT(*) as count FROM titulares`),
        ]);

        return {
            waitlist: results[0]?.count || 0,
            inConsultation: results[1]?.count || 0,
            patients: results[2]?.count || 0,
            companies: results[3]?.count || 0,
            occupationalEvaluations: results[4]?.count || 0,
            users: results[5]?.count || 0,
            beneficiaries: results[6]?.count || 0,
            titulars: results[7]?.count || 0,
        };
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return {
            waitlist: 0,
            inConsultation: 0,
            patients: 0,
            companies: 0,
            occupationalEvaluations: 0,
            users: 0,
            beneficiaries: 0,
            titulars: 0,
        };
    }
}
