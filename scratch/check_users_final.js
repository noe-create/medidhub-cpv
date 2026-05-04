const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      persona: true,
    },
  });

  console.log('--- USER CHECK ---');
  users.forEach(u => {
    console.log(`User: ${u.username} | PersonaID: ${u.personaId} | Name: ${u.persona ? (u.persona.primerNombre + ' ' + u.persona.primerApellido) : 'MISSING'}`);
  });
}

main().finally(() => prisma.$disconnect());
