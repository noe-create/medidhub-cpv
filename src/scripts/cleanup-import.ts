import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
    console.log('Iniciando limpieza de importación fallida...');

    // Borrar personas creadas después de una fecha específica
    const result = await prisma.persona.deleteMany({
        where: {
            createdAt: {
                gt: new Date('2026-04-20T18:00:00.000Z')
            }
        }
    });

    console.log(`Limpieza completada. Se eliminaron ${result.count} registros de personas.`);
    await prisma.$disconnect();
    process.exit(0);
}

cleanup().catch(async (err) => {
    console.error('Error durante la limpieza:', err);
    await prisma.$disconnect();
    process.exit(1);
});
