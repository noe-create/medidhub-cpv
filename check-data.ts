
import { getDb } from './src/lib/db';

async function checkPersonas() {
    const db = await getDb();
    try {
        const res = await db.all(`
            SELECT id, "primerNombre", "primerApellido", "cedulaNumero" 
            FROM personas 
            ORDER BY "createdAt" DESC, id DESC 
            LIMIT 15
        `);
        console.table(res);
        
        const countResult = await db.get<{ count: string | number }>("SELECT COUNT(*) as count FROM personas");
        console.log(`Total personas: ${countResult?.count || 0}`);
    } catch (e) {
        console.error("Query failed:", e);
    }
}

checkPersonas();
