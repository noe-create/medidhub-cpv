const { Pool } = require('pg');
require('dotenv').config();

async function main() {
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
  });
  const client = await pool.connect();
  try {
    console.log('Linking aherrera to persona ID 3...');
    const res = await client.query('UPDATE users SET "personaId" = 3 WHERE username = \'aherrera\'');
    console.log(`Update result: ${res.rowCount} row(s) updated.`);

    const check = await client.query('SELECT username, "personaId" FROM users WHERE username = \'aherrera\'');
    console.table(check.rows);

  } catch (e) {
    console.error(e);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
