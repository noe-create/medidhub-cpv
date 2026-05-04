const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

if (!process.env.DATABASE_URL && process.env.POSTGRES_URL) {
  process.env.DATABASE_URL = process.env.POSTGRES_URL;
}

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      persona: {
        include: {
          paciente: true
        }
      },
    },
  });

  console.log('--- USER CHECK ---');
  users.forEach(u => {
    const personaName = u.persona ? (u.persona.primerNombre + ' ' + u.persona.primerApellido) : 'MISSING';
    const isPatient = u.persona?.paciente ? 'YES' : 'NO';
    console.log(`User: ${u.username} | Persona: ${personaName} | PersonaID: ${u.personaId} | IsPatient: ${isPatient}`);
  });
}

main().finally(() => prisma.$disconnect());
