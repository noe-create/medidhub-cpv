
import { getDb } from './src/lib/db';

async function checkSchema() {
    const db = await getDb();
    try {
        const res = await db.all(`
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public'
            ORDER BY table_name, column_name
        `);
        console.log(JSON.stringify(res, null, 2));
    } catch (e) {
        console.error("Schema check failed:", e);
    }
}

checkSchema();
