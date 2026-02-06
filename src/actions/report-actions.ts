'use server';

import { getDb } from '@/lib/db';
import { MorbidityReportRow } from '@/lib/types';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

export async function getMorbidityStats(params: { from: Date; to: Date }): Promise<MorbidityReportRow[]> {
    const db = await getDb();
    const { from, to } = params;
    const fromDate = startOfDay(from).toISOString();
    const toDate = endOfDay(to).toISOString();

    return await db.all(
        `SELECT "cie10Code", "cie10Description", COUNT(*) as frequency
         FROM consultation_diagnoses
         WHERE "consultationId" IN (
            SELECT id FROM consultations WHERE "consultationDate" BETWEEN ? AND ?
         )
         GROUP BY "cie10Code", "cie10Description"
         ORDER BY frequency DESC`,
        [fromDate, toDate]
    );
}

export async function getAptitudeStats(params: { from: Date; to: Date }): Promise<{ status: string; count: number }[]> {
    const db = await getDb();
    const { from, to } = params;
    const fromDate = startOfDay(from).toISOString();
    const toDate = endOfDay(to).toISOString();

    // Query for fitnessForWork
    const result = await db.all<any>(
        `SELECT "fitnessForWork", COUNT(*) as count
         FROM occupational_health_evaluations
         WHERE "evaluationDate" BETWEEN ? AND ?
         GROUP BY "fitnessForWork"`,
        [fromDate, toDate]
    );

    // Normalize results to ensure all categories exist or at least formatted correctly
    return result.map(r => ({
        status: r.fitnessForWork || 'Sin Clasificar',
        count: r.count
    }));
}

export async function getConsultationVolume(params: { from: Date; to: Date }): Promise<{ date: string; count: number }[]> {
    const db = await getDb();
    const { from, to } = params;
    const fromDate = startOfDay(from).toISOString();
    const toDate = endOfDay(to).toISOString();

    // Combined volume of General Consultations + Occupational Evaluations
    // We union the dates and then group by date
    const rows = await db.all<any>(
        `SELECT (dt::date) as day, COUNT(*) as count 
         FROM (
             SELECT "consultationDate" as dt FROM consultations WHERE "consultationDate" BETWEEN ? AND ?
             UNION ALL
             SELECT "evaluationDate" as dt FROM occupational_health_evaluations WHERE "evaluationDate" BETWEEN ? AND ?
         ) combined_dates
         GROUP BY (dt::date)
         ORDER BY (dt::date) ASC`,
        [fromDate, toDate, fromDate, toDate]
    );

    return rows.map(r => ({
        date: r.day instanceof Date ? r.day.toISOString() : r.day,
        count: parseInt(r.count)
    }));
}
