
import { getDb } from './src/lib/db';

async function check() {
    const db = await getDb();
    const roles = await db.all('SELECT * FROM roles');
    const users = await db.all('SELECT id, username, "roleId" FROM users');
    console.log('--- ROLES ---');
    console.log(JSON.stringify(roles, null, 2));
    console.log('--- USERS ---');
    console.log(JSON.stringify(users, null, 2));
}

check();
