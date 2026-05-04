
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        include: {
            persona: true
        }
    });

    console.log('--- USERS ---');
    users.forEach(u => {
        console.log(`User: ${u.username} (ID: ${u.id})`);
        if (u.persona) {
            console.log(`  Persona: ${u.persona.nombres} ${u.persona.apellidos} (ID: ${u.persona.id}, Cedula: ${u.persona.cedula})`);
        } else {
            console.log('  Persona: NULL');
        }
    });
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
