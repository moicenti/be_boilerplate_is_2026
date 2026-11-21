import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { PrismaService } from '@Prisma/services';
import { FeeStatus, type Prisma } from '@PrismaClient';
import { createTestApp, loginAs, resetDatabase, type TestUser } from './setup/create-test-app.js';

const API = '/api/v1';
const MISSING_UNIT = '00000000-0000-4000-8000-000000000000';

describe('Estado de cuenta y pago de cuotas (e2e) - H1', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const tokens = {} as Record<TestUser, string>;
  let unitA: string; // A-304: residente y residenteMismaUnidad
  let unitB: string; // B-103: vecino

  const http = () => request(app.getHttpServer());
  const as = (user: TestUser) => ({ Authorization: `Bearer ${tokens[user]}` });

  async function createFee(unitId: string, dueDate: string, amount: number, status: FeeStatus = FeeStatus.PENDIENTE) {
    const fee = await prisma.fee.create({
      data: {
        unitId,
        concept: 'Mantenimiento',
        period: dueDate.slice(0, 7),
        amount,
        dueDate: new Date(`${dueDate}T00:00:00Z`),
        status,
      },
    });
    return fee.id;
  }

  const statement = (unitId: string, user: TestUser = 'residente') =>
    http().get(`${API}/unidades/${unitId}/estado-de-cuenta`).set(as(user));

  const pay = (body: Record<string, unknown>, user: TestUser = 'residente') =>
    http().post(`${API}/pagos`).set(as(user)).send({ unidadId: unitA, ...body });

  const paymentCount = () => prisma.payment.count();

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    // Con el servidor escuchando, supertest no abre uno efímero por request y las requests
    // simultáneas (prueba de concurrencia) no se pisan.
    await app.listen(0);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    const units = await prisma.unit.findMany({ select: { id: true, code: true } });
    unitA = units.find((u) => u.code === 'A-304')!.id;
    unitB = units.find((u) => u.code === 'B-103')!.id;
    for (const user of ['residente', 'residenteMismaUnidad', 'vecino', 'admin', 'seguridad'] as const) {
      tokens[user] = await loginAs(app, user);
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /unidades/:unidadId/estado-de-cuenta', () => {
    it('una unidad sin cuotas responde 200 con saldo 0 y listas vacías', async () => {
      const res = await statement(unitA).expect(200);
      expect(res.body).toEqual({ unidadId: unitA, saldoTotal: 0, cuotas: [], pagos: [] });
    });

    it('refleja pagos parciales: saldo por cuota y total, cuotas por vencimiento descendente', async () => {
      const sep = await createFee(unitA, '2026-09-10', 100);
      const oct = await createFee(unitA, '2026-10-10', 100);
      const nov = await createFee(unitA, '2026-11-10', 100);
      await createFee(unitA, '2026-08-10', 80, FeeStatus.ANULADA);
      await createFee(unitB, '2026-11-10', 999); // De otra unidad: no debe aparecer.

      await pay({ cuotaIds: [sep, oct], monto: 150 }).expect(201);

      const res = await statement(unitA).expect(200);
      expect(res.body.saldoTotal).toBe(150);
      expect(res.body.cuotas.map((c: { id: number; estado: string; saldo: number }) => [c.id, c.estado, c.saldo])).toEqual([
        [nov, 'PENDIENTE', 100],
        [oct, 'PARCIAL', 50],
        [sep, 'PAGADA', 0],
        [expect.any(Number), 'ANULADA', 80],
      ]);
      expect(res.body.cuotas[0]).toMatchObject({ periodo: '2026-11', concepto: 'Mantenimiento', monto: 100, fechaVencimiento: '2026-11-10' });
      expect(res.body.pagos).toHaveLength(2);
      expect(res.body.pagos.map((p: { cuotaId: number; monto: number }) => [p.cuotaId, p.monto])).toEqual(
        expect.arrayContaining([
          [sep, 100],
          [oct, 50],
        ]),
      );
      // Ambas líneas pertenecen al mismo pago.
      expect(new Set(res.body.pagos.map((p: { pagoId: number }) => p.pagoId)).size).toBe(1);
      expect(res.body.pagos[0].fechaPago).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-06:00$/);
    });

    it('otro residente de la misma unidad ve el mismo estado de cuenta', async () => {
      await createFee(unitA, '2026-11-10', 100);
      const res = await statement(unitA, 'residenteMismaUnidad').expect(200);
      expect(res.body.saldoTotal).toBe(100);
    });

    it('403 RECURSO_AJENO al consultar una unidad ajena, sin exponer datos', async () => {
      await createFee(unitB, '2026-11-10', 100);
      const res = await statement(unitB).expect(403);
      expect(res.body).toEqual({ codigo: 'RECURSO_AJENO', mensaje: expect.any(String) });
    });

    it('un residente recibe 403 (no 404) aunque la unidad no exista', async () => {
      await statement(MISSING_UNIT).expect(403);
    });

    it('el administrador consulta cualquier unidad y recibe 404 si no existe', async () => {
      await createFee(unitB, '2026-11-10', 100);
      expect((await statement(unitB, 'admin').expect(200)).body.saldoTotal).toBe(100);
      expect((await statement(MISSING_UNIT, 'admin').expect(404)).body.codigo).toBe('UNIDAD_INEXISTENTE');
    });

    it('400 si el id no es un UUID, 403 para seguridad y 401 sin sesión', async () => {
      expect((await statement('12', 'admin').expect(400)).body.codigo).toBe('SOLICITUD_INVALIDA');
      expect((await statement(unitA, 'seguridad').expect(403)).body.codigo).toBe('ROL_NO_PERMITIDO');
      const res = await http().get(`${API}/unidades/${unitA}/estado-de-cuenta`).expect(401);
      expect(res.body.codigo).toBe('NO_AUTENTICADO');
    });

    it('responde en menos de 2 s con 36 cuotas en la unidad', async () => {
      const fees: Prisma.FeeCreateManyInput[] = Array.from({ length: 36 }, (_, i) => {
        const month = new Date(Date.UTC(2024, i, 10));
        return {
          unitId: unitA,
          concept: 'Mantenimiento',
          period: month.toISOString().slice(0, 7),
          amount: 100,
          dueDate: month,
        };
      });
      await prisma.fee.createMany({ data: fees });

      const started = performance.now();
      const res = await statement(unitA).expect(200);
      expect(performance.now() - started).toBeLessThan(2000);
      expect(res.body.cuotas).toHaveLength(36);
      expect(res.body.saldoTotal).toBe(3600);
    });
  });

  describe('POST /pagos', () => {
    let oct: number;
    let nov: number;

    beforeEach(async () => {
      oct = await createFee(unitA, '2026-10-10', 100);
      nov = await createFee(unitA, '2026-11-10', 100);
    });

    it('un pago total deja la cuota PAGADA y el saldo disminuye', async () => {
      const res = await pay({ cuotaIds: [oct], monto: 100, referencia: 'TARJ-2026' }).expect(201);
      expect(res.body).toEqual({
        pagoId: expect.any(Number),
        fechaPago: expect.any(String),
        aplicado: [{ cuotaId: oct, montoAplicado: 100, estadoResultante: 'PAGADA' }],
        saldoRestante: 100,
      });

      const after = await statement(unitA).expect(200);
      expect(after.body.saldoTotal).toBe(100);
    });

    it('aplica por vencimiento ascendente: la primera PAGADA y la segunda PARCIAL', async () => {
      const res = await pay({ cuotaIds: [nov, oct], monto: 150 }).expect(201);
      expect(res.body.aplicado).toEqual([
        { cuotaId: oct, montoAplicado: 100, estadoResultante: 'PAGADA' },
        { cuotaId: nov, montoAplicado: 50, estadoResultante: 'PARCIAL' },
      ]);
      expect(res.body.saldoRestante).toBe(50);

      const fees = await prisma.fee.findMany({ orderBy: { id: 'asc' }, select: { status: true } });
      expect(fees.map((f) => f.status)).toEqual(['PAGADA', 'PARCIAL']);
    });

    it('un pago con decimales completa exactamente el saldo de una cuota PARCIAL', async () => {
      await pay({ cuotaIds: [oct], monto: 33.33 }).expect(201);
      const res = await pay({ cuotaIds: [oct], monto: 66.67 }).expect(201);
      expect(res.body.aplicado[0]).toEqual({ cuotaId: oct, montoAplicado: 66.67, estadoResultante: 'PAGADA' });
    });

    it('422 MONTO_EXCEDE_DEUDA y no registra nada', async () => {
      const res = await pay({ cuotaIds: [oct], monto: 100.01 }).expect(422);
      expect(res.body.codigo).toBe('MONTO_EXCEDE_DEUDA');
      expect(await paymentCount()).toBe(0);
      expect((await statement(unitA).expect(200)).body.saldoTotal).toBe(200);
    });

    it('409 con una referencia repetida, sin modificar saldos', async () => {
      await pay({ cuotaIds: [oct], monto: 10, referencia: 'TARJ-2026' }).expect(201);
      const res = await pay({ cuotaIds: [nov], monto: 10, referencia: 'TARJ-2026' }).expect(409);
      expect(res.body.codigo).toBe('CUOTA_YA_PAGADA');
      expect(await paymentCount()).toBe(1);
      expect((await statement(unitA).expect(200)).body.saldoTotal).toBe(190);
    });

    it('409 al volver a pagar una cuota ya pagada o anulada', async () => {
      await pay({ cuotaIds: [oct], monto: 100 }).expect(201);
      expect((await pay({ cuotaIds: [oct], monto: 1 }).expect(409)).body.codigo).toBe('CUOTA_YA_PAGADA');

      await prisma.fee.update({ where: { id: nov }, data: { status: FeeStatus.ANULADA } });
      expect((await pay({ cuotaIds: [nov], monto: 1 }).expect(409)).body.codigo).toBe('CUOTA_YA_PAGADA');
    });

    it('404 CUOTA_INEXISTENTE para una cuota inexistente o de otra unidad', async () => {
      const foreign = await createFee(unitB, '2026-11-10', 100);
      expect((await pay({ cuotaIds: [999999], monto: 1 }).expect(404)).body.codigo).toBe('CUOTA_INEXISTENTE');
      expect((await pay({ cuotaIds: [oct, foreign], monto: 1 }).expect(404)).body.codigo).toBe('CUOTA_INEXISTENTE');
      expect(await paymentCount()).toBe(0);
    });

    it('400 con lista vacía, monto menor o igual a 0 o cuotas repetidas', async () => {
      for (const body of [
        { cuotaIds: [], monto: 10 },
        { cuotaIds: [oct], monto: 0 },
        { cuotaIds: [oct], monto: -5 },
        { cuotaIds: [oct, oct], monto: 10 },
        { cuotaIds: [oct], monto: 10.001 },
      ]) {
        expect((await pay(body).expect(400)).body.codigo).toBe('SOLICITUD_INVALIDA');
      }
    });

    it('403 RECURSO_AJENO para otra unidad y ROL_NO_PERMITIDO para el administrador', async () => {
      const foreign = await createFee(unitB, '2026-11-10', 100);
      const ajeno = await pay({ unidadId: unitB, cuotaIds: [foreign], monto: 10 }).expect(403);
      expect(ajeno.body.codigo).toBe('RECURSO_AJENO');

      const adminRes = await pay({ cuotaIds: [oct], monto: 10 }, 'admin').expect(403);
      expect(adminRes.body.codigo).toBe('ROL_NO_PERMITIDO');
      expect(await paymentCount()).toBe(0);
    });

    it('la tarjeta de prueba que termina en 2026 se acepta', async () => {
      const res = await pay({ cuotaIds: [oct], monto: 100, tarjetaUltimos4: '2026' }).expect(201);
      expect(res.body.aplicado[0].estadoResultante).toBe('PAGADA');
    });

    it('la tarjeta de prueba que termina en 2000 se rechaza con 402 y no se registra nada', async () => {
      const res = await pay({ cuotaIds: [oct], monto: 100, tarjetaUltimos4: '2000' }).expect(402);
      expect(res.body.codigo).toBe('PAGO_RECHAZADO');
      expect(await paymentCount()).toBe(0);
    });

    it('un error a mitad de la transacción revierte todos los cambios', async () => {
      // El pago y lo aplicado ya se insertaron cuando falla la actualización de la cuota.
      const original = prisma.$transaction.bind(prisma) as (fn: (tx: unknown) => Promise<unknown>) => Promise<unknown>;
      const spy = vi.spyOn(prisma, '$transaction').mockImplementationOnce(((fn: (tx: unknown) => Promise<unknown>) =>
        original((tx) =>
          fn(
            new Proxy(tx as object, {
              get: (target, prop) =>
                prop === 'fee'
                  ? new Proxy(Reflect.get(target, prop) as object, {
                      get: (delegate, method) =>
                        method === 'update'
                          ? () => Promise.reject(new Error('Fallo simulado'))
                          : Reflect.get(delegate, method),
                    })
                  : Reflect.get(target, prop),
            }),
          ),
        )) as never);

      await pay({ cuotaIds: [oct, nov], monto: 150, referencia: 'TARJ-ROLLBACK' }).expect(500);
      spy.mockRestore();

      expect(await paymentCount()).toBe(0);
      expect(await prisma.paymentAllocation.count()).toBe(0);
      const fees = await prisma.fee.findMany({ select: { status: true } });
      expect(fees.every((f) => f.status === FeeStatus.PENDIENTE)).toBe(true);

      // La referencia no quedó tomada: el reintento funciona.
      await pay({ cuotaIds: [oct, nov], monto: 150, referencia: 'TARJ-ROLLBACK' }).expect(201);
    });

    it('dos pagos simultáneos de la misma cuota: uno se registra y el otro recibe 409', async () => {
      const results = await Promise.all([
        pay({ cuotaIds: [oct], monto: 100 }),
        pay({ cuotaIds: [oct], monto: 100 }, 'residenteMismaUnidad'),
      ]);

      expect(results.map((r) => r.status).sort((a, b) => a - b)).toEqual([201, 409]);
      expect(await paymentCount()).toBe(1);
      const allocated = await prisma.paymentAllocation.aggregate({ _sum: { amount: true } });
      expect(allocated._sum.amount?.toNumber()).toBe(100);
    });
  });
});
