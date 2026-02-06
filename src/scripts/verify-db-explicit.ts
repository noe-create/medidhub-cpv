
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';

// Setup environment
dotenv.config({ path: path.join(process.cwd(), '.env') });

const { Pool } = pg;

async function testConnection() {
    console.log("--- PRUEBA DE CONEXIÓN (PARÁMETROS EXPLÍCITOS) ---");
    const connectionString = process.env.POSTGRES_URL;

    if (!connectionString) {
        console.error("ERROR: No POSTGRES_URL");
        return;
    }

    try {
        // Manually parse the connection string to separate components
        // format: postgresql://user:password@host:port/database
        const regex = /postgresql:\/\/(.+):(.+)@(.+):(\d+)\/(.+)/;
        const match = connectionString.match(regex);

        if (!match) {
            console.error("Error: El formato de POSTGRES_URL no coincide con el esperado.");
            console.error("Esperado: postgresql://user:password@host:port/database");
            return;
        }

        const config = {
            user: match[1],
            password: match[2],
            host: match[3],
            port: parseInt(match[4]),
            database: match[5],
        };

        console.log(`Intentando conectar con:`);
        console.log(`User: ${config.user}`);
        console.log(`Host: ${config.host}`);
        console.log(`Port: ${config.port}`);
        console.log(`Database: ${config.database}`);
        console.log(`Password: ${config.password} (Length: ${config.password.length})`);

        const pool = new Pool(config);

        const client = await pool.connect();
        console.log("¡CONEXIÓN EXITOSA! (Usando parámetros explícitos)");
        console.log("Esto significa que la contraseña ES CORRECTA, pero el formato URL estaba causando problemas.");
        client.release();
        await pool.end();

    } catch (err: any) {
        console.error("--- FALLO LA CONEXIÓN ---");
        console.error(err.message);
        if (err.code === '28P01') {
            console.error("CONCLUSIÓN: La contraseña es DEFINITIVAMENTE incorrecta.");
        }
    }
}

testConnection();
