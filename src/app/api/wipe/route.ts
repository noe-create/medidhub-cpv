import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function GET() {
    try {
        const res = await prisma.persona.deleteMany();
        revalidatePath('/dashboard/personas');
        return NextResponse.json({ success: true, deleted: res.count });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
