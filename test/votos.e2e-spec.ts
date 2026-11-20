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

describe('Votos (e2e) - H17', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: Record<TestUser, string>;

  const http = () => request(app.getHttpServer());
  const bearer = (user: TestUser) => ({
    Authorization: `Bearer ${tokens[user]}`,
  });

  async function assemblyWithTopic(
    opensAt: Date,
    closesAt: Date,
    publishedAt: Date | null = fromNow(-48),
  ): Promise<{ assemblyId: string; topicId: string; optionIds: string[] }> {
    const admin = await prisma.user.findUniqueOrThrow({
      where: { email: USERS.admin.email },
    });
    const assembly = await prisma.assembly.create({
      data: {
        folio: `ASM-T-${Math.random().toString(36).slice(2, 8)}`,
        title: 'Iluminación de áreas comunes',
        type: 'EXTRAORDINARIA',
        modality: 'PRESENCIAL',
        startsAt: fromNow(-3),
        endsAt: fromNow(-2),
        location: 'Salón de usos múltiples',
        description: 'Sustituir luminarias por LED.',
        publishedAt,
        createdById: admin.id,
        topics: {
          create: {
            title: 'Luminarias LED',
            description: 'Sustituir luminarias de pasillos.',
            opensAt,
            closesAt,
            position: 0,
            options: {
              create: [
                { text: 'A favor', position: 0 },
                { text: 'En contra', position: 1 },
                { text: 'Abstención', position: 2 },
              ],
            },
          },
        },
      },
      include: {
        topics: { include: { options: { orderBy: { position: 'asc' } } } },
      },
    });
    return {
      assemblyId: assembly.id,
      topicId: assembly.topics[0].id,
      optionIds: assembly.topics[0].options.map((o) => o.id),
    };
  }

  const vote = (user: TestUser, topicId: string, opcionId: string) =>
    http()
      .post(`${API}/temas/${topicId}/votos`)
      .set(bearer(user))
      .send({ opcionId });

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

  it('registra el voto y todos los residentes de la unidad ven "ya votó"', async () => {
    const { assemblyId, topicId, optionIds } = await assemblyWithTopic(
      fromNow(-1),
      fromNow(5),
    );

    const response = await vote('residente', topicId, optionIds[0]).expect(201);
    expect(response.body).toMatchObject({
      topicId,
      message: 'Tu voto quedó registrado. Tu unidad ya votó en este tema.',
    });
    expect(response.body).not.toHaveProperty('opcionId');

    const sameUnit = await http()
      .get(`${API}/asambleas/${assemblyId}`)
      .set(bearer('residenteMismaUnidad'))
      .expect(200);
    const neighbor = await http()
      .get(`${API}/asambleas/${assemblyId}`)
      .set(bearer('vecino'))
      .expect(200);

    expect(sameUnit.body.topics[0].unitVote.votedAt).toBeTruthy();
    expect(sameUnit.body.topics[0].unitVote).not.toHaveProperty('optionId');
    expect(neighbor.body.topics[0].unitVote).toBeNull();
    expect(neighbor.body.pendingVotesForUnit).toBe(1);
  });

  it('otro residente de la misma unidad no puede votar de nuevo (409)', async () => {
    const { topicId, optionIds } = await assemblyWithTopic(
      fromNow(-1),
      fromNow(5),
    );
    await vote('residente', topicId, optionIds[0]).expect(201);

    const response = await vote(
      'residenteMismaUnidad',
      topicId,
      optionIds[1],
    ).expect(409);

    expect(response.body.message).toBe('Tu unidad ya votó en este tema.');
    expect(await prisma.vote.count({ where: { topicId } })).toBe(1);
  });

  it('con dos solicitudes simultáneas de la misma unidad solo cuenta una', async () => {
    const { topicId, optionIds } = await assemblyWithTopic(
      fromNow(-1),
      fromNow(5),
    );

    const responses = await Promise.all([
      vote('residente', topicId, optionIds[0]),
      vote('residenteMismaUnidad', topicId, optionIds[1]),
    ]);

    expect(responses.map((r) => r.status).sort((a, b) => a - b)).toEqual([
      201, 409,
    ]);
    expect(await prisma.vote.count({ where: { topicId } })).toBe(1);
    expect(
      await prisma.participacionVotacion.count({ where: { temaId: topicId } }),
    ).toBe(1);
  });

  it.each([
    ['programado', -0, 2, 5],
    ['cerrado', 0, -5, -1],
  ])(
    'no acepta votos en un tema %s (422)',
    async (_label, _x, opens, closes) => {
      const { topicId, optionIds } = await assemblyWithTopic(
        fromNow(opens),
        fromNow(closes),
      );

      const response = await vote('residente', topicId, optionIds[0]).expect(
        422,
      );

      expect(response.body.message).toMatch(/^La votación no está abierta/);
      expect(await prisma.vote.count()).toBe(0);
    },
  );

  it('rechaza una opción de otro tema (400)', async () => {
    const first = await assemblyWithTopic(fromNow(-1), fromNow(5));
    const second = await assemblyWithTopic(fromNow(-1), fromNow(5));

    await vote('residente', first.topicId, second.optionIds[0]).expect(400);
  });

  it.each<TestUser>(['admin', 'seguridad'])(
    'un usuario sin unidad (%s) no puede votar (403)',
    async (user) => {
      const { topicId, optionIds } = await assemblyWithTopic(
        fromNow(-1),
        fromNow(5),
      );

      await vote(user, topicId, optionIds[0]).expect(403);
    },
  );

  it('no existen rutas para cambiar ni eliminar un voto', async () => {
    const { topicId, optionIds } = await assemblyWithTopic(
      fromNow(-1),
      fromNow(5),
    );
    await vote('residente', topicId, optionIds[0]).expect(201);

    await http()
      .put(`${API}/temas/${topicId}/votos`)
      .set(bearer('residente'))
      .send({ opcionId: optionIds[1] })
      .expect(404);
    await http()
      .delete(`${API}/temas/${topicId}/votos`)
      .set(bearer('admin'))
      .expect(404);

    expect(await prisma.vote.count({ where: { topicId } })).toBe(1);
  });

  it('el voto se guarda sin la unidad: la tabla votos no la conoce', async () => {
    const { topicId, optionIds } = await assemblyWithTopic(
      fromNow(-1),
      fromNow(5),
    );
    await vote('residente', topicId, optionIds[0]).expect(201);
    await vote('vecino', topicId, optionIds[1]).expect(201);

    const columns = await prisma.$queryRaw<{ column_name: string }[]>`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'votos'
    `;
    expect(columns.map((c) => c.column_name).sort()).toEqual([
      'id',
      'option_id',
      'topic_id',
    ]);
    expect(await prisma.vote.count({ where: { topicId } })).toBe(
      await prisma.participacionVotacion.count({ where: { temaId: topicId } }),
    );
  });

  it('la participación se registra en participacion_votacion, la misma tabla del reporte de participación', async () => {
    const { topicId, optionIds } = await assemblyWithTopic(
      fromNow(-1),
      fromNow(5),
    );
    await vote('residente', topicId, optionIds[0]).expect(201);

    const rows = await prisma.$queryRaw<{ unidad_id: string }[]>`
      SELECT unidad_id FROM participacion_votacion WHERE tema_id = ${topicId}::uuid
    `;
    const resident = await prisma.user.findUniqueOrThrow({
      where: { email: USERS.residente.email },
    });
    expect(rows.map((r) => r.unidad_id)).toEqual([resident.unitId]);
  });

  it('no se puede votar en un borrador (404)', async () => {
    const { topicId, optionIds } = await assemblyWithTopic(
      fromNow(-1),
      fromNow(5),
      null,
    );

    await vote('residente', topicId, optionIds[0]).expect(404);
  });
});
