import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '../src/generated/prisma/client.js';

const DEMO_EMAIL = 'demo@example.com';
// La contraseña de las cuentas demo (incluido el administrador) sale del
// entorno y nunca del repo: el código es público.
const DEMO_PASSWORD = readDemoPassword();

function readDemoPassword(): string {
  const value = process.env.SEED_DEMO_PASSWORD ?? '';
  const valid =
    value.length >= 12 &&
    value.length <= 72 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /\d/.test(value);
  if (!valid) {
    throw new Error(
      'Define SEED_DEMO_PASSWORD en el entorno (12 a 72 caracteres, con minúscula, mayúscula y número).',
    );
  }
  return value;
}

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
const UNITS_REGISTERED_AT = new Date("2026-01-01T00:00:00-06:00");

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
      update: { createdAt: UNITS_REGISTERED_AT },
      create: { ...unit, createdAt: UNITS_REGISTERED_AT },
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
    update: { passwordHash, unitId: unitByCode.get('A-19') ?? null },
    create: {
      email: DEMO_EMAIL,
      passwordHash,
      unitId: unitByCode.get('A-19') ?? null,
    },
  });
  console.log(`Usuario demo listo: ${user.email}`);

  // 4. Otro usuario (A-20)
  const user2 = await prisma.user.upsert({
    where: { email: 'otro@example.com' },
    update: { passwordHash, unitId: unitByCode.get('A-20') ?? null },
    create: {
      email: 'otro@example.com',
      passwordHash,
      unitId: unitByCode.get('A-20') ?? null,
    },
  });
  console.log(`Usuario demo listo: ${user2.email}`);

  // 5. Admin (sin unidad)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { passwordHash, role: 'ADMINISTRADOR', unitId: null },
    create: {
      email: 'admin@example.com',
      passwordHash,
      role: 'ADMINISTRADOR',
      unitId: null,
    },
  });
  console.log(`Administrador demo listo: ${admin.email}`);

  // 6. Staff (sin unidad)
  for (const staff of STAFF) {
    const created = await prisma.user.upsert({
      where: { email: staff.email },
      update: { passwordHash, role: staff.role, unitId: null },
      create: {
        email: staff.email,
        passwordHash,
        role: staff.role,
        unitId: null,
      },
    });
    console.log(`Usuario ${staff.role} listo: ${created.email}`);
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

  // 8b. Votos demo en "Renovación de luminarias" (cerrada) para ver resultados y auditoría
  const luminarias = await prisma.votingTopic.findFirst({
    where: { assembly: { title: 'Renovación de luminarias' } },
    include: { options: { orderBy: { position: 'asc' } } },
  });
  if (luminarias && (await prisma.participacionVotacion.count({ where: { temaId: luminarias.id } })) === 0) {
    const voters = [
      { email: DEMO_EMAIL, option: 0 },
      { email: 'otro@example.com', option: 0 },
    ];
    for (const [index, voter] of voters.entries()) {
      const resident = await prisma.user.findUnique({ where: { email: voter.email } });
      if (!resident?.unitId) continue;
      await prisma.$transaction([
        prisma.participacionVotacion.create({
          data: {
            temaId: luminarias.id,
            unidadId: resident.unitId,
            residenteId: resident.id,
            fecha: new Date(luminarias.opensAt.getTime() + (index + 1) * 45 * 60 * 1000),
          },
        }),
        prisma.vote.create({
          data: { topicId: luminarias.id, optionId: luminarias.options[voter.option].id },
        }),
      ]);
    }
    console.log('  Votos demo en "Renovación de luminarias": 2');
  }

  // 9. Cuotas y pagos demo (H1): en A-19 una pagada, una con pago parcial y una pendiente
  // (los datos de QA-1.1); en A-20, una pendiente de otra unidad.
  const demoUnitId = unitByCode.get('A-19');
  const otherUnitId = unitByCode.get('A-20');
  if (demoUnitId && otherUnitId && (await prisma.fee.count({ where: { unitId: demoUnitId } })) === 0) {
    // Periodos relativos al mes actual, con vencimiento el día 10.
    const monthOffset = (offset: number) => {
      const now = new Date();
      const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 10));
      return { period: month.toISOString().slice(0, 7), dueDate: month };
    };
    const fee = (unitId: string, offset: number) =>
      prisma.fee.create({
        data: { unitId, concept: 'Mantenimiento', amount: 100, ...monthOffset(offset) },
      });

    const paid = await fee(demoUnitId, -2);
    const partial = await fee(demoUnitId, -1);
    const pending = await fee(demoUnitId, 0);
    await fee(otherUnitId, 0);

    await prisma.payment.create({
      data: {
        unitId: demoUnitId,
        userId: user.id,
        amount: 140,
        reference: 'DEMO-SEED-0001',
        allocations: {
          create: [
            { feeId: paid.id, amount: 100 },
            { feeId: partial.id, amount: 40 },
          ],
        },
      },
    });
    await prisma.fee.update({ where: { id: paid.id }, data: { status: 'PAGADA' } });
    await prisma.fee.update({ where: { id: partial.id }, data: { status: 'PARCIAL' } });

    console.log(
      `Cuotas demo (A-19): ${paid.period} pagada, ${partial.period} parcial (saldo 60.00), ` +
        `${pending.period} pendiente · saldo total 160.00`,
    );
  }

  // 10. Generación manual de cuotas (H34, datos de QA-34.1): regla ACTIVA "Mantenimiento" para
  // las 20 unidades de la Torre C. Dos son locales y la regla no tiene monto para LOCAL, así que
  // siempre dan error. El periodo de hace dos meses ya se generó; el del mes pasado, no.
  await seedFeeGeneration(admin.id);

  // 11. Morosidad (H2, datos de QA-2.1). Con lo anterior, en mora quedan A-19, A-20 y la
  // Torre C; en la Torre B, una morosa y los casos que no deben aparecer.
  await seedDelinquency(passwordHash);
}

/** Hoy (AAAA-MM-DD) en la zona del condominio, desplazado `days` días. */
function localDay(days = 0): string {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.APP_TIMEZONE ?? 'America/El_Salvador',
  }).format(new Date());
  return new Date(Date.parse(`${today}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

const TOWER_B_RESIDENTS = [
  { email: 'elena.ruiz@example.com', unit: 'B-103' },
  { email: 'jorge.salas@example.com', unit: 'B-205' },
  { email: 'sofia.herrera@example.com', unit: 'B-402' },
];

async function seedDelinquency(passwordHash: string) {
  const unitId = async (code: string) =>
    (await prisma.unit.findUniqueOrThrow({ where: { code } })).id;
  const residents = new Map<string, string>();
  for (const resident of TOWER_B_RESIDENTS) {
    const id = await unitId(resident.unit);
    const user = await prisma.user.upsert({
      where: { email: resident.email },
      update: { passwordHash, unitId: id },
      create: { email: resident.email, passwordHash, role: Role.RESIDENTE, unitId: id },
    });
    residents.set(resident.unit, user.id);
  }

  if ((await prisma.fee.count({ where: { unit: { tower: 'Torre B' } } })) > 0) return;

  const fee = async (code: string, dueInDays: number, status: 'PENDIENTE' | 'PAGADA' = 'PENDIENTE') => {
    const due = localDay(dueInDays);
    return prisma.fee.create({
      data: {
        unitId: await unitId(code),
        concept: 'Mantenimiento',
        period: due.slice(0, 7),
        amount: 100,
        dueDate: new Date(`${due}T00:00:00Z`),
        status,
      },
    });
  };

  // B-402: dos cuotas vencidas sin pagar -> en mora desde hace 87 días, adeuda 200.00.
  await fee('B-402', -87);
  await fee('B-402', -56);
  // B-205: cuota vencida, pero pagada -> no aparece.
  const paid = await fee('B-205', -35, 'PAGADA');
  await prisma.payment.create({
    data: {
      unitId: paid.unitId,
      userId: residents.get('B-205')!,
      amount: 100,
      reference: 'DEMO-SEED-H2-0001',
      allocations: { create: [{ feeId: paid.id, amount: 100 }] },
    },
  });
  // B-103: vence hoy -> todavía no está vencida (solo el día en que se corre el seed).
  await fee('B-103', 0);
  // A-202: al día, vence en 10 días.
  await fee('A-202', 10);

  console.log(
    `Morosidad demo: B-402 en mora desde ${localDay(-87)}; B-205 pagada, ` +
      `B-103 vence hoy (${localDay(0)}) y A-202 al día`,
  );
}

const TOWER_C = 'Torre C';

async function seedFeeGeneration(adminId: string) {
  const exists = await prisma.feeRule.findFirst({
    where: { scope: 'TORRE', scopeValue: TOWER_C },
  });
  if (exists) return;

  const units = Array.from({ length: 20 }, (_, i) => {
    const number = 101 + i;
    const isShop = number >= 119;
    return {
      code: `C-${number}`,
      tower: TOWER_C,
      description: `${TOWER_C}, ${isShop ? 'local' : 'departamento'} ${number}`,
      type: isShop ? ('LOCAL' as const) : ('DEPARTAMENTO' as const),
    };
  });
  for (const unit of units) {
    await prisma.unit.upsert({ where: { code: unit.code }, update: {}, create: unit });
  }
  const towerUnits = await prisma.unit.findMany({
    where: { tower: TOWER_C },
    orderBy: { code: 'asc' },
  });

  const rule = await prisma.feeRule.create({
    data: {
      concept: 'Mantenimiento',
      amountType: 'POR_TIPO_UNIDAD',
      generationDay: 1,
      dueDay: 10,
      scope: 'TORRE',
      scopeValue: TOWER_C,
      inactivePolicy: 'GENERAR',
      createdById: adminId,
      typeAmounts: { create: [{ unitType: 'DEPARTAMENTO', amount: 85 }] },
    },
  });

  // Periodo AAAA-MM de hace `monthsAgo` meses, en la zona del condominio.
  const [year, month] = new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.APP_TIMEZONE ?? 'America/El_Salvador',
    year: 'numeric',
    month: '2-digit',
  })
    .format(new Date())
    .split('-')
    .map(Number);
  const periodAgo = (monthsAgo: number) =>
    new Date(Date.UTC(year, month - 1 - monthsAgo, 1)).toISOString().slice(0, 7);

  const generated = periodAgo(2);
  const startedAt = new Date(`${generated}-01T06:05:00Z`);
  const flats = towerUnits.filter((u) => u.type === 'DEPARTAMENTO');
  const shops = towerUnits.filter((u) => u.type === 'LOCAL');
  await prisma.generationRun.create({
    data: {
      ruleId: rule.id,
      period: generated,
      origin: 'AUTOMATICA',
      startedAt,
      finishedAt: new Date(startedAt.getTime() + 2000),
      created: flats.length,
      failed: shops.length,
      status: 'CON_ERRORES',
      errors: {
        create: shops.map((u) => ({
          unitId: u.id,
          cause: 'La regla no tiene monto para el tipo de unidad LOCAL.',
        })),
      },
    },
  });
  await prisma.fee.createMany({
    data: flats.map((u) => ({
      unitId: u.id,
      ruleId: rule.id,
      concept: rule.concept,
      period: generated,
      amount: 85,
      dueDate: new Date(`${generated}-10T00:00:00Z`),
    })),
  });

  console.log(
    `Regla de cuota ${rule.id} (Torre C, 20 unidades, 2 locales sin monto): ` +
      `${generated} generado, ${periodAgo(1)} sin generar`,
  );
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}