import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function wipe() {
    console.log('Iniciando borrado total de personas...');

    // Cascade delete handles patients, etc.
    const result = await prisma.persona.deleteMany();

    console.log(`Borrado completado. Se eliminaron ${result.count} registros.`);
    await prisma.$disconnect();
    process.exit(0);
}

wipe().catch(async (err) => {
    console.error('Error durante el borrado:', err);
    await prisma.$disconnect();
    process.exit(1);
});
