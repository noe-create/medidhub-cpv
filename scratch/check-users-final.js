
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        include: {
            persona: true
        }
    });

    let output = '--- USERS ---\n';
    users.forEach(u => {
        output += `User: ${u.username} (ID: ${u.id})\n`;
        if (u.persona) {
            output += `  Persona: ${u.persona.nombres} ${u.persona.apellidos} (ID: ${u.persona.id}, Cedula: ${u.persona.cedula})\n`;
        } else {
            output += '  Persona: NULL\n';
        }
    });
    
    fs.writeFileSync('scratch/users_output.txt', output);
    console.log('Output written to scratch/users_output.txt');
}

main()
    .catch(e => {
        fs.writeFileSync('scratch/users_output.txt', e.stack);
    })
    .finally(() => prisma.$disconnect());
