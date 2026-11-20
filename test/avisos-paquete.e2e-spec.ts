import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { PrismaService } from '@Prisma/services';
import { AvisosPaqueteService } from '@Paquetes/services';
import {
  createTestApp,
  loginAs,
  resetDatabase,
  USERS,
  type TestUser,
} from './setup/create-test-app.js';

const API = '/api/v1';
const HOUR = 3_600_000;

describe('Avisos de paquetería (e2e) - H14', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let avisos: AvisosPaqueteService;
  let tokens: Record<TestUser, string>;

  const http = () => request(app.getHttpServer());
  const bearer = (user: TestUser) => ({
    Authorization: `Bearer ${tokens[user]}`,
  });

  async function registerFor(
    unitCode: string,
  ): Promise<{ id: string; folio: string }> {
    const unit = await prisma.unit.findUniqueOrThrow({
      where: { code: unitCode },
    });
    const response = await http()
      .post(`${API}/paquetes`)
      .set(bearer('seguridad'))
      .send({
        unitId: unit.id,
        recipientName: 'Ana Martínez',
        carrier: 'DHL',
        trackingReference: 'DHL-1',
        description: '1 caja',
      })
      .expect(201);
    return response.body;
  }

  async function notificationsOf(tipo: string) {
    return prisma.notificacion.findMany({
      where: { moduloOrigen: 'paqueteria', tipo },
      include: { residente: true },
    });
  }

  async function backdate(id: string, hours: number) {
    await prisma.package.update({
      where: { id },
      data: { receivedAt: new Date(Date.now() - hours * HOUR) },
    });
  }

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    avisos = app.get(AvisosPaqueteService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    const users = Object.keys(USERS) as TestUser[];
    tokens = Object.fromEntries(
      await Promise.all(users.map(async (u) => [u, await loginAs(app, u)])),
    ) as Record<TestUser, string>;
  });

  afterAll(async () => {
    await app.close();
  });

  it('al registrar un paquete avisa a todos los residentes de la unidad y a nadie más', async () => {
    const { id } = await registerFor('A-304');

    const notifications = await notificationsOf('LLEGADA_PAQUETE');

    expect(notifications.map((n) => n.residente.email).sort()).toEqual(
      [USERS.residente.email, USERS.residenteMismaUnidad.email].sort(),
    );
    const pickupCode = (
      await prisma.package.findUniqueOrThrow({ where: { id } })
    ).pickupCode;
    for (const notification of notifications) {
      expect(notification.enlaceAccion).toBe(`/paquetes/${id}`);
      expect(notification.mensaje).toContain('DHL');
      expect(notification.mensaje).toContain('Caseta principal');
      expect(notification.mensaje).toContain(pickupCode);
    }
  });

  it('el residente de otra unidad no recibe el aviso ni puede ver el paquete', async () => {
    const { id } = await registerFor('A-304');

    expect(
      (await notificationsOf('LLEGADA_PAQUETE')).some(
        (n) => n.residente.email === USERS.vecino.email,
      ),
    ).toBe(false);
    await http().get(`${API}/paquetes/${id}`).set(bearer('vecino')).expect(404);
  });

  it('con los avisos de paquetería desactivados no hay aviso, pero el paquete sí aparece en su historial', async () => {
    const resident = await prisma.user.findUniqueOrThrow({
      where: { email: USERS.residente.email },
    });
    await prisma.preferenciaNotificacion.create({
      data: {
        residenteId: resident.id,
        moduloOrigen: 'paqueteria',
        activo: false,
      },
    });

    const { id } = await registerFor('A-304');

    const recipients = (await notificationsOf('LLEGADA_PAQUETE')).map(
      (n) => n.residente.email,
    );
    expect(recipients).toEqual([USERS.residenteMismaUnidad.email]);
    const history = await http()
      .get(`${API}/paquetes/mis-paquetes`)
      .set(bearer('residente'))
      .expect(200);
    expect(history.body.items.map((p: { id: string }) => p.id)).toContain(id);
  });

  it('a las 72 horas pendiente envía un único recordatorio a la unidad', async () => {
    const due = await registerFor('A-304');
    const recent = await registerFor('B-103');
    await backdate(due.id, 73);
    await backdate(recent.id, 71);

    expect(await avisos.sendReminders()).toBe(1);
    expect(await avisos.sendReminders()).toBe(0);

    const reminders = await notificationsOf('RECORDATORIO_PAQUETE');
    expect(reminders.map((n) => n.residente.email).sort()).toEqual(
      [USERS.residente.email, USERS.residenteMismaUnidad.email].sort(),
    );
    expect(
      reminders.every((n) => n.enlaceAccion === `/paquetes/${due.id}`),
    ).toBe(true);
    const stored = await prisma.package.findUniqueOrThrow({
      where: { id: due.id },
    });
    expect(stored.reminderSentAt).not.toBeNull();
  });

  it('no envía recordatorio de un paquete ya entregado', async () => {
    const { id } = await registerFor('A-304');
    await backdate(id, 80);
    const pickupCode = (
      await prisma.package.findUniqueOrThrow({ where: { id } })
    ).pickupCode;
    await http()
      .patch(`${API}/paquetes/${id}/entrega`)
      .set(bearer('seguridad'))
      .send({ pickupCode, deliveredTo: 'Ana' })
      .expect(200);

    expect(await avisos.sendReminders()).toBe(0);
  });

  it('el historial informa los conteos por estado y busca por folio o transportista', async () => {
    const first = await registerFor('A-304');
    await registerFor('A-304');

    const response = await http()
      .get(`${API}/paquetes/mis-paquetes?q=${encodeURIComponent(first.folio)}`)
      .set(bearer('residente'))
      .expect(200);

    expect(response.body.counts).toEqual({
      TODOS: 2,
      PENDIENTE_RETIRO: 2,
      ENTREGADO: 0,
    });
    expect(response.body.items.map((p: { folio: string }) => p.folio)).toEqual([
      first.folio,
    ]);
  });
});
