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
const HOUR = 3_600_000;
const fromNow = (hours: number) => new Date(Date.now() + hours * HOUR);

describe('Asambleas (e2e) - H16', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: Record<TestUser, string>;

  const http = () => request(app.getHttpServer());
  const bearer = (user: TestUser) => ({
    Authorization: `Bearer ${tokens[user]}`,
  });

  const topic = (overrides: Record<string, unknown> = {}) => ({
    title: 'Renovar el sistema de riego',
    description: 'Sustituir aspersores e instalar un programador.',
    opensAt: fromNow(50).toISOString(),
    closesAt: fromNow(120).toISOString(),
    options: ['A favor', 'En contra', 'Abstención'],
    ...overrides,
  });

  const payload = (overrides: Record<string, unknown> = {}) => ({
    title: 'Mejora del jardín central',
    type: 'EXTRAORDINARIA',
    modality: 'PRESENCIAL',
    startsAt: fromNow(48).toISOString(),
    endsAt: fromNow(49.5).toISOString(),
    location: 'Salón de eventos · Casa club',
    description: 'Convocamos a revisar la renovación del riego.',
    agenda: [
      { title: 'Estado actual del jardín' },
      { title: 'Presentación de la propuesta', description: 'Alcance y costo' },
    ],
    topics: [topic()],
    ...overrides,
  });

  async function createDraft(
    body = payload(),
  ): Promise<{ id: string; topics: { id: string }[] }> {
    const response = await http()
      .post(`${API}/asambleas`)
      .set(bearer('admin'))
      .send(body)
      .expect(201);
    return response.body;
  }

  async function insertPublished(
    topics: { opensAt: Date; closesAt: Date }[],
    folio = 'ASM-2026-900',
  ): Promise<{ id: string; topicIds: string[] }> {
    const admin = await prisma.user.findUniqueOrThrow({
      where: { email: USERS.admin.email },
    });
    const assembly = await prisma.assembly.create({
      data: {
        folio,
        title: `Asamblea ${folio}`,
        type: 'ORDINARIA',
        modality: 'PRESENCIAL',
        startsAt: fromNow(-200),
        endsAt: fromNow(-199),
        location: 'Salón',
        description: 'Insertada para la prueba',
        publishedAt: fromNow(-300),
        createdById: admin.id,
        topics: {
          create: topics.map((t, position) => ({
            title: `Propuesta ${position + 1}`,
            description: 'Descripción',
            opensAt: t.opensAt,
            closesAt: t.closesAt,
            position,
            options: {
              create: [
                { text: 'A favor', position: 0 },
                { text: 'En contra', position: 1 },
              ],
            },
          })),
        },
      },
      include: { topics: { orderBy: { position: 'asc' } } },
    });
    return { id: assembly.id, topicIds: assembly.topics.map((t) => t.id) };
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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /asambleas (convocatoria en borrador)', () => {
    it('guarda asamblea, agenda, propuestas y opciones en borrador con folio', async () => {
      const response = await http()
        .post(`${API}/asambleas`)
        .set(bearer('admin'))
        .send(payload())
        .expect(201);

      expect(response.body).toMatchObject({
        title: 'Mejora del jardín central',
        status: 'BORRADOR',
        publishedAt: null,
        agenda: [
          { title: 'Estado actual del jardín', position: 0 },
          { title: 'Presentación de la propuesta', position: 1 },
        ],
        topics: [
          {
            status: 'BORRADOR',
            options: [
              { text: 'A favor' },
              { text: 'En contra' },
              { text: 'Abstención' },
            ],
          },
        ],
      });
      expect(response.body.folio).toMatch(/^ASM-\d{4}-\d{3,}$/);
    });

    it('no guarda una convocatoria con fecha pasada e indica el motivo', async () => {
      const response = await http()
        .post(`${API}/asambleas`)
        .set(bearer('admin'))
        .send(
          payload({
            startsAt: fromNow(-24).toISOString(),
            endsAt: fromNow(-23).toISOString(),
          }),
        )
        .expect(400);

      expect(response.body.message).toContain(
        'La fecha y hora de la reunión deben ser posteriores a la actual.',
      );
      expect(await prisma.assembly.count()).toBe(0);
    });

    it('no guarda una propuesta con menos de dos opciones', async () => {
      const response = await http()
        .post(`${API}/asambleas`)
        .set(bearer('admin'))
        .send(payload({ topics: [topic({ options: ['A favor'] })] }))
        .expect(400);

      expect(JSON.stringify(response.body.message)).toContain(
        'Cada propuesta necesita al menos 2 opciones.',
      );
      expect(await prisma.assembly.count()).toBe(0);
    });

    it('no guarda un cierre anterior o igual a la apertura', async () => {
      const opensAt = fromNow(50).toISOString();
      const response = await http()
        .post(`${API}/asambleas`)
        .set(bearer('admin'))
        .send(payload({ topics: [topic({ opensAt, closesAt: opensAt })] }))
        .expect(400);

      expect(response.body.message).toContain(
        'El cierre de la votación debe ser posterior a la apertura.',
      );
    });

    it('no guarda una convocatoria sin propuestas a votar', async () => {
      const response = await http()
        .post(`${API}/asambleas`)
        .set(bearer('admin'))
        .send(payload({ topics: [] }))
        .expect(400);

      expect(response.body.message).toContain(
        'La convocatoria necesita al menos una propuesta a votar.',
      );
    });

    it.each<TestUser>(['residente', 'seguridad'])(
      'no permite convocar a %s (403)',
      async (user) => {
        await http()
          .post(`${API}/asambleas`)
          .set(bearer(user))
          .send(payload())
          .expect(403);
        expect(await prisma.assembly.count()).toBe(0);
      },
    );
  });

  describe('Publicación y aviso a los residentes', () => {
    it('el borrador no es visible para los residentes', async () => {
      const { id } = await createDraft();

      const list = await http()
        .get(`${API}/asambleas`)
        .set(bearer('residente'))
        .expect(200);
      await http()
        .get(`${API}/asambleas/${id}`)
        .set(bearer('residente'))
        .expect(404);

      expect(list.body.total).toBe(0);
    });

    it('al publicar queda visible para los residentes y avisa a todas las unidades', async () => {
      const { id } = await createDraft();

      const published = await http()
        .post(`${API}/asambleas/${id}/publicacion`)
        .set(bearer('admin'))
        .expect(200);

      expect(published.body.publishedAt).toBeTruthy();
      expect(published.body.status).toBe('PROGRAMADA');

      const detail = await http()
        .get(`${API}/asambleas/${id}`)
        .set(bearer('vecino'))
        .expect(200);
      expect(detail.body.topics[0].status).toBe('PROGRAMADA');

      const notifications = await prisma.notificacion.findMany({
        where: { moduloOrigen: 'votaciones' },
        include: { residente: true },
      });
      expect(notifications.map((n) => n.residente.email).sort()).toEqual(
        [
          USERS.residente.email,
          USERS.residenteMismaUnidad.email,
          USERS.vecino.email,
        ].sort(),
      );
      expect(
        notifications.every((n) => n.enlaceAccion === `/asambleas/${id}`),
      ).toBe(true);
    });

    it('no se puede publicar dos veces ni volver a avisar', async () => {
      const { id } = await createDraft();
      await http()
        .post(`${API}/asambleas/${id}/publicacion`)
        .set(bearer('admin'))
        .expect(200);

      await http()
        .post(`${API}/asambleas/${id}/publicacion`)
        .set(bearer('admin'))
        .expect(409);

      expect(
        await prisma.notificacion.count({
          where: { moduloOrigen: 'votaciones' },
        }),
      ).toBe(3);
    });

    it('el borrador se edita completo, pero no después de publicarse', async () => {
      const { id } = await createDraft();

      const edited = await http()
        .put(`${API}/asambleas/${id}`)
        .set(bearer('admin'))
        .send(
          payload({
            title: 'Jardín central (revisada)',
            topics: [topic(), topic({ title: 'Segunda propuesta' })],
          }),
        )
        .expect(200);
      expect(edited.body.title).toBe('Jardín central (revisada)');
      expect(edited.body.topics).toHaveLength(2);

      await http()
        .post(`${API}/asambleas/${id}/publicacion`)
        .set(bearer('admin'))
        .expect(200);
      await http()
        .put(`${API}/asambleas/${id}`)
        .set(bearer('admin'))
        .send(payload())
        .expect(409);
    });

    it('informa a cuántos residentes llegará la convocatoria', async () => {
      const response = await http()
        .get(`${API}/asambleas/audiencia`)
        .set(bearer('admin'))
        .expect(200);

      expect(response.body).toEqual({ residents: 3 });
    });
  });

  describe('Estado según la hora del servidor', () => {
    it('cada propuesta aparece Programada, Abierta o Cerrada sin intervención', async () => {
      const { id } = await insertPublished([
        { opensAt: fromNow(2), closesAt: fromNow(10) },
        { opensAt: fromNow(-1), closesAt: fromNow(5) },
        { opensAt: fromNow(-10), closesAt: fromNow(-2) },
      ]);

      const response = await http()
        .get(`${API}/asambleas/${id}`)
        .set(bearer('residente'))
        .expect(200);

      expect(
        response.body.topics.map((t: { status: string }) => t.status),
      ).toEqual(['PROGRAMADA', 'ABIERTA', 'CERRADA']);
      expect(response.body.status).toBe('ABIERTA');
    });

    it('el listado cuenta y filtra por estado', async () => {
      await createDraft();
      await insertPublished(
        [{ opensAt: fromNow(2), closesAt: fromNow(10) }],
        'ASM-2026-901',
      );
      await insertPublished(
        [{ opensAt: fromNow(-10), closesAt: fromNow(-2) }],
        'ASM-2026-902',
      );

      const all = await http()
        .get(`${API}/asambleas`)
        .set(bearer('admin'))
        .expect(200);
      const closed = await http()
        .get(`${API}/asambleas?estado=CERRADA`)
        .set(bearer('admin'))
        .expect(200);

      expect(all.body.counts).toEqual({
        TODAS: 3,
        BORRADOR: 1,
        PROGRAMADA: 1,
        ABIERTA: 0,
        CERRADA: 1,
      });
      expect(closed.body.items.map((a: { folio: string }) => a.folio)).toEqual([
        'ASM-2026-902',
      ]);
    });
  });

  describe('PUT /temas/:temaId (edición de una propuesta)', () => {
    it('modifica texto y opciones mientras la votación no abre', async () => {
      const { topicIds } = await insertPublished([
        { opensAt: fromNow(5), closesAt: fromNow(20) },
      ]);

      const response = await http()
        .put(`${API}/temas/${topicIds[0]}`)
        .set(bearer('admin'))
        .send(
          topic({
            title: 'Propuesta corregida',
            opensAt: fromNow(6).toISOString(),
            closesAt: fromNow(30).toISOString(),
            options: ['Sí', 'No'],
          }),
        )
        .expect(200);

      expect(response.body.topics[0]).toMatchObject({
        title: 'Propuesta corregida',
        options: [{ text: 'Sí' }, { text: 'No' }],
      });
    });

    it('no permite modificar una propuesta cuya votación ya abrió', async () => {
      const { topicIds } = await insertPublished([
        { opensAt: fromNow(-1), closesAt: fromNow(20) },
      ]);

      const response = await http()
        .put(`${API}/temas/${topicIds[0]}`)
        .set(bearer('admin'))
        .send(topic({ title: 'Intento de cambio', options: ['Sí', 'No'] }))
        .expect(409);

      expect(response.body.message).toBe(
        'La votación de esta propuesta ya abrió; no se puede modificar su texto ni sus opciones.',
      );
      const stored = await prisma.votingTopic.findUniqueOrThrow({
        where: { id: topicIds[0] },
        include: { options: true },
      });
      expect(stored.title).toBe('Propuesta 1');
      expect(stored.options).toHaveLength(2);
    });

    it('solo Administración puede modificar una propuesta', async () => {
      const { topicIds } = await insertPublished([
        { opensAt: fromNow(5), closesAt: fromNow(20) },
      ]);

      await http()
        .put(`${API}/temas/${topicIds[0]}`)
        .set(bearer('residente'))
        .send(topic())
        .expect(403);
    });
  });
});
