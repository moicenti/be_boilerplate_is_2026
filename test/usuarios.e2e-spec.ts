import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { PrismaService } from '@Prisma/services';
import {
  createTestApp,
  loginAs,
  PASSWORD,
  resetDatabase,
  USERS,
  type TestUser,
} from './setup/create-test-app.js';

const API = '/api/v1';
const HOUR = 3_600_000;

describe('Usuarios (e2e) - desactivación por el administrador', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: Record<TestUser, string>;

  const http = () => request(app.getHttpServer());
  const bearer = (user: TestUser) => ({ Authorization: `Bearer ${tokens[user]}` });
  const idOf = async (user: TestUser) =>
    (await prisma.user.findUniqueOrThrow({ where: { email: USERS[user].email } })).id;
  const deactivate = async (user: TestUser, as: TestUser = 'admin') =>
    http().patch(`${API}/users/${await idOf(user)}/desactivar`).set(bearer(as));

  async function seedPackage(unitCode: string, folio: string, receivedAt: Date) {
    const unit = await prisma.unit.findUniqueOrThrow({ where: { code: unitCode } });
    return prisma.package.create({
      data: {
        folio,
        recipientName: 'Ana',
        carrier: 'DHL',
        trackingReference: folio,
        description: 'Caja',
        pickupCode: '123456',
        unitId: unit.id,
        receivedById: await idOf('seguridad'),
        receivedAt,
      },
    });
  }

  async function seedReservation(user: TestUser, startsInHours: number) {
    const area =
      (await prisma.commonArea.findFirst()) ??
      (await prisma.commonArea.create({
        data: { name: 'Casa club', capacity: 20, location: 'Centro', blockDurationHours: 2 },
      }));
    const resident = await prisma.user.findUniqueOrThrow({
      where: { email: USERS[user].email },
    });
    const startsAt = new Date(Date.now() + startsInHours * HOUR);
    return prisma.reservation.create({
      data: {
        areaId: area.id,
        residentId: resident.id,
        unitId: resident.unitId!,
        startsAt,
        endsAt: new Date(startsAt.getTime() + 2 * HOUR),
      },
    });
  }

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    await prisma.$executeRawUnsafe('TRUNCATE area_comun RESTART IDENTITY CASCADE');
    const users = Object.keys(USERS) as TestUser[];
    tokens = Object.fromEntries(
      await Promise.all(users.map(async (u) => [u, await loginAs(app, u)])),
    ) as Record<TestUser, string>;
  });

  afterAll(async () => {
    await app.close();
  });

  it('solo el administrador lista y desactiva cuentas', async () => {
    await http().get(`${API}/users`).set(bearer('residente')).expect(403);
    expect((await deactivate('vecino', 'seguridad')).status).toBe(403);

    const list = await http().get(`${API}/users?role=SEGURIDAD`).set(bearer('admin')).expect(200);
    expect(list.body.map((u: { email: string }) => u.email)).toEqual([
      'guardia2@test.com',
      'guardia@test.com',
    ]);
  });

  it('no desactiva administradores y responde 409 si ya estaba inactiva', async () => {
    expect((await deactivate('admin')).status).toBe(403);
    expect((await deactivate('seguridad')).status).toBe(200);
    expect((await deactivate('seguridad')).status).toBe(409);
  });

  it('la cuenta desactivada pierde el acceso de inmediato y no puede volver a entrar', async () => {
    const response = await deactivate('vecino');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ isActive: false, unit: null });

    await http().get(`${API}/auth/me`).set(bearer('vecino')).expect(401);
    await http()
      .post(`${API}/auth/login`)
      .send({ email: USERS.vecino.email, password: PASSWORD })
      .expect(401);
    expect(await prisma.refreshToken.count({ where: { userId: await idOf('vecino') } })).toBe(0);

    const inactive = await http().get(`${API}/users?activo=false`).set(bearer('admin')).expect(200);
    expect(inactive.body.map((u: { email: string }) => u.email)).toEqual(['vecino@test.com']);
  });

  it('cancela sus reservas futuras y deja de mostrar las suyas a la unidad', async () => {
    const mine = await seedReservation('residente', 24);
    const roommate = await seedReservation('residenteMismaUnidad', 48);

    await deactivate('residente');

    expect((await prisma.reservation.findUniqueOrThrow({ where: { id: mine.id } })).status).toBe(
      'CANCELADA',
    );
    const visible = await http().get(`${API}/reservas`).set(bearer('residenteMismaUnidad')).expect(200);
    expect(visible.body.map((r: { reservaId: number }) => r.reservaId)).toEqual([roommate.id]);
  });

  it('la unidad queda sin asignar y quien llegue después no ve los paquetes anteriores', async () => {
    await seedPackage('B-103', 'PAQ-VIEJO', new Date(Date.now() - HOUR));
    await deactivate('vecino');

    const unit = await prisma.unit.findUniqueOrThrow({
      where: { code: 'B-103' },
      include: { users: { where: { isActive: true } } },
    });
    expect(unit.users).toEqual([]);
    expect(unit.historyStartsAt).not.toBeNull();

    // Llega un residente nuevo a la unidad y recibe un paquete.
    const created = await http()
      .post(`${API}/users`)
      .set(bearer('admin'))
      .send({ email: 'nuevo@test.com', password: PASSWORD, role: 'RESIDENTE', unitId: unit.id })
      .expect(201);
    const old = await prisma.package.findUniqueOrThrow({ where: { folio: 'PAQ-VIEJO' } });
    await seedPackage('B-103', 'PAQ-NUEVO', new Date(Date.now() + 1000));

    const login = await http()
      .post(`${API}/auth/login`)
      .send({ email: created.body.email, password: PASSWORD })
      .expect(200);
    const auth = { Authorization: `Bearer ${login.body.accessToken}` };

    const mine = await http().get(`${API}/paquetes/mis-paquetes`).set(auth).expect(200);
    expect(mine.body.items.map((p: { folio: string }) => p.folio)).toEqual(['PAQ-NUEVO']);
    expect(mine.body.counts.TODOS).toBe(1);
    await http().get(`${API}/paquetes/${old.id}`).set(auth).expect(404);

    // Seguridad sigue viendo el paquete pendiente para entregarlo o devolverlo.
    const desk = await http().get(`${API}/paquetes?unidad=B-103`).set(bearer('seguridad')).expect(200);
    expect(desk.body.items.map((p: { folio: string }) => p.folio).sort()).toEqual([
      'PAQ-NUEVO',
      'PAQ-VIEJO',
    ]);
  });

  it('si la unidad conserva residentes activos, ellos siguen viendo sus paquetes', async () => {
    await seedPackage('A-304', 'PAQ-COMPARTIDO', new Date(Date.now() - HOUR));
    await deactivate('residente');

    const unit = await prisma.unit.findUniqueOrThrow({ where: { code: 'A-304' } });
    expect(unit.historyStartsAt).toBeNull();
    const mine = await http()
      .get(`${API}/paquetes/mis-paquetes`)
      .set(bearer('residenteMismaUnidad'))
      .expect(200);
    expect(mine.body.items.map((p: { folio: string }) => p.folio)).toEqual(['PAQ-COMPARTIDO']);
  });
});
