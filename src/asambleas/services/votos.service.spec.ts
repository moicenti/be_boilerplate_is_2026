import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { VotosService } from './votos.service.js';
import type { TopicForVote, VoteRepository } from '@Asambleas/repositories';
import { Role, type User } from '@PrismaClient';
import { UnitAlreadyVotedError, VotingNotOpenError } from '../errors/index.js';

const NOW = new Date('2026-11-19T12:00:00Z');
const hours = (h: number) => new Date(NOW.getTime() + h * 3_600_000);

const resident = { id: 'res', role: Role.RESIDENTE, unitId: 'unit-a' } as User;

function topic(overrides: Partial<TopicForVote> = {}): TopicForVote {
  return {
    id: 'topic',
    opensAt: hours(-1),
    closesAt: hours(5),
    assembly: { publishedAt: hours(-48) },
    options: [{ id: 'opt-a' }, { id: 'opt-b' }],
    ...overrides,
  } as TopicForVote;
}

function setup(found: TopicForVote | null = topic()) {
  const repository = {
    findTopicForVote: vi.fn().mockResolvedValue(found),
    castVote: vi.fn().mockResolvedValue(NOW),
    unitVotes: vi.fn().mockResolvedValue(new Map([['topic', NOW]])),
  };
  const service = new VotosService(repository as unknown as VoteRepository);
  vi.spyOn(service, 'now').mockReturnValue(NOW);
  return { service, repository };
}

describe('VotosService.vote', () => {
  it('registra participación y voto de la unidad del residente', async () => {
    const { service, repository } = setup();

    const receipt = await service.vote('topic', 'opt-b', resident);

    expect(repository.castVote).toHaveBeenCalledWith({
      topicId: 'topic',
      optionId: 'opt-b',
      unitId: 'unit-a',
      residentId: 'res',
      now: NOW,
    });
    expect(receipt).toEqual({ topicId: 'topic', votedAt: NOW });
  });

  it.each([
    ['administración', { id: 'adm', role: Role.ADMINISTRADOR, unitId: null }],
    [
      'un residente sin unidad',
      { id: 'r2', role: Role.RESIDENTE, unitId: null },
    ],
  ])('no deja votar a %s (403)', async (_label, user) => {
    const { service, repository } = setup();

    await expect(service.vote('topic', 'opt-a', user as User)).rejects.toThrow(
      ForbiddenException,
    );
    expect(repository.castVote).not.toHaveBeenCalled();
  });

  it('responde 422 si la votación todavía no abre o ya cerró', async () => {
    const programmed = setup(topic({ opensAt: hours(1), closesAt: hours(5) }));
    const closed = setup(topic({ opensAt: hours(-5), closesAt: hours(-1) }));

    await expect(
      programmed.service.vote('topic', 'opt-a', resident),
    ).rejects.toThrow(UnprocessableEntityException);
    await expect(
      closed.service.vote('topic', 'opt-a', resident),
    ).rejects.toThrow(/La votación no está abierta: cerró el/);
  });

  it('responde 400 si la opción no pertenece al tema', async () => {
    const { service } = setup();

    await expect(service.vote('topic', 'otra', resident)).rejects.toThrow(
      new BadRequestException('La opción no pertenece a esta propuesta.'),
    );
  });

  it('responde 404 si el tema no existe o su asamblea es un borrador', async () => {
    const missing = setup(null);
    const draft = setup(
      topic({ assembly: { publishedAt: null } } as Partial<TopicForVote>),
    );

    await expect(missing.service.vote('x', 'opt-a', resident)).rejects.toThrow(
      NotFoundException,
    );
    await expect(
      draft.service.vote('topic', 'opt-a', resident),
    ).rejects.toThrow(NotFoundException);
  });

  it('responde 409 si la unidad ya votó', async () => {
    const { service, repository } = setup();
    repository.castVote.mockRejectedValueOnce(new UnitAlreadyVotedError());

    await expect(service.vote('topic', 'opt-a', resident)).rejects.toThrow(
      new ConflictException('Tu unidad ya votó en este tema.'),
    );
  });

  it('responde 422 si la votación cierra durante la transacción', async () => {
    const { service, repository } = setup();
    repository.castVote.mockRejectedValueOnce(new VotingNotOpenError());

    await expect(service.vote('topic', 'opt-a', resident)).rejects.toThrow(
      UnprocessableEntityException,
    );
  });
});

describe('VotosService.unitVotesFor', () => {
  it('consulta solo para residentes con unidad', async () => {
    const { service, repository } = setup();

    expect(await service.unitVotesFor(resident, ['topic'])).toEqual(
      new Map([['topic', NOW]]),
    );
    expect(
      await service.unitVotesFor(
        { role: Role.ADMINISTRADOR, unitId: null } as User,
        ['topic'],
      ),
    ).toBeNull();
    expect(repository.unitVotes).toHaveBeenCalledTimes(1);
  });
});
