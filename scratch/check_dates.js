const { Pool } = require('pg');
require('dotenv').config();

async function checkDates() {
    const pool = new Pool({
        connectionString: process.env.POSTGRES_URL,
        ssl: false
    });
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT "fechaNacimiento" FROM personas LIMIT 5');
        console.log('RECORDS FROM PERSONAS:');
        console.log(res.rows);
        
        const res2 = await client.query('SELECT "fecha_nacimiento" FROM users LIMIT 5');
        console.log('RECORDS FROM USERS:');
        console.log(res2.rows);
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        await pool.end();
    }
}

checkDates();
