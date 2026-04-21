import { getDb } from '../lib/db';

async function cleanup() {
    const db = await getDb();
    console.log('Iniciando limpieza manual de importación fallida...');

    // Borrar personas donde el apellido contiene 'GMT' (indicando que la fecha se desplazó allí)
    const result = await db.run(
        `DELETE FROM personas WHERE "primerApellido" LIKE '%GMT-%'`
    );

    console.log(`Limpieza completada. Se eliminaron ${result.changes} registros erróneos.`);
    process.exit(0);
}

cleanup().catch(err => {
    console.error('Error durante la limpieza:', err);
    process.exit(1);
});
