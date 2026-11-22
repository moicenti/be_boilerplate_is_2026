import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import type { PrismaService } from '@Prisma/services';
import type { FeeStatus } from '@PrismaClient';
import { toZonedParts } from '@CommonAreas/utils';
import {
  createTestApp,
  loginAs,
  resetDatabase,
} from './setup/create-test-app.js';

const API = '/api/v1';
const DAY_MS = 24 * 60 * 60 * 1000;

describe('H2. Visualización de unidades en mora (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let today: string;
  let unitIdByCode: Map<string, string>;

  const http = () => request(app.getHttpServer());
  const asAdmin = () => ({ Authorization: `Bearer ${adminToken}` });
  const mora = (query = '') =>
    http().get(`${API}/unidades/mora${query}`).set(asAdmin());

  /** Fecha AAAA-MM-DD a `days` días de hoy (negativo: en el pasado). */
  const dayFromToday = (days: number) =>
    new Date(Date.parse(`${today}T00:00:00Z`) + days * DAY_MS)
      .toISOString()
      .slice(0, 10);

  let period = 0;
  async function addFee(
    code: string,
    dueInDays: number,
    { amount = 100, status = 'PENDIENTE' as FeeStatus } = {},
  ) {
    const due = dayFromToday(dueInDays);
    return prisma.fee.create({
      data: {
        unitId: unitIdByCode.get(code)!,
        concept: 'Mantenimiento',
        // Cuotas sin regla: el periodo solo tiene que ser distinto para cada una.
        period: `20${String(10 + (period++ % 90)).padStart(2, '0')}-01`,
        amount,
        dueDate: new Date(`${due}T00:00:00Z`),
        status,
      },
    });
  }

  async function addUnits(codes: string[], tower: string) {
    await prisma.unit.createMany({
      data: codes.map((code) => ({ code, tower, description: code })),
    });
    unitIdByCode = new Map(
      (await prisma.unit.findMany()).map((u) => [u.code, u.id]),
    );
  }

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await app.listen(0);
    today = toZonedParts(
      new Date(),
      app.get(ConfigService).getOrThrow<string>('APP_TIMEZONE'),
    ).date;
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    adminToken = await loginAs(app, 'admin');
    // Torre A: A-304 (2 residentes) y A-101, A-102. Torre B: B-103 (1 residente) y B-201, B-202.
    await addUnits(['A-101', 'A-102'], 'Torre A');
    await addUnits(['B-201', 'B-202'], 'Torre B');

    await addFee('A-304', -56, { amount: 250 }); // vencida impaga, la más antigua
    await addFee('A-304', -26, { amount: 100, status: 'PARCIAL' }); // pagada en parte
    await addFee('A-304', 5); // aún no vence
    await addFee('A-101', -10); // vencida impaga
    await addFee('A-102', -40, { status: 'PAGADA' }); // vencida pagada
    await addFee('B-103', -90, { status: 'ANULADA' }); // anulada
    await addFee('B-201', 0); // vence hoy
    await addFee('B-202', 20); // al día
  });

  afterAll(async () => {
    await app.close();
  });

  it('AC1: lista cada unidad morosa con la fecha desde la que está en mora y lo que adeuda', async () => {
    // A-304 pagó 40 de la cuota PARCIAL.
    const partial = await prisma.fee.findFirstOrThrow({
      where: { status: 'PARCIAL' },
    });
    await prisma.payment.create({
      data: {
        unitId: partial.unitId,
        userId: (
          await prisma.user.findFirstOrThrow({
            where: { email: 'residente@test.com' },
          })
        ).id,
        amount: 40,
        allocations: { create: [{ feeId: partial.id, amount: 40 }] },
      },
    });

    const res = await mora().expect(200);

    expect(res.body).toEqual({
      total: 2,
      pagina: 1,
      tamano: 20,
      fechaCorte: today,
      items: [
        {
          unidadId: unitIdByCode.get('A-304'),
          codigoUnidad: 'A-304',
          torre: 'Torre A',
          // Sus dos residentes se crearon a la vez: desempata el correo.
          responsable: 'residente2@test.com',
          enMoraDesde: dayFromToday(-56),
          diasAtraso: 56,
          montoAdeudado: 310,
          cuotasVencidas: 2,
        },
        {
          unidadId: unitIdByCode.get('A-101'),
          codigoUnidad: 'A-101',
          torre: 'Torre A',
          responsable: null,
          enMoraDesde: dayFromToday(-10),
          diasAtraso: 10,
          montoAdeudado: 100,
          cuotasVencidas: 1,
        },
      ],
    });
  });

  it('AC2: una unidad que paga todo lo vencido deja de aparecer', async () => {
    const residentToken = await loginAs(app, 'residente');
    const overdue = await prisma.fee.findMany({
      where: {
        unitId: unitIdByCode.get('A-304'),
        dueDate: { lt: new Date(`${today}T00:00:00Z`) },
      },
    });

    await http()
      .post(`${API}/pagos`)
      .set({ Authorization: `Bearer ${residentToken}` })
      .send({
        unidadId: unitIdByCode.get('A-304'),
        cuotaIds: overdue.map((f) => f.id),
        monto: 350,
      })
      .expect(201);

    const res = await mora().expect(200);
    expect(
      res.body.items.map((u: { codigoUnidad: string }) => u.codigoUnidad),
    ).toEqual(['A-101']);
  });

  it('AC3: filtra por torre sin distinguir mayúsculas', async () => {
    await addFee('B-202', -3);

    const towerB = await mora('?torre=torre%20b').expect(200);
    expect(towerB.body.total).toBe(1);
    expect(towerB.body.items[0].codigoUnidad).toBe('B-202');

    const towerA = await mora('?torre=Torre%20A').expect(200);
    expect(
      towerA.body.items.map((u: { codigoUnidad: string }) => u.codigoUnidad),
    ).toEqual(['A-304', 'A-101']);

    const none = await mora('?torre=Torre%20Z').expect(200);
    expect(none.body).toMatchObject({ total: 0, items: [] });
  });

  it('AC3: filtra por antigüedad mínima de la mora', async () => {
    const res = await mora('?antiguedadMinDias=30').expect(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0]).toMatchObject({
      codigoUnidad: 'A-304',
      diasAtraso: 56,
    });
    // El límite es inclusivo.
    expect((await mora('?antiguedadMinDias=10').expect(200)).body.total).toBe(
      2,
    );
    expect((await mora('?antiguedadMinDias=11').expect(200)).body.total).toBe(
      1,
    );
  });

  it('AC1: ordena y pagina', async () => {
    const byAmount = await mora('?orden=montoAdeudado').expect(200);
    expect(
      byAmount.body.items.map((u: { codigoUnidad: string }) => u.codigoUnidad),
    ).toEqual(['A-101', 'A-304']);

    const page2 = await mora('?pagina=2&tamano=1').expect(200);
    expect(page2.body).toMatchObject({ total: 2, pagina: 2, tamano: 1 });
    expect(
      page2.body.items.map((u: { codigoUnidad: string }) => u.codigoUnidad),
    ).toEqual(['A-101']);

    const beyond = await mora('?pagina=5').expect(200);
    expect(beyond.body).toMatchObject({ total: 2, items: [] });
  });

  it('AC3: 400 SOLICITUD_INVALIDA con parámetros inválidos', async () => {
    for (const query of [
      '?pagina=0',
      '?tamano=101',
      '?tamano=abc',
      '?antiguedadMinDias=-1',
      '?orden=monto',
      '?seccion=1',
    ]) {
      const res = await mora(query);
      expect(res.status).toBe(400);
      expect(res.body.codigo).toBe('SOLICITUD_INVALIDA');
    }
  });

  it('AC4: 401 NO_AUTENTICADO sin sesión', async () => {
    const res = await http().get(`${API}/unidades/mora`).expect(401);
    expect(res.body.codigo).toBe('NO_AUTENTICADO');
  });

  it.each(['residente', 'seguridad'] as const)(
    'AC4: 403 ROL_NO_PERMITIDO para %s',
    async (user) => {
      const token = await loginAs(app, user);
      const res = await http()
        .get(`${API}/unidades/mora`)
        .set({ Authorization: `Bearer ${token}` })
        .expect(403);
      expect(res.body.codigo).toBe('ROL_NO_PERMITIDO');
    },
  );

  it('AC1: responde en menos de 2 s con 500 unidades en mora', async () => {
    const codes = Array.from({ length: 500 }, (_, i) => `P-${i + 1}`);
    await addUnits(codes, 'Torre P');
    await prisma.fee.createMany({
      data: codes.flatMap((code) =>
        [-70, -40, -10].map((days, i) => ({
          unitId: unitIdByCode.get(code)!,
          concept: 'Mantenimiento',
          period: `2026-0${i + 1}`,
          amount: 100,
          dueDate: new Date(`${dayFromToday(days)}T00:00:00Z`),
        })),
      ),
    });

    const started = Date.now();
    const res = await mora('?tamano=100').expect(200);
    const elapsed = Date.now() - started;

    expect(res.body.total).toBe(502);
    expect(res.body.items[0]).toMatchObject({
      diasAtraso: 70,
      cuotasVencidas: 3,
      montoAdeudado: 300,
    });
    expect(elapsed).toBeLessThan(2000);
  });
});
