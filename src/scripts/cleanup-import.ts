import { getDb } from '../lib/db';

async function cleanup() {
    const db = await getDb();
    console.log('Iniciando limpieza de importación fallida...');

    // Borrar personas creadas hoy después de las 19:00 UTC (ajustar según sea necesario)
    // Usamos un patrón que capture los IDs generados por generateId('p') y la fecha reciente
    const result = await db.run(
        `DELETE FROM personas 
         WHERE id LIKE 'p-%' 
         AND "createdAt" > '2026-04-20T18:00:00.000Z'` 
    );

    console.log(`Limpieza completada. Se eliminaron ${result.changes} registros de personas.`);
    process.exit(0);
}

cleanup().catch(err => {
    console.error('Error durante la limpieza:', err);
    process.exit(1);
});
