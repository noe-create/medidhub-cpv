const { Client } = require('pg');

const connectionString = 'postgresql://postgres:cpv@localhost:5432/medihub';

async function checkUsers() {
    const client = new Client({ connectionString });
    try {
        await client.connect();

        // Check users
        const res = await client.query('SELECT id, username, "roleId" FROM users');
        console.log('👥 Usuarios encontrados:', res.rows.length);
        res.rows.forEach(u => {
            console.log(` - User: ${u.username}, Role: ${u.roleId}`);
        });

        // Check if password hash looks valid (starts with $2)
        // We won't print the hash for security, just check format
        const hashCheck = await client.query('SELECT password FROM users WHERE username = $1', ['superuser']);
        if (hashCheck.rows.length > 0) {
            const hash = hashCheck.rows[0].password;
            console.log(`🔑 Hash de superuser válido: ${hash.startsWith('$2')}`);
        } else {
            console.log('❌ Usuario superuser NO encontrado.');
        }

        await client.end();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkUsers();
