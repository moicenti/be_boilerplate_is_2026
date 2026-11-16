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

const DAY_MS = 24 * 60 * 60 * 1000;

type DemoPackage = {
  unit: string;
  recipientName: string;
  carrier: string;
  trackingReference: string;
  pickupCode: string;
  receivedDaysAgo?: number;
  deliveredTo?: string;
};

const DEMO_PACKAGES: DemoPackage[] = [
  { unit: 'A-304', recipientName: 'Ana Martínez', carrier: 'DHL', trackingReference: 'DHL-5521983', pickupCode: '482913' },
  { unit: 'B-103', recipientName: 'Elena Ruiz', carrier: 'FedEx', trackingReference: 'FDX-7730214', pickupCode: '105627' },
  { unit: 'B-205', recipientName: 'Jorge Salas', carrier: 'Estafeta', trackingReference: 'EST-629483715', pickupCode: '739450' },
  { unit: 'B-402', recipientName: 'Sofía Herrera', carrier: 'DHL', trackingReference: 'DHL-5522107', pickupCode: '260318' },
  { unit: 'A-19', recipientName: 'Demo Residente', carrier: 'Amazon', trackingReference: 'AMZ-1190044', pickupCode: '318204', receivedDaysAgo: 9, deliveredTo: 'Demo Residente' },
  { unit: 'A-19', recipientName: 'Demo Residente', carrier: 'FedEx', trackingReference: 'FDX-7731188', pickupCode: '640517', receivedDaysAgo: 4, deliveredTo: 'Carmen López' },
  { unit: 'A-19', recipientName: 'Demo Residente', carrier: 'DHL', trackingReference: 'DHL-5523360', pickupCode: '905731', receivedDaysAgo: 1 },
  { unit: 'A-19', recipientName: 'Demo Residente', carrier: 'Estafeta', trackingReference: 'EST-629500218', pickupCode: '271846' },
];

const DEMO_ASSEMBLIES: {
  title: string;
  proposal: string;
  description: string;
  type: 'ORDINARIA' | 'EXTRAORDINARIA';
  meetingInDays: number;
  published: boolean;
  agenda: string[];
}[] = [
  {
    title: 'Señalización de estacionamiento',
    proposal: 'Pintar y señalizar los cajones de visitas',
    description: 'Renovar la señalización horizontal del estacionamiento de visitas.',
    type: 'EXTRAORDINARIA',
    meetingInDays: -38,
    published: true,
    agenda: ['Diagnóstico de la señalización', 'Cotizaciones recibidas'],
  },
  {
    title: 'Renovación de luminarias',
    proposal: 'Cambiar luminarias del jardín a LED',
    description: 'Sustituir las luminarias del jardín por tecnología LED para reducir consumo.',
    type: 'EXTRAORDINARIA',
    meetingInDays: -18,
    published: true,
    agenda: ['Consumo eléctrico actual', 'Propuesta de luminarias LED'],
  },
  {
    title: 'Mantenimiento de la casa club',
    proposal: 'Aprobar el mantenimiento anual de la casa club',
    description: 'Pintura, impermeabilización y revisión eléctrica de la casa club.',
    type: 'ORDINARIA',
    meetingInDays: -1,
    published: true,
    agenda: ['Estado de la casa club', 'Presupuesto de mantenimiento'],
  },
  {
    title: 'Reglamento de mascotas',
    proposal: 'Actualizar el reglamento de mascotas en áreas comunes',
    description: 'Definir horarios y zonas permitidas para mascotas en áreas comunes.',
    type: 'ORDINARIA',
    meetingInDays: 6,
    published: true,
    agenda: ['Quejas recibidas', 'Propuesta de reglamento'],
  },
  {
    title: 'Mejora del jardín central',
    proposal: 'Renovar el sistema de riego del jardín central',
    description: 'Sustituir los aspersores dañados e instalar un programador de riego.',
    type: 'EXTRAORDINARIA',
    meetingInDays: 10,
    published: false,
    agenda: [
      'Estado actual del jardín',
      'Presentación de la propuesta de riego',
      'Dudas y apertura de la votación',
    ],
  },
];

const STAFF = [
  { email: 'ricardo.soto@example.com', role: Role.SEGURIDAD },
  { email: 'laura.admin@example.com', role: Role.ADMINISTRADOR },
  { email: 'mario.d@example.com', role: Role.MANTENIMIENTO },
];

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // 1. Crear unidades primero
  for (const unit of UNITS) {
    await prisma.unit.upsert({
      where: { code: unit.code },
      update: {},
      create: unit,
    });
  }
  console.log(`Unidades listas: ${UNITS.length}`);

  // 2. Lookup de unitIds por código
  const unitByCode = new Map(
    (await prisma.unit.findMany({ select: { id: true, code: true } })).map(
      (u) => [u.code, u.id],
    ),
  );

  // 3. Usuario demo (A-19)
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { unitId: unitByCode.get('A-19') ?? null },
    create: {
      email: DEMO_EMAIL,
      passwordHash,
      unitId: unitByCode.get('A-19') ?? null,
    },
  });
  console.log(`Usuario demo listo: ${user.email} / ${DEMO_PASSWORD}`);

  // 4. Otro usuario (A-20)
  const user2 = await prisma.user.upsert({
    where: { email: 'otro@example.com' },
    update: { unitId: unitByCode.get('A-20') ?? null },
    create: {
      email: 'otro@example.com',
      passwordHash,
      unitId: unitByCode.get('A-20') ?? null,
    },
  });
  console.log(`Usuario demo listo: ${user2.email} / ${DEMO_PASSWORD}`);

  // 5. Admin (sin unidad)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { role: 'ADMINISTRADOR', unitId: null },
    create: {
      email: 'admin@example.com',
      passwordHash,
      role: 'ADMINISTRADOR',
      unitId: null,
    },
  });
  console.log(`Administrador demo listo: ${admin.email} / ${DEMO_PASSWORD}`);

  // 6. Staff (sin unidad)
  for (const staff of STAFF) {
    const created = await prisma.user.upsert({
      where: { email: staff.email },
      update: { role: staff.role, unitId: null },
      create: {
        email: staff.email,
        passwordHash,
        role: staff.role,
        unitId: null,
      },
    });
    console.log(`Usuario ${staff.role} listo: ${created.email} / ${DEMO_PASSWORD}`);
  }

  // 7. Paquetes demo
  const guard = await prisma.user.findUniqueOrThrow({
    where: { email: 'ricardo.soto@example.com' },
  });
  console.log('Paquetes demo (folio · código de retiro):');
  for (const demo of DEMO_PACKAGES) {
    const exists = await prisma.package.findFirst({
      where: { trackingReference: demo.trackingReference },
    });
    if (exists) continue;

    const unit = await prisma.unit.findUniqueOrThrow({ where: { code: demo.unit } });
    const [{ value }] = await prisma.$queryRaw<{ value: bigint }[]>`
      SELECT nextval(pg_get_serial_sequence('packages', 'number')) AS value
    `;
    const number = Number(value);
    const folio = `PAQ-${new Date().getFullYear()}-${String(number).padStart(4, '0')}`;
    const receivedAt = new Date(Date.now() - (demo.receivedDaysAgo ?? 0) * DAY_MS);
    await prisma.package.create({
      data: {
        number,
        folio,
        pickupCode: demo.pickupCode,
        unitId: unit.id,
        receivedById: guard.id,
        receivedAt,
        recipientName: demo.recipientName,
        carrier: demo.carrier,
        trackingReference: demo.trackingReference,
        description: '1 caja mediana de cartón, cerrada.',
        ...(demo.deliveredTo
          ? {
              status: 'ENTREGADO' as const,
              deliveredTo: demo.deliveredTo,
              deliveredById: guard.id,
              deliveredAt: new Date(receivedAt.getTime() + 5 * 60 * 60 * 1000),
            }
          : {}),
      },
    });
    console.log(
      `  ${folio} · ${demo.deliveredTo ? 'entregado' : demo.pickupCode} · ${demo.recipientName} (${demo.unit})`,
    );
  }

  // 8. Asambleas demo
  const admin2 = await prisma.user.findUniqueOrThrow({ where: { email: 'admin@example.com' } });
  console.log('Asambleas demo:');
  for (const demo of DEMO_ASSEMBLIES) {
    if (await prisma.assembly.findFirst({ where: { title: demo.title } })) continue;

    const [{ value }] = await prisma.$queryRaw<{ value: bigint }[]>`
      SELECT nextval(pg_get_serial_sequence('asambleas', 'number')) AS value
    `;
    const number = Number(value);
    const folio = `ASM-${new Date().getFullYear()}-${String(number).padStart(3, '0')}`;
    const startsAt = new Date(Date.now() + demo.meetingInDays * DAY_MS);
    await prisma.assembly.create({
      data: {
        number,
        folio,
        title: demo.title,
        type: demo.type,
        modality: 'PRESENCIAL',
        startsAt,
        endsAt: new Date(startsAt.getTime() + 90 * 60 * 1000),
        location: 'Salón de eventos · Casa club · Los Olivos',
        description: demo.description,
        publishedAt: demo.published
          ? new Date(startsAt.getTime() - 7 * DAY_MS)
          : null,
        createdById: admin2.id,
        agendaItems: {
          create: demo.agenda.map((title, position) => ({ title, position })),
        },
        topics: {
          create: [
            {
              title: demo.proposal,
              description: demo.description,
              opensAt: new Date(startsAt.getTime() + 90 * 60 * 1000),
              closesAt: new Date(startsAt.getTime() + 90 * 60 * 1000 + 3 * DAY_MS),
              position: 0,
              options: {
                create: ['A favor', 'En contra', 'Abstención'].map((text, position) => ({
                  text,
                  position,
                })),
              },
            },
          ],
        },
      },
    });
    console.log(`  ${folio} · ${demo.title}`);
  }
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}