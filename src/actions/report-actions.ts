'use server';

import { getDb } from '@/lib/db';
import { MorbidityReportRow } from '@/lib/types';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

export async function getMorbidityStats(params: { from: Date; to: Date }): Promise<MorbidityReportRow[]> {
    const db = await getDb();
    const { from, to } = params;
    const fromDate = startOfDay(from).toISOString();
    const toDate = endOfDay(to).toISOString();

    const rawRows = await db.all<any>(
        `SELECT TRIM(UPPER("cie10Description")) as raw_desc, COUNT(*) as frequency
         FROM consultation_diagnoses
         WHERE "consultationId" IN (
            SELECT id FROM consultations WHERE "consultationDate" BETWEEN ? AND ?
         )
         GROUP BY TRIM(UPPER("cie10Description"))
         ORDER BY frequency DESC`,
        [fromDate, toDate]
    );

    // Formatear texto para que se vea presentable (capitalize primera letra)
    return rawRows.map(row => {
        const desc = row.raw_desc || 'SIN DIAGNÓSTICO';
        const formattedDesc = desc !== 'SIN DIAGNÓSTICO' ? (desc.charAt(0).toUpperCase() + desc.slice(1).toLowerCase()) : desc;
        return {
            cie10Code: 'AUTO',
            cie10Description: formattedDesc,
            frequency: parseInt(row.frequency)
        };
    });
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
         ) combined_dates
         GROUP BY (dt::date)
         ORDER BY (dt::date) ASC`,
        [fromDate, toDate]
    );

    return rows.map(r => ({
        date: r.day instanceof Date ? r.day.toISOString() : r.day,
        count: parseInt(r.count)
    }));
}

export async function getWeeklyConsultationVolume(params: { from: Date; to: Date }): Promise<{ week: string; count: number }[]> {
    const db = await getDb();
    const { from, to } = params;
    const fromDate = startOfDay(from).toISOString();
    const toDate = endOfDay(to).toISOString();

    // Grouping by ISO week for better trend analysis
    // We use to_char(dt::timestamp, 'IYYY-IW') for ISO week grouping in PostgreSQL
    const rows = await db.all<any>(
        `SELECT to_char(dt::timestamp, 'IYYY-IW') as week_str, MIN(dt) as first_day, COUNT(*) as count 
         FROM (
             SELECT "consultationDate" as dt FROM consultations WHERE "consultationDate" BETWEEN ? AND ?
         ) combined_dates
         GROUP BY week_str
         ORDER BY week_str ASC`,
        [fromDate, toDate]
    );

    return rows.map(r => ({
        week: r.first_day, // We use the first day of the week for display purposes
        count: parseInt(r.count)
    }));
}
