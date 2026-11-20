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

describe('Resultados y auditoría (e2e) - H18', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokens: Record<TestUser, string>;

  const http = () => request(app.getHttpServer());
  const bearer = (user: TestUser) => ({
    Authorization: `Bearer ${tokens[user]}`,
  });

  async function topicWithVotes(
    opensAt: Date,
    closesAt: Date,
    ballots: { unitCode: string; resident: TestUser; option: number }[],
  ): Promise<{ topicId: string; optionIds: string[] }> {
    const admin = await prisma.user.findUniqueOrThrow({
      where: { email: USERS.admin.email },
    });
    const assembly = await prisma.assembly.create({
      data: {
        folio: 'ASM-2026-010',
        title: 'Renovación de luminarias',
        type: 'EXTRAORDINARIA',
        modality: 'PRESENCIAL',
        startsAt: fromNow(-100),
        endsAt: fromNow(-99),
        location: 'Salón de eventos',
        description: 'Convocatoria',
        publishedAt: fromNow(-200),
        createdById: admin.id,
        topics: {
          create: {
            title: 'Cambiar luminarias a LED',
            description: 'Sustituir 24 luminarias.',
            opensAt,
            closesAt,
            position: 0,
            options: {
              create: ['A favor', 'En contra', 'Abstención'].map(
                (text, position) => ({
                  text,
                  position,
                }),
              ),
            },
          },
        },
      },
      include: {
        topics: { include: { options: { orderBy: { position: 'asc' } } } },
      },
    });
    const topic = assembly.topics[0];
    for (const [index, ballot] of ballots.entries()) {
      const unit = await prisma.unit.findUniqueOrThrow({
        where: { code: ballot.unitCode },
      });
      const resident = await prisma.user.findUniqueOrThrow({
        where: { email: USERS[ballot.resident].email },
      });
      await prisma.participacionVotacion.create({
        data: {
          temaId: topic.id,
          unidadId: unit.id,
          residenteId: resident.id,
          fecha: new Date(opensAt.getTime() + (index + 1) * 60_000),
        },
      });
      await prisma.vote.create({
        data: { topicId: topic.id, optionId: topic.options[ballot.option].id },
      });
    }
    return { topicId: topic.id, optionIds: topic.options.map((o) => o.id) };
  }

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    await prisma.unit.updateMany({ data: { createdAt: fromNow(-24 * 30) } });
    const users = Object.keys(USERS) as TestUser[];
    tokens = Object.fromEntries(
      await Promise.all(users.map(async (u) => [u, await loginAs(app, u)])),
    ) as Record<TestUser, string>;
  });

  afterAll(async () => {
    await app.close();
  });

  it('con el tema cerrado muestra votos, porcentajes, habilitadas, participación y ganador', async () => {
    const { topicId } = await topicWithVotes(fromNow(-10), fromNow(-1), [
      { unitCode: 'A-304', resident: 'residente', option: 0 },
      { unitCode: 'B-103', resident: 'vecino', option: 1 },
    ]);
    await prisma.unit.create({
      data: {
        code: 'C-999',
        tower: 'Torre C',
        description: 'Registrada después',
      },
    });

    const response = await http()
      .get(`${API}/temas/${topicId}/resultados`)
      .set(bearer('admin'))
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'CERRADA',
      unitsVoted: 2,
      eligibleUnits: 2,
      results: {
        totalVotes: 2,
        participation: 100,
        outcome: 'EMPATE',
        consistent: true,
      },
    });
    expect(
      response.body.results.options.map(
        (o: { votes: number; percentage: number }) => [o.votes, o.percentage],
      ),
    ).toEqual([
      [1, 50],
      [1, 50],
      [0, 0],
    ]);
  });

  it('indica la opción ganadora y que la suma de votos coincide con las unidades que votaron', async () => {
    const { topicId } = await topicWithVotes(fromNow(-10), fromNow(-1), [
      { unitCode: 'A-304', resident: 'residente', option: 0 },
    ]);

    const response = await http()
      .get(`${API}/temas/${topicId}/resultados`)
      .set(bearer('admin'))
      .expect(200);

    expect(response.body.results).toMatchObject({
      outcome: 'GANADOR',
      winner: { text: 'A favor' },
      totalVotes: 1,
      unitsVoted: 1,
      participation: 50,
      consistent: true,
    });
  });

  it('con la votación abierta solo muestra cuántas unidades han votado', async () => {
    const { topicId } = await topicWithVotes(fromNow(-1), fromNow(5), [
      { unitCode: 'A-304', resident: 'residente', option: 0 },
    ]);

    const response = await http()
      .get(`${API}/temas/${topicId}/resultados`)
      .set(bearer('admin'))
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'ABIERTA',
      unitsVoted: 1,
      results: null,
    });
    expect(JSON.stringify(response.body)).not.toContain('A favor');
  });

  it('la auditoría lista unidades y hora del voto sin la opción elegida', async () => {
    const { topicId, optionIds } = await topicWithVotes(
      fromNow(-10),
      fromNow(-1),
      [
        { unitCode: 'A-304', resident: 'residente', option: 0 },
        { unitCode: 'B-103', resident: 'vecino', option: 2 },
      ],
    );

    const response = await http()
      .get(`${API}/temas/${topicId}/auditoria`)
      .set(bearer('admin'))
      .expect(200);

    expect(
      response.body.participations.map((p: { unitCode: string }) => p.unitCode),
    ).toEqual(['A-304', 'B-103']);
    for (const participation of response.body.participations) {
      expect(Object.keys(participation).sort()).toEqual([
        'unitCode',
        'unitDescription',
        'votedAt',
      ]);
    }
    expect(JSON.stringify(response.body.participations)).not.toContain(
      optionIds[0],
    );
    expect(response.body.topic.opensAt).toBeTruthy();
    expect(response.body.topic.closesAt).toBeTruthy();
    expect(response.body.events.map((e: { event: string }) => e.event)).toEqual(
      [
        'Convocatoria publicada',
        'Votación abierta',
        'Votación cerrada',
        'Recuento consolidado',
      ],
    );
  });

  it('la auditoría responde 409 mientras la votación sigue abierta', async () => {
    const { topicId } = await topicWithVotes(fromNow(-1), fromNow(5), []);

    await http()
      .get(`${API}/temas/${topicId}/auditoria`)
      .set(bearer('admin'))
      .expect(409);
    await http()
      .get(`${API}/temas/${topicId}/auditoria/pdf`)
      .set(bearer('admin'))
      .expect(409);
  });

  it('exporta un PDF con resultados y participación', async () => {
    const { topicId } = await topicWithVotes(fromNow(-10), fromNow(-1), [
      { unitCode: 'A-304', resident: 'residente', option: 0 },
    ]);

    const response = await http()
      .get(`${API}/temas/${topicId}/auditoria/pdf`)
      .set(bearer('admin'))
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      })
      .expect(200);

    expect(response.headers['content-type']).toContain('application/pdf');
    expect(response.headers['content-disposition']).toContain(
      'auditoria-ASM-2026-010-propuesta-1.pdf',
    );
    expect((response.body as Buffer).subarray(0, 4).toString()).toBe('%PDF');
  });

  it.each<TestUser>(['residente', 'seguridad'])(
    'resultados y auditoría son solo para Administración (403 a %s)',
    async (user) => {
      const { topicId } = await topicWithVotes(fromNow(-10), fromNow(-1), []);

      await http()
        .get(`${API}/temas/${topicId}/resultados`)
        .set(bearer(user))
        .expect(403);
      await http()
        .get(`${API}/temas/${topicId}/auditoria`)
        .set(bearer(user))
        .expect(403);
    },
  );
});
