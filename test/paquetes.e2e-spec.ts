import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { PrismaService } from '@Prisma/services';
import {
  createTestApp,
  loginAs,
  resetDatabase,
  USERS,
  type TestUser,
} from './setup/create-test-app.js';

const API = '/api/v1';

describe('Paquetes (e2e) - H13', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: Record<TestUser, string>;
  let unitA304: string;

  const http = () => request(app.getHttpServer());
  const bearer = (user: TestUser) => ({
    Authorization: `Bearer ${tokens[user]}`,
  });

  const validPackage = () => ({
    unitId: unitA304,
    recipientName: 'Ana Martínez',
    carrier: 'DHL',
    trackingReference: 'DHL-123',
    description: '1 caja mediana',
  });

  async function registerPackage(): Promise<{ id: string; folio: string }> {
    const response = await http()
      .post(`${API}/paquetes`)
      .set(bearer('seguridad'))
      .send(validPackage())
      .expect(201);
    return response.body;
  }

  async function pickupCodeOf(id: string): Promise<string> {
    const pkg = await prisma.package.findUniqueOrThrow({ where: { id } });
    return pkg.pickupCode;
  }

  function wrongCode(code: string): string {
    return String((Number(code) + 1) % 1_000_000).padStart(6, '0');
  }

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    const users = Object.keys(USERS) as TestUser[];
    tokens = Object.fromEntries(
      await Promise.all(users.map(async (u) => [u, await loginAs(app, u)])),
    ) as Record<TestUser, string>;
    unitA304 = (
      await prisma.unit.findUniqueOrThrow({ where: { code: 'A-304' } })
    ).id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /paquetes (registro)', () => {
    it('deja el paquete pendiente con folio, código de 6 dígitos, fecha y el guardia', async () => {
      const response = await http()
        .post(`${API}/paquetes`)
        .set(bearer('seguridad'))
        .send(validPackage())
        .expect(201);

      expect(response.body).toMatchObject({
        status: 'PENDIENTE_RETIRO',
        recipientName: 'Ana Martínez',
        carrier: 'DHL',
        unit: { code: 'A-304' },
        receivedBy: { email: 'guardia@test.com' },
        deliveredAt: null,
      });
      expect(response.body.folio).toMatch(/^PAQ-\d{4}-\d{4,}$/);
      expect(new Date(response.body.receivedAt).getTime()).not.toBeNaN();
      expect(response.body).not.toHaveProperty('pickupCode');
      expect(await pickupCodeOf(response.body.id)).toMatch(/^\d{6}$/);
    });

    it('asigna folios distintos a registros simultáneos', async () => {
      const responses = await Promise.all(
        Array.from({ length: 5 }, () =>
          http()
            .post(`${API}/paquetes`)
            .set(bearer('seguridad'))
            .send(validPackage()),
        ),
      );

      const folios = responses.map((r) => r.body.folio);
      expect(responses.every((r) => r.status === 201)).toBe(true);
      expect(new Set(folios).size).toBe(5);
    });

    it('no guarda el paquete si la unidad no existe e indica el motivo', async () => {
      const response = await http()
        .post(`${API}/paquetes`)
        .set(bearer('seguridad'))
        .send({
          ...validPackage(),
          unitId: '3f1c2a4e-1b2c-4d5e-8f90-123456789abc',
        })
        .expect(404);

      expect(response.body.message).toBe(
        'La unidad indicada no existe en el condominio.',
      );
      expect(await prisma.package.count()).toBe(0);
    });

    it('responde 400 con el motivo si faltan campos obligatorios', async () => {
      const response = await http()
        .post(`${API}/paquetes`)
        .set(bearer('seguridad'))
        .send({ unitId: unitA304, recipientName: '   ' })
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([
          'El nombre del destinatario es obligatorio.',
          'La empresa de mensajería es obligatoria.',
        ]),
      );
    });

    it.each<TestUser>(['residente', 'admin'])(
      'no permite registrar a %s (403)',
      async (user) => {
        await http()
          .post(`${API}/paquetes`)
          .set(bearer(user))
          .send(validPackage())
          .expect(403);
        expect(await prisma.package.count()).toBe(0);
      },
    );

    it('responde 401 sin token', async () => {
      await http().post(`${API}/paquetes`).send(validPackage()).expect(401);
    });
  });

  describe('PATCH /paquetes/:id/entrega (entrega)', () => {
    it('con el código correcto pasa a Entregado con fecha, receptor y guardia', async () => {
      const { id } = await registerPackage();

      const response = await http()
        .patch(`${API}/paquetes/${id}/entrega`)
        .set(bearer('seguridad2'))
        .send({
          pickupCode: await pickupCodeOf(id),
          deliveredTo: 'Ana Martínez',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'ENTREGADO',
        deliveredTo: 'Ana Martínez',
        deliveredBy: { email: 'guardia2@test.com' },
      });
      expect(new Date(response.body.deliveredAt).getTime()).not.toBeNaN();
    });

    it('con un código que no coincide no lo entrega y muestra el mensaje', async () => {
      const { id } = await registerPackage();
      const code = await pickupCodeOf(id);

      const response = await http()
        .patch(`${API}/paquetes/${id}/entrega`)
        .set(bearer('seguridad'))
        .send({ pickupCode: wrongCode(code), deliveredTo: 'Ana Martínez' })
        .expect(422);

      expect(response.body.message).toBe(
        'El código de retiro no corresponde a este paquete.',
      );
      const pkg = await prisma.package.findUniqueOrThrow({ where: { id } });
      expect(pkg.status).toBe('PENDIENTE_RETIRO');
    });

    it('si ya fue entregado no lo permite y muestra la fecha y quién lo recibió', async () => {
      const { id } = await registerPackage();
      const pickupCode = await pickupCodeOf(id);
      await http()
        .patch(`${API}/paquetes/${id}/entrega`)
        .set(bearer('seguridad'))
        .send({ pickupCode, deliveredTo: 'Ana Martínez' })
        .expect(200);

      const response = await http()
        .patch(`${API}/paquetes/${id}/entrega`)
        .set(bearer('seguridad'))
        .send({ pickupCode, deliveredTo: 'Otra persona' })
        .expect(409);

      expect(response.body.deliveredTo).toBe('Ana Martínez');
      expect(response.body.deliveredAt).toBeTruthy();
      expect(response.body.message).toContain('Ana Martínez');
    });

    it('si dos guardias lo entregan a la vez, solo uno lo consigue', async () => {
      const { id } = await registerPackage();
      const pickupCode = await pickupCodeOf(id);

      const responses = await Promise.all(
        (['seguridad', 'seguridad2'] as const).map((user) =>
          http()
            .patch(`${API}/paquetes/${id}/entrega`)
            .set(bearer(user))
            .send({ pickupCode, deliveredTo: `Recibe ${user}` }),
        ),
      );

      expect(responses.map((r) => r.status).sort((a, b) => a - b)).toEqual([
        200, 409,
      ]);
    });

    it('no permite entregar a un residente (403)', async () => {
      const { id } = await registerPackage();

      await http()
        .patch(`${API}/paquetes/${id}/entrega`)
        .set(bearer('residente'))
        .send({ pickupCode: await pickupCodeOf(id), deliveredTo: 'Ana' })
        .expect(403);
    });

    it('responde 404 si el paquete no existe', async () => {
      await http()
        .patch(`${API}/paquetes/3f1c2a4e-1b2c-4d5e-8f90-123456789abc/entrega`)
        .set(bearer('seguridad'))
        .send({ pickupCode: '123456', deliveredTo: 'Ana' })
        .expect(404);
    });
  });

  describe('DELETE /paquetes/:id', () => {
    it.each<TestUser>(['seguridad', 'admin', 'residente'])(
      'no existe la ruta y el paquete se conserva (%s)',
      async (user) => {
        const { id } = await registerPackage();

        await http()
          .delete(`${API}/paquetes/${id}`)
          .set(bearer(user))
          .expect(404);

        expect(await prisma.package.count({ where: { id } })).toBe(1);
      },
    );
  });

  describe('GET /paquetes/:id (detalle)', () => {
    it.each<TestUser>(['seguridad', 'admin'])(
      'devuelve el paquete sin el código de retiro (%s)',
      async (user) => {
        const { id, folio } = await registerPackage();

        const response = await http()
          .get(`${API}/paquetes/${id}`)
          .set(bearer(user))
          .expect(200);

        expect(response.body).toMatchObject({
          id,
          folio,
          unit: { code: 'A-304' },
        });
        expect(response.body).not.toHaveProperty('pickupCode');
      },
    );

    it('responde 404 si el paquete no existe', async () => {
      await http()
        .get(`${API}/paquetes/3f1c2a4e-1b2c-4d5e-8f90-123456789abc`)
        .set(bearer('seguridad'))
        .expect(404);
    });

    it.each<TestUser>(['residente', 'residenteMismaUnidad'])(
      'muestra al residente de la unidad su paquete pendiente con el código de retiro (%s)',
      async (user) => {
        const { id } = await registerPackage();

        const response = await http()
          .get(`${API}/paquetes/${id}`)
          .set(bearer(user))
          .expect(200);

        expect(response.body.status).toBe('PENDIENTE_RETIRO');
        expect(response.body.pickupCode).toBe(await pickupCodeOf(id));
      },
    );

    it('no muestra el código de retiro cuando el paquete ya fue entregado', async () => {
      const { id } = await registerPackage();
      await http()
        .patch(`${API}/paquetes/${id}/entrega`)
        .set(bearer('seguridad'))
        .send({ pickupCode: await pickupCodeOf(id), deliveredTo: 'Ana' })
        .expect(200);

      const response = await http()
        .get(`${API}/paquetes/${id}`)
        .set(bearer('residente'))
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'ENTREGADO',
        deliveredTo: 'Ana',
      });
      expect(response.body).not.toHaveProperty('pickupCode');
    });

    it('no muestra a un residente el paquete de otra unidad, aunque cambie el enlace (404)', async () => {
      const { id } = await registerPackage();

      const response = await http()
        .get(`${API}/paquetes/${id}`)
        .set(bearer('vecino'))
        .expect(404);

      expect(response.body).not.toHaveProperty('folio');
      expect(response.body).not.toHaveProperty('pickupCode');
    });
  });

  describe('GET /paquetes/mis-paquetes (historial del residente)', () => {
    async function createForUnit(
      unitCode: string,
      count: number,
      status: 'PENDIENTE_RETIRO' | 'ENTREGADO' = 'PENDIENTE_RETIRO',
      startAt = 1,
    ): Promise<void> {
      const guard = await prisma.user.findUniqueOrThrow({
        where: { email: USERS.seguridad.email },
      });
      const targetUnit = await prisma.unit.findUniqueOrThrow({
        where: { code: unitCode },
      });
      await prisma.package.createMany({
        data: Array.from({ length: count }, (_, i) => {
          const n = startAt + i;
          return {
            number: n,
            folio: `PAQ-2026-${String(n).padStart(4, '0')}`,
            pickupCode: '123456',
            unitId: targetUnit.id,
            receivedById: guard.id,
            receivedAt: new Date(Date.UTC(2026, 10, 1, 8, n)),
            recipientName: `Destinatario ${n}`,
            carrier: 'DHL',
            trackingReference: 'REF',
            description: 'caja',
            status,
            ...(status === 'ENTREGADO'
              ? {
                  deliveredTo: `Recibe ${n}`,
                  deliveredById: guard.id,
                  deliveredAt: new Date(Date.UTC(2026, 10, 2, 8, n)),
                }
              : {}),
          };
        }),
      });
    }

    const mine = (user: TestUser, query = '') =>
      http().get(`${API}/paquetes/mis-paquetes${query}`).set(bearer(user));

    it('lista solo los paquetes de su unidad, del más reciente al más antiguo', async () => {
      await createForUnit('A-304', 3);
      await createForUnit('B-103', 2, 'PENDIENTE_RETIRO', 10);

      const response = await mine('residente').expect(200);

      expect(
        response.body.items.map((p: { folio: string }) => p.folio),
      ).toEqual(['PAQ-2026-0003', 'PAQ-2026-0002', 'PAQ-2026-0001']);
      expect(response.body).toMatchObject({ total: 3, pendingCount: 3 });
      expect(response.body.items[0]).toMatchObject({
        carrier: 'DHL',
        status: 'PENDIENTE_RETIRO',
        unit: { code: 'A-304' },
      });
      expect(response.body.items[0].receivedAt).toBeTruthy();
      expect(response.body.items[0]).not.toHaveProperty('pickupCode');
    });

    it('todos los residentes de la unidad ven el mismo historial', async () => {
      await createForUnit('A-304', 2);

      const first = await mine('residente').expect(200);
      const second = await mine('residenteMismaUnidad').expect(200);

      expect(second.body.items).toEqual(first.body.items);
    });

    it('en los entregados muestra la fecha de entrega y quién lo recibió', async () => {
      await createForUnit('A-304', 1, 'ENTREGADO');

      const response = await mine('residente').expect(200);

      expect(response.body.items[0]).toMatchObject({
        status: 'ENTREGADO',
        deliveredTo: 'Recibe 1',
      });
      expect(response.body.items[0].deliveredAt).toBeTruthy();
    });

    it('filtra por estado y siempre informa el total de pendientes', async () => {
      await createForUnit('A-304', 2, 'PENDIENTE_RETIRO');
      await createForUnit('A-304', 3, 'ENTREGADO', 3);

      const pendientes = await mine('residente', '?estado=PENDIENTE_RETIRO');
      const entregados = await mine('residente', '?estado=ENTREGADO');

      expect(pendientes.body).toMatchObject({ total: 2, pendingCount: 2 });
      expect(
        pendientes.body.items.every(
          (p: { status: string }) => p.status === 'PENDIENTE_RETIRO',
        ),
      ).toBe(true);
      expect(entregados.body).toMatchObject({ total: 3, pendingCount: 2 });
      expect(
        entregados.body.items.every(
          (p: { status: string }) => p.status === 'ENTREGADO',
        ),
      ).toBe(true);
    });

    it('pagina de 20 en 20', async () => {
      await createForUnit('A-304', 23);

      const page1 = await mine('residente').expect(200);
      const page2 = await mine('residente', '?page=2').expect(200);

      expect(page1.body.items).toHaveLength(20);
      expect(page2.body.items).toHaveLength(3);
      expect(page1.body).toMatchObject({ total: 23, totalPages: 2 });
      expect(page2.body.items[2].folio).toBe('PAQ-2026-0001');
    });

    it('responde 400 con un estado inválido', async () => {
      await mine('residente', '?estado=PERDIDO').expect(400);
    });

    it.each<TestUser>(['seguridad', 'admin'])(
      'no está disponible para %s (403)',
      async (user) => {
        await mine(user).expect(403);
      },
    );
  });

  describe('GET /paquetes (listado de seguridad)', () => {
    it('lista solo los pendientes, con los totales y sin el código de retiro', async () => {
      const first = await registerPackage();
      const second = await registerPackage();
      await http()
        .patch(`${API}/paquetes/${second.id}/entrega`)
        .set(bearer('seguridad'))
        .send({ pickupCode: await pickupCodeOf(second.id), deliveredTo: 'Ana' })
        .expect(200);

      const response = await http()
        .get(`${API}/paquetes`)
        .set(bearer('seguridad'))
        .expect(200);

      expect(response.body).toMatchObject({
        total: 1,
        pendingCount: 1,
        pendingRecipientCount: 1,
        page: 1,
        pageSize: 20,
        carriers: ['DHL'],
      });
      expect(response.body.items.map((p: { id: string }) => p.id)).toEqual([
        first.id,
      ]);
      expect(response.body.items[0]).not.toHaveProperty('pickupCode');
    });

    it('pagina de 20 en 20', async () => {
      const guard = await prisma.user.findUniqueOrThrow({
        where: { email: 'guardia@test.com' },
      });
      await prisma.package.createMany({
        data: Array.from({ length: 23 }, (_, i) => ({
          number: i + 1,
          folio: `PAQ-2026-${String(i + 1).padStart(4, '0')}`,
          pickupCode: '123456',
          unitId: unitA304,
          receivedById: guard.id,
          recipientName: `Residente ${i + 1}`,
          carrier: 'DHL',
          trackingReference: 'REF',
          description: 'caja',
        })),
      });

      const page1 = await http()
        .get(`${API}/paquetes`)
        .set(bearer('seguridad'))
        .expect(200);
      const page2 = await http()
        .get(`${API}/paquetes?page=2`)
        .set(bearer('seguridad'))
        .expect(200);

      expect(page1.body.items).toHaveLength(20);
      expect(page2.body.items).toHaveLength(3);
      expect(page1.body).toMatchObject({ total: 23, totalPages: 2 });
    });

    it('no da acceso a un residente (403)', async () => {
      await http().get(`${API}/paquetes`).set(bearer('residente')).expect(403);
    });
  });
});
