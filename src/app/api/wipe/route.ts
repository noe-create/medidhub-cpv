import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function GET() {
    try {
        const db = await getDb();
        const res = await db.run('DELETE FROM personas');
        revalidatePath('/dashboard/personas');
        return NextResponse.json({ success: true, deleted: res.changes });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
