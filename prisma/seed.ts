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

const DEMO_PACKAGES = [
  { unit: 'A-304', recipientName: 'Ana Martínez', carrier: 'DHL', trackingReference: 'DHL-5521983', pickupCode: '482913' },
  { unit: 'B-103', recipientName: 'Elena Ruiz', carrier: 'FedEx', trackingReference: 'FDX-7730214', pickupCode: '105627' },
  { unit: 'B-205', recipientName: 'Jorge Salas', carrier: 'Estafeta', trackingReference: 'EST-629483715', pickupCode: '739450' },
  { unit: 'B-402', recipientName: 'Sofía Herrera', carrier: 'DHL', trackingReference: 'DHL-5522107', pickupCode: '260318' },
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

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { role: "ADMINISTRADOR" },
    create: { email: "admin@example.com", passwordHash, unit: "ADMIN", role: "ADMINISTRADOR" },
  });

  console.log(`Administrador demo listo: ${admin.email} / ${DEMO_PASSWORD}`);

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

  if ((await prisma.package.count()) > 0) return;

  const guard = await prisma.user.findUniqueOrThrow({
    where: { email: 'ricardo.soto@example.com' },
  });
  console.log('Paquetes demo (folio · código de retiro):');
  for (const demo of DEMO_PACKAGES) {
    const unit = await prisma.unit.findUniqueOrThrow({ where: { code: demo.unit } });
    const [{ value }] = await prisma.$queryRaw<{ value: bigint }[]>`
      SELECT nextval(pg_get_serial_sequence('packages', 'number')) AS value
    `;
    const number = Number(value);
    const folio = `PAQ-${new Date().getFullYear()}-${String(number).padStart(4, '0')}`;
    await prisma.package.create({
      data: {
        number,
        folio,
        pickupCode: demo.pickupCode,
        unitId: unit.id,
        receivedById: guard.id,
        recipientName: demo.recipientName,
        carrier: demo.carrier,
        trackingReference: demo.trackingReference,
        description: '1 caja mediana de cartón, cerrada.',
      },
    });
    console.log(`  ${folio} · ${demo.pickupCode} · ${demo.recipientName} (${demo.unit})`);
  }
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
