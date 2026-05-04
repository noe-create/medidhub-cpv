const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserAndPersona() {
  const user = await prisma.user.findUnique({
    where: { username: 'aherrera' },
    include: { persona: true }
  });

  console.log('--- USER INFO ---');
  console.log(JSON.stringify(user, null, 2));

  if (user && user.personaId) {
    const persona = await prisma.persona.findUnique({
      where: { id: user.personaId }
    });
    console.log('--- PERSONA INFO ---');
    console.log(JSON.stringify(persona, null, 2));
  } else {
    console.log('User has no persona linked or user not found.');
  }

  // Also check all personas to see if there's any other "Alejandro"
  const alejandros = await prisma.persona.findMany({
    where: {
      OR: [
        { primerNombre: { contains: 'alejandro', mode: 'insensitive' } },
        { primerApellido: { contains: 'herrera', mode: 'insensitive' } }
      ]
    }
  });
  console.log('--- PERSONAS MATCHING "ALEJANDRO" or "HERRERA" ---');
  console.log(JSON.stringify(alejandros, null, 2));

  await prisma.$disconnect();
}

checkUserAndPersona();
