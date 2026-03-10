
import { getDb } from './src/lib/db';
import * as fs from 'fs';

async function debug() {
    process.env.POSTGRES_URL = "postgresql://postgres:j-*75*55861@localhost:5432/medihub";
    const db = await getDb();

    const units = await db.all('SELECT DISTINCT "unidadServicio" FROM titulares');
    const logs = [];
    logs.push('--- UNIDADES DE SERVICIO ---');
    units.forEach(u => logs.push(u.unidadServicio));

    const noe = await db.all('SELECT p."primerNombre", p."primerApellido", t."unidadServicio" FROM personas p JOIN titulares t ON p.id = t."personaId" WHERE p."primerNombre" ILIKE \'%noe%\' OR p."primerApellido" ILIKE \'%noe%\'');
    logs.push('\n--- BUSQUEDA DE NOE ---');
    noe.forEach(n => logs.push(`${n.primerNombre} ${n.primerApellido} - Unidad: ${n.unidadServicio}`));

    fs.writeFileSync('debug_results.txt', logs.join('\n'), 'utf8');
    console.log('Results written to debug_results.txt');
}

debug().catch(console.error);
