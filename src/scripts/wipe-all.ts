import { getDb } from '../lib/db';

async function wipe() {
    const db = await getDb();
    console.log('Iniciando borrado total de personas...');

    // Cascade delete handles patients, etc.
    const result = await db.run(`DELETE FROM personas`);

    console.log(`Borrado completado. Se eliminaron ${result.changes} registros.`);
    process.exit(0);
}

wipe().catch(err => {
    console.error('Error durante el borrado:', err);
    process.exit(1);
});
