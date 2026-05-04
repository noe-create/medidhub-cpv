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
    const allUsersCount = await prisma.user.count();
    const usersWithoutPersona = await prisma.user.findMany({
        where: { personaId: null },
        select: { username: true, id: true }
    });
    
    console.log('--- SYSTEM AUDIT ---');
    console.log('Total Users:', allUsersCount);
    console.log('Users without Persona Count:', usersWithoutPersona.length);
    console.log('Users without Persona List:', usersWithoutPersona.map(u => u.username));

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
