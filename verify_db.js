const { Client } = require('pg');

const connectionString = 'postgresql://postgres:cpv@localhost:5432/medihub';

async function testConnection() {
    console.log('--- Iniciando prueba de conexión ---');
    console.log(`Intentando conectar a: ${connectionString}`);

    const client = new Client({
        connectionString: connectionString,
    });

    try {
        await client.connect();
        console.log('✅ ¡Conexión exitosa!');

        // Check if database exists and runs a query
        const res = await client.query('SELECT NOW() as now');
        console.log('⏰ Hora en la DB:', res.rows[0].now);

        // Check tables
        const tablesRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    `);

        console.log('📊 Tablas encontradas:', tablesRes.rows.length);
        if (tablesRes.rows.length > 0) {
            tablesRes.rows.forEach(row => console.log(` - ${row.table_name}`));
        } else {
            console.log('⚠️ No se encontraron tablas (La base de datos está vacía).');
        }

        await client.end();
        console.log('--- Prueba finalizada exitosamente ---');
    } catch (err) {
        console.error('❌ Error de conexión:', err.message);
        if (err.code) console.error('Codigo de error:', err.code);
        console.error('Esto indica que las credenciales son incorrectas o el servidor Postgres no está escuchando.');
    }
}

testConnection();
