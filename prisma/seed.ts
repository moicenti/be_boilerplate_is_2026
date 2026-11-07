import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '../src/generated/prisma/client.js';

const DEMO_EMAIL = 'demo@example.com';
const DEMO_PASSWORD = 'Demo1234!';

const UNITS = [
  { code: 'A-19', tower: 'Torre A', description: 'Torre A, departamento 19' },
  { code: 'A-20', tower: 'Torre A', description: 'Torre A, departamento 20' },
  { code: 'A-202', tower: 'Torre A', description: 'Torre A, departamento 202' },
  { code: 'A-304', tower: 'Torre A', description: 'Torre A, departamento 304' },
  { code: 'B-103', tower: 'Torre B', description: 'Torre B, departamento 103' },
  { code: 'B-205', tower: 'Torre B', description: 'Torre B, departamento 205' },
  { code: 'B-402', tower: 'Torre B', description: 'Torre B, departamento 402' },
];

const STAFF = [
  { email: 'ricardo.soto@example.com', role: Role.SEGURIDAD },
  { email: 'laura.admin@example.com', role: Role.ADMINISTRADOR },
];

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // `upsert` hace el seed idempotente: se puede correr las veces que haga falta.
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL, passwordHash, unit: "A-19" },
  });

  console.log(`Usuario demo listo: ${user.email} / ${DEMO_PASSWORD}`);
   const user2 = await prisma.user.upsert({
    where: { email: "otro@example.com" },
    update: {},
    create: { email: "otro@example.com", passwordHash, unit: "A-20" },
  });

  console.log(`Usuario demo listo: ${user2.email} / ${DEMO_PASSWORD}`);

  for (const unit of UNITS) {
    await prisma.unit.upsert({
      where: { code: unit.code },
      update: {},
      create: unit,
    });
  }
  console.log(`Unidades listas: ${UNITS.length}`);

  for (const staff of STAFF) {
    const created = await prisma.user.upsert({
      where: { email: staff.email },
      update: { role: staff.role },
      create: { email: staff.email, passwordHash, unit: '', role: staff.role },
    });
    console.log(`Usuario ${staff.role} listo: ${created.email} / ${DEMO_PASSWORD}`);
  }
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
