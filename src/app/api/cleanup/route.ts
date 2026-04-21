import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function GET() {
    try {
        const db = await getDb();
        const result = await db.run(`DELETE FROM personas WHERE "primerApellido" LIKE '%GMT-%'`);
        revalidatePath('/dashboard/personas');
        return NextResponse.json({ 
            success: true, 
            deleted: result.changes,
            message: 'Limpieza realizada con éxito.' 
        });
    } catch (error: any) {
        return NextResponse.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
}
