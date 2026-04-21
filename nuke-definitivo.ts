
import { getDb } from './src/lib/db';

async function nuke() {
    console.log("Nuking for CI fix final...");
    const db = await getDb();
    try {
        await db.exec('BEGIN');
        await db.run('DELETE FROM beneficiarios');
        await db.run('DELETE FROM titulares');
        await db.run('DELETE FROM waitlist');
        await db.run('DELETE FROM pacientes WHERE "personaId" NOT IN (SELECT "personaId" FROM users WHERE "personaId" IS NOT NULL)');
        await db.run('DELETE FROM personas WHERE id NOT IN (SELECT "personaId" FROM users WHERE "personaId" IS NOT NULL) AND id NOT IN (SELECT "representanteId" FROM personas WHERE "representanteId" IS NOT NULL)');
        await db.exec('COMMIT');
        console.log("Cleanup complete.");
    } catch (e) {
        await db.exec('ROLLBACK');
        console.error(e);
    }
}
nuke();
