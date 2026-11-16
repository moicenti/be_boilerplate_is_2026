import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AsambleasService } from './asambleas.service.js';
import type {
  AssemblyRepository,
  AssemblyWithRelations,
} from '@Asambleas/repositories';
import type { CreateAssemblyDto, VotingTopicDto } from '@Asambleas/dto';
import type { NotificacionesService } from '@Notificaciones';
import { AssemblyModality, AssemblyType, Role, type User } from '@PrismaClient';

const NOW = new Date('2026-11-16T12:00:00Z');
const later = (hours: number) => new Date(NOW.getTime() + hours * 3_600_000);

const admin = { id: 'admin-id', role: Role.ADMINISTRADOR } as User;
const resident = { id: 'res-id', role: Role.RESIDENTE } as User;

function topicDto(overrides: Partial<VotingTopicDto> = {}): VotingTopicDto {
  return {
    title: 'Renovar el riego',
    description: 'Sustituir aspersores',
    opensAt: later(50),
    closesAt: later(120),
    options: ['A favor', 'En contra', 'Abstención'],
    ...overrides,
  };
}

function assemblyDto(
  overrides: Partial<CreateAssemblyDto> = {},
): CreateAssemblyDto {
  return {
    title: 'Mejora del jardín central',
    type: AssemblyType.EXTRAORDINARIA,
    modality: AssemblyModality.PRESENCIAL,
    startsAt: later(48),
    endsAt: later(49.5),
    location: 'Salón de eventos',
    description: 'Convocatoria',
    agenda: [{ title: 'Estado actual del jardín' }],
    topics: [topicDto()],
    ...overrides,
  };
}

function entity(
  overrides: Partial<AssemblyWithRelations> = {},
): AssemblyWithRelations {
  return {
    id: 'asm-id',
    number: 11,
    folio: 'ASM-2026-011',
    title: 'Mejora del jardín central',
    type: AssemblyType.EXTRAORDINARIA,
    modality: AssemblyModality.PRESENCIAL,
    startsAt: later(48),
    endsAt: later(49.5),
    location: 'Salón de eventos',
    description: 'Convocatoria',
    publishedAt: null,
    createdById: admin.id,
    createdAt: NOW,
    updatedAt: NOW,
    createdBy: { id: admin.id, email: 'admin@example.com' },
    agendaItems: [],
    topics: [
      {
        id: 'topic-id',
        assemblyId: 'asm-id',
        title: 'Renovar el riego',
        description: 'Sustituir aspersores',
        opensAt: later(50),
        closesAt: later(120),
        position: 0,
        options: [
          { id: 'o1', topicId: 'topic-id', text: 'A favor', position: 0 },
          { id: 'o2', topicId: 'topic-id', text: 'En contra', position: 1 },
        ],
      },
    ],
    ...overrides,
  } as AssemblyWithRelations;
}

function setup() {
  const repository = {
    nextNumber: vi.fn().mockResolvedValue(11),
    create: vi
      .fn()
      .mockImplementation((data, meta) =>
        Promise.resolve({ ...data, ...meta }),
      ),
    findById: vi.fn().mockResolvedValue(entity()),
    replaceDraft: vi.fn().mockResolvedValue(entity()),
    publishIfDraft: vi.fn().mockResolvedValue(true),
    findAll: vi.fn().mockResolvedValue([]),
    findTopicById: vi.fn(),
    updateTopicIfNotOpened: vi.fn().mockResolvedValue(true),
    countActiveResidents: vi.fn().mockResolvedValue(47),
    towers: vi.fn().mockResolvedValue(['Torre A', 'Torre B']),
  };
  const notificaciones = {
    emitir: vi.fn().mockResolvedValue({ loteId: 1, creadas: 2, omitidas: 0 }),
  };
  const service = new AsambleasService(
    repository as unknown as AssemblyRepository,
    notificaciones as unknown as NotificacionesService,
  );
  vi.spyOn(service, 'now').mockReturnValue(NOW);
  return { service, repository, notificaciones };
}

async function badRequestMessages(
  promise: Promise<unknown>,
): Promise<string[]> {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(BadRequestException);
  return ((error as BadRequestException).getResponse() as { message: string[] })
    .message;
}

describe('AsambleasService.create', () => {
  it('guarda el borrador con folio ASM-AAAA-NNN y el administrador que lo creó', async () => {
    const { service, repository } = setup();

    await service.create(assemblyDto(), admin);

    const [, meta] = repository.create.mock.calls[0];
    expect(meta).toEqual({
      number: 11,
      folio: 'ASM-2026-011',
      createdById: admin.id,
    });
  });

  it('rechaza una reunión con fecha anterior a la actual', async () => {
    const { service, repository } = setup();

    const messages = await badRequestMessages(
      service.create(
        assemblyDto({ startsAt: later(-1), endsAt: later(1) }),
        admin,
      ),
    );

    expect(messages).toContain(
      'La fecha y hora de la reunión deben ser posteriores a la actual.',
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rechaza un cierre igual o anterior a la apertura y una apertura en el pasado', async () => {
    const { service } = setup();

    const messages = await badRequestMessages(
      service.create(
        assemblyDto({
          topics: [topicDto({ opensAt: later(-2), closesAt: later(-2) })],
        }),
        admin,
      ),
    );

    expect(messages).toEqual(
      expect.arrayContaining([
        'La apertura de la votación no puede ser anterior a la fecha y hora actuales.',
        'El cierre de la votación debe ser posterior a la apertura.',
      ]),
    );
  });

  it('rechaza opciones repetidas sin importar mayúsculas e indica la propuesta', async () => {
    const { service } = setup();

    const messages = await badRequestMessages(
      service.create(
        assemblyDto({
          topics: [topicDto(), topicDto({ options: ['Sí', 'sí'] })],
        }),
        admin,
      ),
    );

    expect(messages).toEqual([
      'Propuesta 2: Las opciones no pueden repetirse.',
    ]);
  });

  it('acepta una apertura dentro del minuto actual y rechaza la del minuto anterior', () => {
    const { service } = setup();
    const secondsLater = new Date(NOW.getTime() + 40_000);

    expect(
      service.topicErrors(topicDto({ opensAt: NOW }), secondsLater, ''),
    ).toEqual([]);
    expect(
      service.topicErrors(
        topicDto({ opensAt: new Date(NOW.getTime() - 30_000) }),
        secondsLater,
        '',
      ),
    ).toEqual([
      'La apertura de la votación no puede ser anterior a la fecha y hora actuales.',
    ]);
  });
});

describe('AsambleasService.publish', () => {
  it('publica, avisa a cada torre por el módulo de votaciones y devuelve la asamblea', async () => {
    const { service, repository, notificaciones } = setup();

    await service.publish('asm-id', admin);

    expect(repository.publishIfDraft).toHaveBeenCalledWith('asm-id', NOW);
    expect(notificaciones.emitir).toHaveBeenCalledTimes(2);
    const [dto, emisor] = notificaciones.emitir.mock.calls[0];
    expect(dto).toMatchObject({
      destinatario: { tipo: 'GRUPO', id: 'Torre A' },
      moduloOrigen: 'votaciones',
      enlaceAccion: '/asambleas/asm-id',
      titulo: 'Convocatoria: Mejora del jardín central',
    });
    expect(emisor).toEqual({ id: admin.id, rol: Role.ADMINISTRADOR });
  });

  it('mantiene la publicación aunque falle el aviso de una torre', async () => {
    const { service, notificaciones } = setup();
    notificaciones.emitir.mockRejectedValueOnce(new Error('sin conexión'));

    await expect(service.publish('asm-id', admin)).resolves.toBeDefined();
    expect(notificaciones.emitir).toHaveBeenCalledTimes(2);
  });

  it('responde 409 si ya estaba publicada y no vuelve a avisar', async () => {
    const { service, repository, notificaciones } = setup();
    repository.findById.mockResolvedValueOnce(entity({ publishedAt: NOW }));

    await expect(service.publish('asm-id', admin)).rejects.toThrow(
      ConflictException,
    );
    expect(notificaciones.emitir).not.toHaveBeenCalled();
  });

  it('no publica un borrador cuya reunión ya pasó', async () => {
    const { service, repository } = setup();
    repository.findById.mockResolvedValueOnce(
      entity({ startsAt: later(-3), endsAt: later(-2) }),
    );

    await expect(service.publish('asm-id', admin)).rejects.toThrow(
      BadRequestException,
    );
    expect(repository.publishIfDraft).not.toHaveBeenCalled();
  });
});

describe('AsambleasService.updateDraft', () => {
  it('responde 409 si la convocatoria ya fue publicada', async () => {
    const { service, repository } = setup();
    repository.findById.mockResolvedValueOnce(entity({ publishedAt: NOW }));

    await expect(service.updateDraft('asm-id', assemblyDto())).rejects.toThrow(
      ConflictException,
    );
    expect(repository.replaceDraft).not.toHaveBeenCalled();
  });
});

describe('AsambleasService.updateTopic', () => {
  it('responde 409 si la votación ya abrió', async () => {
    const { service, repository } = setup();
    repository.findTopicById.mockResolvedValueOnce({
      id: 'topic-id',
      assemblyId: 'asm-id',
      opensAt: later(-1),
    });

    await expect(service.updateTopic('topic-id', topicDto())).rejects.toThrow(
      ConflictException,
    );
    expect(repository.updateTopicIfNotOpened).not.toHaveBeenCalled();
  });

  it('responde 409 si abre entre la consulta y la actualización', async () => {
    const { service, repository } = setup();
    repository.findTopicById.mockResolvedValueOnce({
      id: 'topic-id',
      assemblyId: 'asm-id',
      opensAt: later(1),
    });
    repository.updateTopicIfNotOpened.mockResolvedValueOnce(false);

    await expect(service.updateTopic('topic-id', topicDto())).rejects.toThrow(
      ConflictException,
    );
  });

  it('responde 404 si la propuesta no existe', async () => {
    const { service, repository } = setup();
    repository.findTopicById.mockResolvedValueOnce(null);

    await expect(service.updateTopic('x', topicDto())).rejects.toThrow(
      NotFoundException,
    );
  });
});

describe('AsambleasService consultas', () => {
  it('oculta los borradores a quien no es administración (404)', async () => {
    const { service } = setup();

    await expect(service.findOne('asm-id', resident)).rejects.toThrow(
      NotFoundException,
    );
    await expect(service.findOne('asm-id', admin)).resolves.toBeDefined();
  });

  it('cuenta por estado, filtra y solo pide publicadas para residentes', async () => {
    const { service, repository } = setup();
    repository.findAll.mockResolvedValue([
      entity(),
      entity({ id: 'b', publishedAt: NOW }),
      entity({
        id: 'c',
        publishedAt: later(-200),
        topics: [
          { ...entity().topics[0], opensAt: later(-100), closesAt: later(-50) },
        ],
      }),
    ]);

    const page = await service.list({ estado: 'CERRADA', page: 1 }, admin);
    await service.list({ page: 1 }, resident);

    expect(page.counts).toEqual({
      TODAS: 3,
      BORRADOR: 1,
      PROGRAMADA: 1,
      ABIERTA: 0,
      CERRADA: 1,
    });
    expect(page.items.map((a) => a.id)).toEqual(['c']);
    expect(repository.findAll.mock.calls[0][0].onlyPublished).toBe(false);
    expect(repository.findAll.mock.calls[1][0].onlyPublished).toBe(true);
  });
});
