import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role, Priority, Prisma } from '../src/generated/prisma/client.js';

const DEMO_EMAIL = 'demo@example.com';
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
const UNITS_REGISTERED_AT = new Date('2026-01-01T00:00:00-06:00');

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
];

// ─── Datos para H7–H12 ───────────────────────────────────────────────────────

type DemoIncidencia = {
  residenteEmail: string;
  title: string;
  description: string;
  category: string;
  location: string;
  status: string;
  priority: Priority | null;
  assigneeEmail: string | null;
  dueDateOffsetHoras: number | null;
  priorityJustification: string | null;
  resolutionComment: string | null;
  resolvedByEmail: string | null;
  events: Array<{
    action: string;
    actorEmail: string;
    offsetHoras: number;
    metadata: Prisma.InputJsonValue;
  }>;
};

const DEMO_INCIDENCIAS: DemoIncidencia[] = [
  {
    residenteEmail: 'demo@example.com',
    title: 'Luminaria apagada en pasillo',
    description:
      'La luminaria frente al elevador del tercer piso no enciende desde anoche. El pasillo queda oscuro al salir del departamento. Las demás luces del piso funcionan con normalidad.',
    category: 'Mantenimiento',
    location: 'Torre A · Piso 3 · Pasillo frente al elevador',
    status: 'Abierto',
    priority: null,
    assigneeEmail: null,
    dueDateOffsetHoras: null,
    priorityJustification: null,
    resolutionComment: null,
    resolvedByEmail: null,
    events: [
      { action: 'CREADO', actorEmail: 'demo@example.com', offsetHoras: -26, metadata: { status: 'Abierto' } },
    ],
  },
  {
    residenteEmail: 'demo@example.com',
    title: 'Fuga de agua en estacionamiento',
    description:
      'Desde esta mañana hay un goteo constante en la tubería del techo, sobre el cajón 18 del sótano 1. Se está formando un charco junto al paso peatonal.',
    category: 'Plomería',
    location: 'Estacionamiento · Sótano 1 · Cajón 18',
    status: 'En atención',
    priority: 'ALTA',
    assigneeEmail: 'laura.admin@example.com',
    dueDateOffsetHoras: 48,
    priorityJustification: null,
    resolutionComment: null,
    resolvedByEmail: null,
    events: [
      { action: 'CREADO', actorEmail: 'demo@example.com', offsetHoras: -50, metadata: { status: 'Abierto' } },
      {
        action: 'ASIGNADO',
        actorEmail: 'admin@example.com',
        offsetHoras: -46,
        metadata: { priority: 'ALTA', assigneeEmail: 'laura.admin@example.com', dueDate: 'próximas 48h' },
      },
    ],
  },
  {
    residenteEmail: 'otro@example.com',
    title: 'Puerta de acceso no cierra',
    description:
      'La puerta peatonal de la torre A no cierra correctamente, queda entreabierta y permite el paso sin control.',
    category: 'Seguridad',
    location: 'Torre A · Acceso peatonal',
    status: 'Resuelto',
    priority: 'CRITICA',
    assigneeEmail: 'admin@example.com',
    dueDateOffsetHoras: 12,
    priorityJustification: 'Riesgo de seguridad para los residentes.',
    resolutionComment: 'Se ajustó la bisagra y se lubricó el mecanismo.',
    resolvedByEmail: 'admin@example.com',
    events: [
      { action: 'CREADO', actorEmail: 'otro@example.com', offsetHoras: -72, metadata: { status: 'Abierto' } },
      {
        action: 'ASIGNADO',
        actorEmail: 'admin@example.com',
        offsetHoras: -70,
        metadata: {
          priority: 'CRITICA',
          priorityJustification: 'Riesgo de seguridad para los residentes.',
          assigneeEmail: 'admin@example.com',
        },
      },
      {
        action: 'RESUELTO',
        actorEmail: 'admin@example.com',
        offsetHoras: -24,
        metadata: { resolutionComment: 'Se ajustó la bisagra y se lubricó el mecanismo.' },
      },
    ],
  },
  {
    residenteEmail: 'sofia.herrera@example.com',
    title: 'Ruido en el elevador',
    description:
      'El elevador principal de la torre B hace un ruido metálico al subir del piso 2 al 3. Se escucha desde el pasillo.',
    category: 'Mantenimiento',
    location: 'Torre B · Elevador principal',
    status: 'Cerrado',
    priority: 'MEDIA',
    assigneeEmail: 'laura.admin@example.com',
    dueDateOffsetHoras: -12,
    priorityJustification: null,
    resolutionComment: 'Se revisó el sistema de tracción y se ajustó la guía.',
    resolvedByEmail: 'laura.admin@example.com',
    events: [
      { action: 'CREADO', actorEmail: 'sofia.herrera@example.com', offsetHoras: -120, metadata: { status: 'Abierto' } },
      { action: 'ASIGNADO', actorEmail: 'admin@example.com', offsetHoras: -110, metadata: { priority: 'MEDIA', assigneeEmail: 'laura.admin@example.com' } },
      { action: 'RESUELTO', actorEmail: 'laura.admin@example.com', offsetHoras: -48, metadata: { resolutionComment: 'Se revisó el sistema de tracción y se ajustó la guía.' } },
      { action: 'CONFIRMADO', actorEmail: 'sofia.herrera@example.com', offsetHoras: -24, metadata: { confirmedAt: 'hace 24h' } },
    ],
  },
];

type DemoPreAutorizacion = {
  residenteEmail: string;
  nombreVisitante: string;
  documento: string;
  acompanantes: number;
  motivo: string | null;
  inicioOffsetHoras: number;
  finOffsetHoras: number;
  estado: 'VIGENTE' | 'USADA' | 'CANCELADA' | 'EXPIRADA';
};

const DEMO_PREAUTORIZACIONES: DemoPreAutorizacion[] = [
  {
    residenteEmail: 'demo@example.com',
    nombreVisitante: 'Juan Pérez',
    documento: '12345678',
    acompanantes: 2,
    motivo: 'Entrega de paquetería',
    inicioOffsetHoras: 2,
    finOffsetHoras: 8,
    estado: 'VIGENTE',
  },
  {
    residenteEmail: 'demo@example.com',
    nombreVisitante: 'María García',
    documento: '87654321',
    acompanantes: 0,
    motivo: 'Visita familiar',
    inicioOffsetHoras: 4,
    finOffsetHoras: 10,
    estado: 'VIGENTE',
  },
  {
    residenteEmail: 'otro@example.com',
    nombreVisitante: 'Pedro Ramírez',
    documento: '11223344',
    acompanantes: 1,
    motivo: 'Reunión de trabajo',
    inicioOffsetHoras: -2,
    finOffsetHoras: 6,
    estado: 'USADA',
  },
];

type DemoVisitaActiva = {
  nombreVisitante: string;
  documento: string;
  acompanantes: number;
  motivo: string | null;
  estado: 'DENTRO' | 'DENTRO_SIN_AUTORIZACION';
  unidadCode: string;
  preautorizacionDocumento: string | null;
  registradoPorEmail: string;
  entradaOffsetHoras: number;
  salidaOffsetHoras: number | null;
  salidaRegistradaPorEmail: string | null;
};

const DEMO_VISITAS_ACTIVAS: DemoVisitaActiva[] = [
  {
    nombreVisitante: 'Pedro Ramírez',
    documento: '11223344',
    acompanantes: 1,
    motivo: null,
    estado: 'DENTRO',
    unidadCode: 'A-20',
    preautorizacionDocumento: '11223344',
    registradoPorEmail: 'ricardo.soto@example.com',
    entradaOffsetHoras: -1,
    salidaOffsetHoras: null,
    salidaRegistradaPorEmail: null,
  },
  {
    nombreVisitante: 'Carlos Mendoza',
    documento: '99887766',
    acompanantes: 0,
    motivo: 'Visita sin autorización previa, entregó documento.',
    estado: 'DENTRO_SIN_AUTORIZACION',
    unidadCode: 'B-205',
    preautorizacionDocumento: null,
    registradoPorEmail: 'ricardo.soto@example.com',
    entradaOffsetHoras: -3,
    salidaOffsetHoras: null,
    salidaRegistradaPorEmail: null,
  },
  {
    nombreVisitante: 'Ana Torres',
    documento: '55667788',
    acompanantes: 2,
    motivo: null,
    estado: 'DENTRO',
    unidadCode: 'A-19',
    preautorizacionDocumento: null,
    registradoPorEmail: 'ricardo.soto@example.com',
    entradaOffsetHoras: -5,
    salidaOffsetHoras: null,
    salidaRegistradaPorEmail: null,
  },
  {
    nombreVisitante: 'Luis Fernández',
    documento: '33445566',
    acompanantes: 0,
    motivo: null,
    estado: 'DENTRO',
    unidadCode: 'B-103',
    preautorizacionDocumento: null,
    registradoPorEmail: 'ricardo.soto@example.com',
    entradaOffsetHoras: -8,
    salidaOffsetHoras: -2,
    salidaRegistradaPorEmail: 'ricardo.soto@example.com',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generarCodigo(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function dateOffset(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

// ─── Seed de incidencias y visitas ───────────────────────────────────────────

async function seedIncidenciasYVisitas() {
  console.log('\n📋 Incidencias (H7–H9)');
  const residentes = await prisma.user.findMany({
    where: {
      email: {
        in: ['demo@example.com', 'otro@example.com', 'sofia.herrera@example.com'],
      },
    },
    select: { id: true, email: true, unitId: true },
  });

  const userIdByEmail = new Map<string, string>();
  for (const r of residentes) userIdByEmail.set(r.email, r.id);
  for (const email of ['admin@example.com', 'laura.admin@example.com']) {
    const u = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (u) userIdByEmail.set(email, u.id);
  }

  let incidenteIndex = 1;
  for (const inc of DEMO_INCIDENCIAS) {
    const residente = residentes.find((r) => r.email === inc.residenteEmail);
    if (!residente || !residente.unitId) continue;

    const existe = await prisma.report.findFirst({ where: { title: inc.title } });
    if (existe) continue;

    const unidad = await prisma.unit.findUniqueOrThrow({
      where: { id: residente.unitId },
      select: { code: true },
    });
    const assignee = inc.assigneeEmail
      ? await prisma.user.findUnique({ where: { email: inc.assigneeEmail }, select: { id: true } })
      : null;
    const resolvedBy = inc.resolvedByEmail
      ? await prisma.user.findUnique({ where: { email: inc.resolvedByEmail }, select: { id: true } })
      : null;

    const year = new Date().getFullYear();
    const folio = `INC-${year}-${String(incidenteIndex).padStart(4, '0')}`;
    const createdAt = dateOffset(inc.events[0]?.offsetHoras ?? -24);

    // 1. Crear el reporte SIN eventos
    const report = await prisma.report.create({
      data: {
        folio,
        title: inc.title,
        description: inc.description,
        category: inc.category,
        location: inc.location,
        status: inc.status,
        unit: unidad.code,
        userId: residente.id,
        priority: inc.priority,
        priorityJustification: inc.priorityJustification,
        assigneeId: assignee?.id ?? null,
        dueDate: inc.dueDateOffsetHoras !== null ? dateOffset(inc.dueDateOffsetHoras) : null,
        resolvedAt: resolvedBy ? dateOffset(-24) : null,
        resolvedById: resolvedBy?.id ?? null,
        resolutionComment: inc.resolutionComment,
        createdAt,
        updatedAt: dateOffset(-1),
      },
    });

    // 2. Crear los eventos con `createMany` (evita el tipo Unchecked)
    await prisma.reportEvent.createMany({
      data: inc.events.map((evt) => ({
        action: evt.action,
        userId: userIdByEmail.get(evt.actorEmail) ?? residente.id,
        reportId: report.id,
        metadata: evt.metadata,
        createdAt: dateOffset(evt.offsetHoras),
      })),
    });

    console.log(`   ${folio} · ${inc.title} (${inc.status})`);
    incidenteIndex++;
  }

  console.log('\n🎫 Pre-autorizaciones (H10)');
  const unitByCode = new Map(
    (await prisma.unit.findMany({ select: { id: true, code: true } })).map((u) => [u.code, u.id]),
  );
  for (const pre of DEMO_PREAUTORIZACIONES) {
    const residente = residentes.find((r) => r.email === pre.residenteEmail);
    if (!residente || !residente.unitId) continue;

    const existe = await prisma.preAutorizacion.findFirst({
      where: { nombreVisitante: pre.nombreVisitante, documento: pre.documento },
    });
    if (existe) continue;

    const codigo = generarCodigo();
    await prisma.preAutorizacion.create({
      data: {
        codigo,
        nombreVisitante: pre.nombreVisitante,
        documento: pre.documento,
        acompanantes: pre.acompanantes,
        motivo: pre.motivo,
        inicio: dateOffset(pre.inicioOffsetHoras),
        fin: dateOffset(pre.finOffsetHoras),
        estado: pre.estado,
        residenteId: residente.id,
        unidadId: residente.unitId,
      },
    });
    console.log(`   ${codigo} · ${pre.nombreVisitante} (${pre.estado})`);
  }

  console.log('\n👥 Visitas activas (H11–H12)');
  const seguridad = await prisma.user.findUniqueOrThrow({
    where: { email: 'ricardo.soto@example.com' },
  });
  for (const v of DEMO_VISITAS_ACTIVAS) {
    const existe = await prisma.visitaActiva.findFirst({
      where: { documento: v.documento, estado: { in: ['DENTRO', 'DENTRO_SIN_AUTORIZACION'] } },
    });
    if (existe) continue;

    const unidadId = unitByCode.get(v.unidadCode);
    if (!unidadId) continue;

    let preautorizacionId: string | null = null;
    if (v.preautorizacionDocumento) {
      const pre = await prisma.preAutorizacion.findFirst({
        where: { documento: v.preautorizacionDocumento },
        select: { id: true },
        orderBy: { createdAt: 'desc' },
      });
      preautorizacionId = pre?.id ?? null;
    }

    const salidaPor = v.salidaRegistradaPorEmail
      ? await prisma.user.findUnique({
          where: { email: v.salidaRegistradaPorEmail },
          select: { id: true },
        })
      : null;

    await prisma.visitaActiva.create({
      data: {
        nombreVisitante: v.nombreVisitante,
        documento: v.documento,
        acompanantes: v.acompanantes,
        motivo: v.motivo,
        estado: v.estado,
        entrada: dateOffset(v.entradaOffsetHoras),
        salida: v.salidaOffsetHoras !== null ? dateOffset(v.salidaOffsetHoras) : null,
        unidadId,
        preautorizacionId,
        registradoPorId: seguridad.id,
        salidaRegistradaPorId: salidaPor?.id ?? null,
      },
    });
    console.log(`   ${v.nombreVisitante} (${v.estado}) · ${v.unidadCode}`);
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // 1. Unidades
  for (const unit of UNITS) {
    await prisma.unit.upsert({
      where: { code: unit.code },
      update: { createdAt: UNITS_REGISTERED_AT },
      create: { ...unit, createdAt: UNITS_REGISTERED_AT },
    });
  }
  console.log(`Unidades listas: ${UNITS.length}`);

  // 2. Lookup de unitIds
  const unitByCode = new Map(
    (await prisma.unit.findMany({ select: { id: true, code: true } })).map((u) => [u.code, u.id]),
  );

  // 3. Usuario demo
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { passwordHash, unitId: unitByCode.get('A-19') ?? null },
    create: { email: DEMO_EMAIL, passwordHash, unitId: unitByCode.get('A-19') ?? null },
  });
  console.log(`Usuario demo listo: ${user.email}`);

  // 4. Otro usuario
  const user2 = await prisma.user.upsert({
    where: { email: 'otro@example.com' },
    update: { passwordHash, unitId: unitByCode.get('A-20') ?? null },
    create: { email: 'otro@example.com', passwordHash, unitId: unitByCode.get('A-20') ?? null },
  });
  console.log(`Usuario demo listo: ${user2.email}`);

  // 5. Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { passwordHash, role: Role.ADMINISTRADOR, unitId: null },
    create: { email: 'admin@example.com', passwordHash, role: Role.ADMINISTRADOR, unitId: null },
  });
  console.log(`Administrador demo listo: ${admin.email}`);

  // 6. Staff
  for (const staff of STAFF) {
    const created = await prisma.user.upsert({
      where: { email: staff.email },
      update: { passwordHash, role: staff.role, unitId: null },
      create: { email: staff.email, passwordHash, role: staff.role, unitId: null },
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

  // 8. Asambleas
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

  // 8b. Votos demo
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

  // 9. Cuotas
  const demoUnitId = unitByCode.get('A-19');
  const otherUnitId = unitByCode.get('A-20');
  if (demoUnitId && otherUnitId && (await prisma.fee.count({ where: { unitId: demoUnitId } })) === 0) {
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

  // 10. Generación manual de cuotas
  await seedFeeGeneration(admin.id);

  // 11. Morosidad
  await seedDelinquency(passwordHash);

  // 12. Incidencias y visitas (H7–H12)
  await seedIncidenciasYVisitas();
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

  await fee('B-402', -87);
  await fee('B-402', -56);
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
  await fee('B-103', 0);
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