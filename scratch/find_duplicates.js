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
    const personas = await prisma.persona.findMany({
        where: {
            OR: [
                { primerNombre: { contains: 'alejandro', mode: 'insensitive' } },
                { primerApellido: { contains: 'herrera', mode: 'insensitive' } }
            ]
        },
        include: {
            user: true,
            paciente: true,
            doctor: true
        }
    });

    console.log('--- PERSONAS MATCHING "alejandro herrera" ---');
    console.log(JSON.stringify(personas, null, 2));

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
