const { PrismaClient } = require('@prisma/client');
const pg = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

async function main() {
  const connectionString = process.env.POSTGRES_URL;
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const user = await prisma.user.findUnique({
      where: { username: 'aherrera' },
      include: {
        persona: {
          include: {
            paciente: true
          }
        },
      },
    });

    console.log('--- AHERRERA CHECK ---');
    if (!user) {
        console.log('User aherrera NOT FOUND');
    } else {
        console.log('User ID:', user.id);
        console.log('Username:', user.username);
        console.log('Persona ID:', user.personaId);
        if (user.persona) {
            console.log('Persona Name:', user.persona.primerNombre, user.persona.primerApellido);
            console.log('Is Patient:', !!user.persona.paciente);
        } else {
            console.log('Persona: MISSING');
        }
        
        const doctor = await prisma.doctor.findFirst({
            where: { userId: user.id }
        });
        console.log('Is Doctor:', !!doctor);
    }

    const allUsersCount = await prisma.user.count();
    const usersWithoutPersona = await prisma.user.count({
        where: { personaId: null }
    });
    console.log('\n--- SYSTEM AUDIT ---');
    console.log('Total Users:', allUsersCount);
    console.log('Users without Persona:', usersWithoutPersona);
    
    if (usersWithoutPersona > 0) {
        const samples = await prisma.user.findMany({
            where: { personaId: null },
            take: 5
        });
        console.log('Sample users without persona:', samples.map(u => u.username));
    }

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
