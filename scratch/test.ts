import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      persona: true,
    },
  });

  console.log('ID | Username | Persona Name | Persona ID');
  console.log('---|----------|--------------|-----------');
  users.forEach(u => {
    const name = u.persona ? `${u.persona.primerNombre} ${u.persona.primerApellido}` : 'NONE';
    console.log(`${u.id} | ${u.username} | ${name} | ${u.personaId}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
