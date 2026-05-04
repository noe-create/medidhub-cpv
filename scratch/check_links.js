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
    const persona = await prisma.persona.findUnique({
        where: { id: 3 },
        include: {
            paciente: true,
            doctor: true
        }
    });

    console.log('--- PERSONA 3 (aherrera) LINKS ---');
    console.log('Is Patient:', !!persona.paciente);
    console.log('Is Doctor:', persona.doctor.length > 0);
    if (persona.doctor.length > 0) {
        console.log('Doctor Data:', persona.doctor[0]);
    }

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
