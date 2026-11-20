import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import bcrypt from 'bcrypt';
import type { PrismaService } from '@Prisma/services';
import { Role } from '@PrismaClient';
import {
  FeeGenerationScheduler,
  FeeGenerationService,
} from '../src/cuotas/services/index.js';
import { GenerationInProgressError } from '../src/cuotas/errors/index.js';
import {
  createTestApp,
  loginAs,
  resetDatabase,
} from './setup/create-test-app.js';

const API = '/api/v1';

// 00:05 del 1 de diciembre y del 1 de enero en El Salvador (UTC-6).
const DEC_1 = new Date('2026-12-01T06:05:00Z');
const JAN_1 = new Date('2027-01-01T06:05:00Z');

describe('Reglas y generación de cuotas (e2e) - H3', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let scheduler: FeeGenerationScheduler;
  let adminToken: string;
  let residentToken: string;

  const http = () => request(app.getHttpServer());
  const asAdmin = () => ({ Authorization: `Bearer ${adminToken}` });

  const rule = (overrides: Record<string, unknown> = {}) => ({
    concepto: 'Mantenimiento',
    tipoMonto: 'FIJO',
    monto: 100,
    diaGeneracion: 1,
    diaVencimiento: 10,
    alcance: 'TORRE',
    alcanceValor: 'Torre QA',
    politicaInactivas: 'OMITIR',
    ...overrides,
  });

  async function createRule(
    overrides: Record<string, unknown> = {},
  ): Promise<number> {
    const res = await http()
      .post(`${API}/reglas-cuota`)
      .set(asAdmin())
      .send(rule(overrides))
      .expect(201);
    return res.body.id as number;
  }

  /** `count` unidades en "Torre QA", cada una con un residente activo. */
  async function createUnits(
    count: number,
    tower = 'Torre QA',
  ): Promise<string[]> {
    const codes = Array.from(
      { length: count },
      (_, i) => `QA-${String(i + 1).padStart(3, '0')}`,
    );
    await prisma.unit.createMany({
      data: codes.map((code) => ({
        code,
        tower,
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

  const feesOf = (ruleId: number, period: string) =>
    prisma.fee.findMany({
      where: { ruleId, period },
      orderBy: { unitId: 'asc' },
    });

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    // Sin un puerto fijo, supertest levanta un servidor por petición y las paralelas fallan.
    await app.listen(0);
    scheduler = app.get(FeeGenerationScheduler);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    adminToken = await loginAs(app, 'admin');
    residentToken = await loginAs(app, 'residente');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Generación automática', () => {
    let unitIds: string[];

    beforeEach(async () => {
      // 20 unidades: una inactiva y una sin responsable.
      unitIds = await createUnits(20);
      await prisma.unit.update({
        where: { id: unitIds[0] },
        data: { active: false },
      });
      await prisma.user.deleteMany({ where: { unitId: unitIds[1] } });
    });

    it('en el día configurado crea una cuota PENDIENTE por unidad aplicable', async () => {
      const ruleId = await createRule();
      const [run] = await scheduler.runDaily(DEC_1);

      expect(run).toMatchObject({
        period: '2026-12',
        origin: 'AUTOMATICA',
        userId: null,
        status: 'COMPLETADA',
      });
      expect(run).toMatchObject({ created: 18, omitted: 2, failed: 0 });

      const fees = await feesOf(ruleId, '2026-12');
      expect(fees).toHaveLength(18);
      expect(fees[0]).toMatchObject({
        concept: 'Mantenimiento',
        status: 'PENDIENTE',
      });
      expect(fees[0].amount.toFixed(2)).toBe('100.00');
      expect(fees[0].dueDate.toISOString()).toBe('2026-12-10T00:00:00.000Z');
      expect(
        fees.some((f) => f.unitId === unitIds[0] || f.unitId === unitIds[1]),
      ).toBe(false);
    });

    it('fuera de su día no genera', async () => {
      await createRule({ diaGeneracion: 2, diaVencimiento: 10 });
      expect(await scheduler.runDaily(DEC_1)).toEqual([]);
      expect(await prisma.fee.count()).toBe(0);
    });

    it('ejecutar dos veces el mismo periodo no crea duplicados', async () => {
      const ruleId = await createRule();
      await scheduler.runDaily(DEC_1);
      const [second] = await scheduler.runDaily(DEC_1);

      expect(second).toMatchObject({
        created: 0,
        omitted: 20,
        failed: 0,
        status: 'COMPLETADA',
      });
      expect(await feesOf(ruleId, '2026-12')).toHaveLength(18);
      expect(await prisma.generationRun.count({ where: { ruleId } })).toBe(2);
    });

    it('cambiar el monto no altera las cuotas generadas; el siguiente periodo usa el nuevo', async () => {
      const ruleId = await createRule();
      await scheduler.runDaily(DEC_1);

      await http()
        .put(`${API}/reglas-cuota/${ruleId}`)
        .set(asAdmin())
        .send(rule({ monto: 150 }))
        .expect(200);
      await scheduler.runDaily(JAN_1);

      const december = await feesOf(ruleId, '2026-12');
      const january = await feesOf(ruleId, '2027-01');
      expect(december.every((f) => f.amount.toFixed(2) === '100.00')).toBe(
        true,
      );
      expect(january).toHaveLength(18);
      expect(january.every((f) => f.amount.toFixed(2) === '150.00')).toBe(true);
    });

    it('una regla PAUSADA no genera aunque llegue su día', async () => {
      const ruleId = await createRule();
      await http()
        .patch(`${API}/reglas-cuota/${ruleId}/estado`)
        .set(asAdmin())
        .send({ estado: 'PAUSADA' })
        .expect(200);

      expect(await scheduler.runDaily(DEC_1)).toEqual([]);
      expect(await prisma.fee.count()).toBe(0);
    });

    it('política GENERAR incluye inactivas y sin responsable', async () => {
      const ruleId = await createRule({ politicaInactivas: 'GENERAR' });
      const [run] = await scheduler.runDaily(DEC_1);
      expect(run).toMatchObject({ created: 20, omitted: 0, failed: 0 });
      expect(await feesOf(ruleId, '2026-12')).toHaveLength(20);
    });

    it('política REVISAR: las demás se generan y cada caso queda registrado con su causa', async () => {
      await createRule({ politicaInactivas: 'REVISAR' });
      const [run] = await scheduler.runDaily(DEC_1);

      expect(run).toMatchObject({
        created: 18,
        omitted: 0,
        failed: 2,
        status: 'CON_ERRORES',
      });
      const errors = await prisma.generationError.findMany({
        where: { runId: run.id },
        orderBy: { cause: 'asc' },
      });
      expect(errors.map((e) => [e.unitId, e.cause])).toEqual([
        [unitIds[0], 'Unidad inactiva: requiere revisión.'],
        [unitIds[1], 'Unidad sin responsable: requiere revisión.'],
      ]);
    });

    it('una ejecución interrumpida se completa en la siguiente sin duplicar ni perder cuotas', async () => {
      const ruleId = await createRule();
      const rows = await prisma.feeRule.findUniqueOrThrow({
        where: { id: ruleId },
      });
      // Simula una caída: ejecución EN_CURSO de hace 2 horas que alcanzó a crear 5 cuotas.
      const stale = await prisma.generationRun.create({
        data: {
          ruleId,
          period: '2026-12',
          origin: 'AUTOMATICA',
          startedAt: new Date(DEC_1.getTime() - 2 * 3600_000),
          created: 5,
        },
      });
      await prisma.fee.createMany({
        data: unitIds.slice(2, 7).map((unitId) => ({
          unitId,
          ruleId,
          concept: rows.concept,
          period: '2026-12',
          amount: 100,
          dueDate: new Date('2026-12-10T00:00:00Z'),
        })),
      });

      // Al día siguiente (2 dic) la regla no toca, pero se reanuda por estar interrumpida.
      const [resumed] = await scheduler.runDaily(
        new Date('2026-12-02T06:05:00Z'),
      );

      expect(resumed).toMatchObject({
        created: 13,
        omitted: 7,
        status: 'COMPLETADA',
      });
      expect(await feesOf(ruleId, '2026-12')).toHaveLength(18);
      expect(
        await prisma.generationRun.findUniqueOrThrow({
          where: { id: stale.id },
        }),
      ).toMatchObject({
        status: 'CON_ERRORES',
        finishedAt: expect.any(Date),
      });
    });

    it('no permite dos ejecuciones EN_CURSO para la misma regla y periodo', async () => {
      const ruleId = await createRule();
      await prisma.generationRun.create({
        data: { ruleId, period: '2026-12', origin: 'MANUAL' },
      });
      const rule = await prisma.feeRule.findUniqueOrThrow({
        where: { id: ruleId },
        include: { units: { select: { unitId: true } }, typeAmounts: true },
      });

      await expect(
        app.get(FeeGenerationService).generate(rule, '2026-12', 'AUTOMATICA'),
      ).rejects.toBeInstanceOf(GenerationInProgressError);
      expect(await prisma.fee.count()).toBe(0);
    });
  });

  it('monto por tipo de unidad y alcance por selección', async () => {
    const [house, shop, other] = await createUnits(3);
    await prisma.unit.update({ where: { id: house }, data: { type: 'CASA' } });
    await prisma.unit.update({ where: { id: shop }, data: { type: 'LOCAL' } });

    const ruleId = await createRule({
      tipoMonto: 'POR_TIPO_UNIDAD',
      monto: null,
      montosPorTipo: [
        { tipo: 'CASA', monto: 300 },
        { tipo: 'LOCAL', monto: 250.5 },
      ],
      alcance: 'SELECCION',
      alcanceValor: null,
      unidadIds: [house, shop],
    });
    await scheduler.runDaily(DEC_1);

    const fees = await feesOf(ruleId, '2026-12');
    const amounts = Object.fromEntries(
      fees.map((f) => [f.unitId, f.amount.toFixed(2)]),
    );
    expect(amounts).toEqual({ [house]: '300.00', [shop]: '250.50' });
    expect(amounts[other]).toBeUndefined();
  });

  it('procesa 500 unidades en menos de 1 minuto', async () => {
    await createUnits(500);
    await createRule();

    const started = Date.now();
    const [run] = await scheduler.runDaily(DEC_1);
    const elapsed = Date.now() - started;

    expect(run).toMatchObject({ created: 500, status: 'COMPLETADA' });
    expect(elapsed).toBeLessThan(60_000);
  }, 90_000);

  describe('API de reglas', () => {
    it('registra creación, edición y cambio de estado con usuario y fecha', async () => {
      await createUnits(1);
      const ruleId = await createRule();
      await http()
        .put(`${API}/reglas-cuota/${ruleId}`)
        .set(asAdmin())
        .send(rule({ monto: 120 }))
        .expect(200);
      await http()
        .patch(`${API}/reglas-cuota/${ruleId}/estado`)
        .set(asAdmin())
        .send({ estado: 'INACTIVA' })
        .expect(200);

      const res = await http()
        .get(`${API}/reglas-cuota/${ruleId}/historial`)
        .set(asAdmin())
        .expect(200);
      expect(res.body.map((c: { accion: string }) => c.accion)).toEqual([
        'CREACION',
        'EDICION',
        'CAMBIO_ESTADO',
      ]);
      expect(res.body[1].valorAnterior.monto).toBe('100.00');
      expect(res.body[1].valorNuevo.monto).toBe('120.00');
      expect(res.body[2]).toMatchObject({
        valorAnterior: { estado: 'ACTIVA' },
        valorNuevo: { estado: 'INACTIVA' },
        usuario: 'admin@test.com',
        fecha: expect.stringMatching(/-06:00$/),
      });
    });

    it('una regla con cuotas no se elimina: solo se desactiva y conserva su historial', async () => {
      await createUnits(2);
      const ruleId = await createRule();
      await scheduler.runDaily(DEC_1);

      await expect(
        prisma.feeRule.delete({ where: { id: ruleId } }),
      ).rejects.toThrow();
      await http()
        .patch(`${API}/reglas-cuota/${ruleId}/estado`)
        .set(asAdmin())
        .send({ estado: 'INACTIVA' })
        .expect(200);
      expect(await prisma.fee.count({ where: { ruleId } })).toBe(2);
    });

    it('un residente recibe 403 en todos los endpoints', async () => {
      const ruleId = await createRule({ estado: 'INACTIVA' });
      const resident = { Authorization: `Bearer ${residentToken}` };
      const calls = [
        http().post(`${API}/reglas-cuota`).set(resident).send(rule()),
        http().get(`${API}/reglas-cuota`).set(resident),
        http().get(`${API}/reglas-cuota/${ruleId}`).set(resident),
        http().put(`${API}/reglas-cuota/${ruleId}`).set(resident).send(rule()),
        http()
          .patch(`${API}/reglas-cuota/${ruleId}/estado`)
          .set(resident)
          .send({ estado: 'ACTIVA' }),
        http().get(`${API}/reglas-cuota/${ruleId}/historial`).set(resident),
      ];
      for (const res of await Promise.all(calls)) {
        expect(res.status).toBe(403);
        expect(res.body.codigo).toBe('ROL_NO_PERMITIDO');
      }
    });
  });
});
