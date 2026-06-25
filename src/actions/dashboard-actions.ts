'use server';

import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export async function getDashboardStats() {
    try {
        const now = new Date();
        const start = startOfDay(now);
        const end = endOfDay(now);

        // Parallelize queries for performance using Prisma count
        const [
            waitlist,
            inConsultation,
            patients,
            companies,
            occupationalEvaluations,
            users,
            beneficiaries,
            titulars,
            todayConsultations
        ] = await Promise.all([
            prisma.waitlistEntry.count({ where: { status: 'En espera' } }),
            prisma.waitlistEntry.count({ where: { status: 'En consulta' } }),
            prisma.paciente.count(),
            prisma.empresa.count(),
            prisma.occupationalHealthEvaluation.count(),
            prisma.user.count(),
            prisma.beneficiario.count(),
            prisma.titular.count(),
            prisma.consultation.count({ 
                where: { 
                    consultationDate: {
                        gte: start,
                        lte: end
                    } 
                } 
            }),
        ]);

        return {
            waitlist,
            inConsultation,
            patients,
            companies,
            occupationalEvaluations,
            users,
            beneficiaries,
            titulars,
            todayConsultations,
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
            todayConsultations: 0,
        };
    }
}
