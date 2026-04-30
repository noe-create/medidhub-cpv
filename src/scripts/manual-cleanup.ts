import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
    console.log('Iniciando limpieza manual de importación fallida...');

    // Borrar personas donde el apellido contiene 'GMT' (indicando que la fecha se desplazó allí)
    const result = await prisma.persona.deleteMany({
        where: {
            primerApellido: {
                contains: 'GMT-'
            }
        }
    });

    console.log(`Limpieza completada. Se eliminaron ${result.count} registros erróneos.`);
    await prisma.$disconnect();
    process.exit(0);
}

cleanup().catch(async (err) => {
    console.error('Error durante la limpieza:', err);
    await prisma.$disconnect();
    process.exit(1);
});
