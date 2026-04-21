const { Pool } = require('pg');
require('dotenv').config();

async function fixDb() {
    const pool = new Pool({
        connectionString: process.env.POSTGRES_URL,
        ssl: false
    });
    const client = await pool.connect();
    try {
        console.log('Running manual migration...');
        
        await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "fecha_nacimiento" TEXT');
        console.log('Migration for users table finished.');
        
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

fixDb();
