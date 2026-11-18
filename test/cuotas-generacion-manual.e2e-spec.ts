import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import bcrypt from 'bcrypt';
import type { PrismaService } from '@Prisma/services';
import { Role } from '@PrismaClient';
import { FeeGenerationScheduler } from '../src/cuotas/services/index.js';
import {
  createTestApp,
  loginAs,
  resetDatabase,
} from './setup/create-test-app.js';

const API = '/api/v1';
// Periodos ya pasados, para no depender de la fecha en que corran las pruebas.
const PERIOD = '2026-09';
// 00:05 del 1 de septiembre en El Salvador (UTC-6): la tarea automática genera 2026-09.
const SEP_1 = new Date('2026-09-01T06:05:00Z');

describe('Generación manual de cuotas (e2e) - H34', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let residentToken: string;
  let unitIds: string[];

  const http = () => request(app.getHttpServer());
  const asAdmin = () => ({ Authorization: `Bearer ${adminToken}` });

  async function createRule(
    overrides: Record<string, unknown> = {},
  ): Promise<number> {
    const res = await http()
      .post(`${API}/reglas-cuota`)
      .set(asAdmin())
      .send({
        concepto: 'Mantenimiento',
        tipoMonto: 'FIJO',
        monto: 100,
        diaGeneracion: 1,
        diaVencimiento: 10,
        alcance: 'TORRE',
        alcanceValor: 'Torre QA',
        politicaInactivas: 'REVISAR',
        ...overrides,
      })
      .expect(201);
    return res.body.id as number;
  }

  /** `count` unidades en "Torre QA", cada una con un residente activo. */
  async function createUnits(count: number): Promise<string[]> {
    const codes = Array.from(
      { length: count },
      (_, i) => `QA-${String(i + 1).padStart(3, '0')}`,
    );
    await prisma.unit.createMany({
      data: codes.map((code) => ({
        code,
        tower: 'Torre QA',
        description: `Unidad ${code}`,
      })),
    });
    const units = await prisma.unit.findMany({
      where: { code: { in: codes } },
      orderBy: { code: 'asc' },
    });
    const passwordHash = await bcrypt.hash('x', 4);
    await prisma.user.createMany({
      data: units.map((u) => ({
        email: `${u.code.toLowerCase()}@test.com`,
        passwordHash,
        role: Role.RESIDENTE,
        unitId: u.id,
      })),
    });
    return units.map((u) => u.id);
  }

  const preview = (ruleId: number, periodo = PERIOD) =>
    http()
      .post(`${API}/reglas-cuota/${ruleId}/generacion/vista-previa`)
      .set(asAdmin())
      .send({ periodo });

  const execute = (ruleId: number, periodo = PERIOD) =>
    http()
      .post(`${API}/reglas-cuota/${ruleId}/generacion`)
      .set(asAdmin())
      .send({ periodo });

  const snapshot = async () => ({
    fees: await prisma.fee.count(),
    runs: await prisma.generationRun.count(),
    errors: await prisma.generationError.count(),
  });

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await app.listen(0);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    adminToken = await loginAs(app, 'admin');
    residentToken = await loginAs(app, 'residente');
    // 20 unidades; dos con error simulado: una inactiva y una sin responsable.
    unitIds = await createUnits(20);
    await prisma.unit.update({
      where: { id: unitIds[18] },
      data: { active: false },
    });
    await prisma.user.deleteMany({ where: { unitId: unitIds[19] } });
  });

  afterAll(async () => {
    await app.close();
  });

  it('la vista previa muestra unidades, monto y excepciones sin modificar datos', async () => {
    const ruleId = await createRule();
    const before = await snapshot();

    const res = await preview(ruleId).expect(200);

    expect(res.body).toEqual({
      periodo: PERIOD,
      cantidadUnidades: 18,
      montoTotal: 1800,
      yaGeneradas: 0,
      fechaVencimiento: '2026-09-10',
      excepciones: [
        {
          unidadId: unitIds[18],
          codigoUnidad: 'QA-019',
          motivo: 'UNIDAD_INACTIVA',
          resultado: 'ERROR',
        },
        {
          unidadId: unitIds[19],
          codigoUnidad: 'QA-020',
          motivo: 'SIN_RESPONSABLE',
          resultado: 'ERROR',
        },
      ],
    });
    expect(await snapshot()).toEqual(before);
  });

  it('la ejecución da los mismos totales que la vista previa, con la causa de cada error', async () => {
    const ruleId = await createRule();
    const { body: plan } = await preview(ruleId).expect(200);

    const res = await execute(ruleId).expect(200);

    expect(res.body).toEqual({
      ejecucionId: expect.any(Number),
      periodo: PERIOD,
      estado: 'CON_ERRORES',
      creadas: plan.cantidadUnidades,
      omitidas: 0,
      errores: [
        {
          unidadId: unitIds[18],
          codigoUnidad: 'QA-019',
          causa: 'Unidad inactiva: requiere revisión.',
        },
        {
          unidadId: unitIds[19],
          codigoUnidad: 'QA-020',
          causa: 'Unidad sin responsable: requiere revisión.',
        },
      ],
      montoTotal: plan.montoTotal,
    });

    const fees = await prisma.fee.findMany({
      where: { ruleId, period: PERIOD },
    });
    expect(fees).toHaveLength(18);
    expect(fees.every((f) => f.status === 'PENDIENTE')).toBe(true);
    expect(fees[0].dueDate.toISOString()).toBe('2026-09-10T00:00:00.000Z');

    const run = await prisma.generationRun.findUniqueOrThrow({
      where: { id: res.body.ejecucionId },
    });
    expect(run).toMatchObject({
      origin: 'MANUAL',
      userId: expect.any(String),
      period: PERIOD,
      created: 18,
      failed: 2,
      finishedAt: expect.any(Date),
    });
  });

  it('con política OMITIR, las excepciones cuentan como omitidas', async () => {
    const ruleId = await createRule({ politicaInactivas: 'OMITIR' });
    const { body: plan } = await preview(ruleId).expect(200);
    expect(
      plan.excepciones.map((e: { resultado: string }) => e.resultado),
    ).toEqual(['OMITIDA', 'OMITIDA']);

    const { body } = await execute(ruleId).expect(200);
    expect(body).toMatchObject({
      estado: 'COMPLETADA',
      creadas: 18,
      omitidas: 2,
      errores: [],
      montoTotal: 1800,
    });
  });

  it('un periodo atrasado a medio generar: crea solo las cuotas faltantes', async () => {
    const ruleId = await createRule();
    await prisma.fee.createMany({
      data: unitIds.slice(0, 5).map((unitId) => ({
        unitId,
        ruleId,
        concept: 'Mantenimiento',
        period: PERIOD,
        amount: 100,
        dueDate: new Date('2026-09-10T00:00:00Z'),
      })),
    });

    const { body: plan } = await preview(ruleId).expect(200);
    expect(plan).toMatchObject({
      cantidadUnidades: 13,
      montoTotal: 1300,
      yaGeneradas: 5,
    });

    const { body } = await execute(ruleId).expect(200);
    expect(body).toMatchObject({ creadas: 13, omitidas: 5, montoTotal: 1300 });
    expect(await prisma.fee.count({ where: { ruleId, period: PERIOD } })).toBe(
      18,
    );
  });

  it('una segunda ejecución del mismo periodo retorna creadas en 0', async () => {
    const ruleId = await createRule({ politicaInactivas: 'GENERAR' });
    await execute(ruleId).expect(200);

    const { body: plan } = await preview(ruleId).expect(200);
    expect(plan).toMatchObject({
      cantidadUnidades: 0,
      montoTotal: 0,
      yaGeneradas: 20,
      excepciones: [],
    });

    const { body } = await execute(ruleId).expect(200);
    expect(body).toMatchObject({
      estado: 'COMPLETADA',
      creadas: 0,
      omitidas: 20,
      errores: [],
      montoTotal: 0,
    });
    expect(await prisma.fee.count({ where: { ruleId } })).toBe(20);
  });

  it('una unidad con cuota ya generada no vuelve a dar error aunque quede inactiva', async () => {
    const ruleId = await createRule();
    await execute(ruleId).expect(200);
    await prisma.unit.update({
      where: { id: unitIds[0] },
      data: { active: false },
    });

    const { body } = await execute(ruleId).expect(200);
    expect(body).toMatchObject({ creadas: 0, omitidas: 18 });
    expect(
      body.errores.map((e: { codigoUnidad: string }) => e.codigoUnidad),
    ).toEqual(['QA-019', 'QA-020']);
  });

  it('409 EJECUCION_EN_CURSO si hay una ejecución en curso para la regla y el periodo', async () => {
    const ruleId = await createRule();
    await prisma.generationRun.create({
      data: { ruleId, period: PERIOD, origin: 'AUTOMATICA' },
    });

    const res = await execute(ruleId).expect(409);
    expect(res.body).toEqual({
      codigo: 'EJECUCION_EN_CURSO',
      mensaje: expect.any(String),
    });
    expect(await prisma.fee.count()).toBe(0);

    // Otro periodo de la misma regla sí se puede generar.
    await execute(ruleId, '2026-08').expect(200);
  });

  it('una ejecución en curso abandonada hace más de 30 minutos no bloquea', async () => {
    const ruleId = await createRule();
    const stale = await prisma.generationRun.create({
      data: {
        ruleId,
        period: PERIOD,
        origin: 'MANUAL',
        startedAt: new Date(Date.now() - 2 * 3600_000),
      },
    });

    await execute(ruleId).expect(200);
    expect(
      await prisma.generationRun.findUniqueOrThrow({ where: { id: stale.id } }),
    ).toMatchObject({ status: 'CON_ERRORES' });
  });

  it('dos ejecuciones simultáneas: una genera y la otra recibe 409 o no crea nada', async () => {
    const ruleId = await createRule({ politicaInactivas: 'GENERAR' });

    const results = await Promise.all([execute(ruleId), execute(ruleId)]);

    expect(results.some((r) => r.status === 200)).toBe(true);
    for (const res of results) expect([200, 409]).toContain(res.status);
    const created = results
      .filter((r) => r.status === 200)
      .reduce((sum, r) => sum + (r.body.creadas as number), 0);
    expect(created).toBe(20);
    expect(await prisma.fee.count({ where: { ruleId } })).toBe(20);
  });

  it('el historial muestra ejecuciones automáticas y manuales con fecha, periodo, usuario y totales', async () => {
    const ruleId = await createRule();
    await app.get(FeeGenerationScheduler).runDaily(SEP_1);
    await execute(ruleId, '2026-08').expect(200);
    await execute(ruleId, '2026-08').expect(200);

    const res = await http()
      .get(`${API}/reglas-cuota/${ruleId}/ejecuciones`)
      .set(asAdmin())
      .expect(200);

    expect(res.body).toMatchObject({ total: 3, pagina: 1, tamano: 20 });
    expect(res.body.items).toEqual([
      {
        id: expect.any(Number),
        fecha: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-06:00$/,
        ),
        origen: 'MANUAL',
        usuario: 'admin@test.com',
        periodo: '2026-08',
        estado: 'CON_ERRORES',
        creadas: 0,
        omitidas: 18,
        conError: 2,
      },
      expect.objectContaining({
        origen: 'MANUAL',
        periodo: '2026-08',
        creadas: 18,
      }),
      expect.objectContaining({
        origen: 'AUTOMATICA',
        usuario: null,
        periodo: PERIOD,
        creadas: 18,
        omitidas: 0,
        conError: 2,
      }),
    ]);

    const page2 = await http()
      .get(`${API}/reglas-cuota/${ruleId}/ejecuciones?pagina=2&tamano=2`)
      .set(asAdmin())
      .expect(200);
    expect(page2.body).toMatchObject({ total: 3, pagina: 2, tamano: 2 });
    expect(page2.body.items).toHaveLength(1);
    expect(page2.body.items[0].origen).toBe('AUTOMATICA');
  });

  describe('errores', () => {
    it('400 SOLICITUD_INVALIDA con un periodo mal formado', async () => {
      const ruleId = await createRule();
      for (const periodo of ['2026-13', '2026-9', '09-2026', '', 202609]) {
        const res = await preview(ruleId, periodo as string).expect(400);
        expect(res.body.codigo).toBe('SOLICITUD_INVALIDA');
        await execute(ruleId, periodo as string).expect(400);
      }
      await http()
        .post(`${API}/reglas-cuota/${ruleId}/generacion`)
        .set(asAdmin())
        .send({})
        .expect(400);
      await http()
        .get(`${API}/reglas-cuota/${ruleId}/ejecuciones?tamano=500`)
        .set(asAdmin())
        .expect(400);
      await http()
        .post(`${API}/reglas-cuota/abc/generacion`)
        .set(asAdmin())
        .send({ periodo: PERIOD })
        .expect(400);
    });

    it('404 REGLA_INEXISTENTE', async () => {
      for (const res of [
        await preview(9999),
        await execute(9999),
        await http().get(`${API}/reglas-cuota/9999/ejecuciones`).set(asAdmin()),
      ]) {
        expect(res.status).toBe(404);
        expect(res.body.codigo).toBe('REGLA_INEXISTENTE');
      }
    });

    it.each(['PAUSADA', 'INACTIVA'])(
      '422 REGLA_INACTIVA con una regla %s, sin crear nada',
      async (estado) => {
        const ruleId = await createRule();
        await http()
          .patch(`${API}/reglas-cuota/${ruleId}/estado`)
          .set(asAdmin())
          .send({ estado })
          .expect(200);

        for (const res of [await preview(ruleId), await execute(ruleId)]) {
          expect(res.status).toBe(422);
          expect(res.body.codigo).toBe('REGLA_INACTIVA');
        }
        expect(await snapshot()).toMatchObject({ fees: 0, runs: 0 });
      },
    );

    it('422 REGLA_INACTIVA con un periodo futuro', async () => {
      const ruleId = await createRule();
      for (const res of [
        await preview(ruleId, '2099-01'),
        await execute(ruleId, '2099-01'),
      ]) {
        expect(res.status).toBe(422);
        expect(res.body.codigo).toBe('REGLA_INACTIVA');
      }
      expect(await snapshot()).toMatchObject({ fees: 0, runs: 0 });
    });

    it('un residente recibe 403 ROL_NO_PERMITIDO en los tres endpoints', async () => {
      const ruleId = await createRule();
      const resident = { Authorization: `Bearer ${residentToken}` };
      for (const res of [
        await http()
          .post(`${API}/reglas-cuota/${ruleId}/generacion/vista-previa`)
          .set(resident)
          .send({ periodo: PERIOD }),
        await http()
          .post(`${API}/reglas-cuota/${ruleId}/generacion`)
          .set(resident)
          .send({ periodo: PERIOD }),
        await http()
          .get(`${API}/reglas-cuota/${ruleId}/ejecuciones`)
          .set(resident),
      ]) {
        expect(res.status).toBe(403);
        expect(res.body.codigo).toBe('ROL_NO_PERMITIDO');
      }
      expect(await prisma.fee.count()).toBe(0);
    });
  });
});
