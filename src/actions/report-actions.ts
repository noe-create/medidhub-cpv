'use server';

import { prisma } from '@/lib/prisma';
import { MorbidityReportRow } from '@/lib/types';
import { startOfDay, endOfDay } from 'date-fns';

export async function getMorbidityStats(params: { from: Date; to: Date }): Promise<MorbidityReportRow[]> {
    const { from, to } = params;
    const fromDate = startOfDay(from);
    const toDate = endOfDay(to);

    const rawRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT TRIM(UPPER("cie10Description")) as raw_desc, COUNT(*)::int as frequency
         FROM consultation_diagnoses
         WHERE "consultationId" IN (
            SELECT id FROM consultations WHERE "consultationDate" BETWEEN $1 AND $2
         )
         GROUP BY TRIM(UPPER("cie10Description"))
         ORDER BY frequency DESC`,
        fromDate, toDate
    );

    // Formatear texto para que se vea presentable (capitalize primera letra)
    return rawRows.map(row => {
        const desc = row.raw_desc || 'SIN DIAGNÓSTICO';
        const formattedDesc = desc !== 'SIN DIAGNÓSTICO' ? (desc.charAt(0).toUpperCase() + desc.slice(1).toLowerCase()) : desc;
        return {
            cie10Code: 'AUTO',
            cie10Description: formattedDesc,
            frequency: row.frequency
        };
    });
}


export async function getConsultationVolume(params: { from: Date; to: Date }): Promise<{ date: string; count: number }[]> {
    const { from, to } = params;
    const fromDate = startOfDay(from);
    const toDate = endOfDay(to);

    // Combined volume of General Consultations
    const rows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT (dt::date)::text as day, COUNT(*)::int as count 
         FROM (
             SELECT "consultationDate" as dt FROM consultations WHERE "consultationDate" BETWEEN $1 AND $2
         ) combined_dates
         GROUP BY (dt::date)
         ORDER BY (dt::date) ASC`,
        fromDate, toDate
    );

    return rows.map(r => ({
        date: r.day,
        count: r.count
    }));
}

export async function getWeeklyConsultationVolume(params: { from: Date; to: Date }): Promise<{ week: string; count: number }[]> {
    const { from, to } = params;
    const fromDate = startOfDay(from);
    const toDate = endOfDay(to);

    // Grouping by ISO week for better trend analysis
    const rows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT to_char(dt::timestamp, 'IYYY-IW') as week_str, MIN(dt)::text as first_day, COUNT(*)::int as count 
         FROM (
             SELECT "consultationDate" as dt FROM consultations WHERE "consultationDate" BETWEEN $1 AND $2
         ) combined_dates
         GROUP BY week_str
         ORDER BY week_str ASC`,
        fromDate, toDate
    );

    return rows.map(r => ({
        week: r.first_day,
        count: r.count
    }));
}
