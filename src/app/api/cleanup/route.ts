import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function GET() {
    try {
        const result = await prisma.persona.deleteMany({
            where: {
                primerApellido: {
                    contains: 'GMT-'
                }
            }
        });
        revalidatePath('/dashboard/personas');
        return NextResponse.json({ 
            success: true, 
            deleted: result.count,
            message: 'Limpieza realizada con éxito.' 
        });
    } catch (error: any) {
        return NextResponse.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
}
