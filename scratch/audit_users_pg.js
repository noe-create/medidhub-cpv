const { Pool } = require('pg');
require('dotenv').config();

async function main() {
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
  });
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT username, "personaId" FROM users');
    console.log('--- USERS ---');
    console.table(res.rows);

    const res2 = await client.query('SELECT id, "primerNombre", "primerApellido" FROM personas');
    console.log('--- PERSONAS ---');
    console.table(res2.rows);

  } catch (e) {
    console.error(e);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
