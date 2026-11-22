import { HttpStatus } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { CommonAreaBlock, User } from '@PrismaClient';
import { ApiException } from '@Common/errors';
import { CommonAreasService } from './common-areas.service.js';
import { CommonAreaBlocksService } from './common-area-blocks.service.js';
import { BLOCKING_RESERVATION_STATUSES } from '../constants.js';
import type {
  CommonAreaBlockRepository,
  CommonAreaRepository,
  CommonAreaWithSchedules,
} from '../repositories/index.js';
import {
  BlockOverlapError,
  CommonAreaNameTakenError,
} from '../errors/index.js';
import type { CreateBlockDto, SaveCommonAreaDto } from '../dto/index.js';
import { parseTime } from '../utils/time.js';

const admin = { id: 'admin-id' } as User;

function buildDto(
  overrides: Partial<SaveCommonAreaDto> = {},
): SaveCommonAreaDto {
  return {
    nombre: 'Salón social',
    capacidad: 40,
    ubicacion: 'Torre A, nivel 1',
    duracionBloque: 2,
    condicionesUso: null,
    horarios: [{ diaSemana: 6, horaApertura: '09:00', horaCierre: '22:00' }],
    ...overrides,
  };
}

function buildArea(): CommonAreaWithSchedules {
  return {
    id: 1,
    name: 'Salón social',
    capacity: 40,
    location: 'Torre A, nivel 1',
    blockDurationHours: 2,
    usageConditions: null,
    status: 'ACTIVA',
    createdAt: new Date(),
    deletedAt: null,
    deletedById: null,
    schedules: [
      {
        id: 1,
        areaId: 1,
        dayOfWeek: 6,
        opensAt: parseTime('09:00'),
        closesAt: parseTime('22:00'),
      },
    ],
  };
}

async function expectApiError(
  promise: Promise<unknown>,
  status: HttpStatus,
  codigo: string,
) {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(ApiException);
  expect((error as ApiException).getStatus()).toBe(status);
  expect((error as ApiException).getResponse()).toMatchObject({ codigo });
}

describe('H6. Especificación de áreas comunes', () => {
  describe('áreas', () => {
    let repository: {
      [K in keyof CommonAreaRepository]: ReturnType<typeof vi.fn>;
    };
    let service: CommonAreasService;

    beforeEach(() => {
      repository = {
        findAllActive: vi.fn(),
        findActiveById: vi.fn().mockResolvedValue(buildArea()),
        existsActiveByName: vi.fn().mockResolvedValue(false),
        create: vi.fn().mockResolvedValue(buildArea()),
        update: vi.fn().mockResolvedValue(buildArea()),
        countUpcomingReservations: vi.fn().mockResolvedValue(0),
        softDelete: vi.fn().mockResolvedValue(undefined),
      };
      service = new CommonAreasService(
        repository as unknown as CommonAreaRepository,
      );
    });

    describe('registro', () => {
      it('AC1: registra el área con su capacidad y sus horarios de uso permitido', async () => {
        await service.create(buildDto());

        expect(repository.create).toHaveBeenCalledWith({
          name: 'Salón social',
          capacity: 40,
          location: 'Torre A, nivel 1',
          blockDurationHours: 2,
          usageConditions: null,
          schedules: [
            {
              dayOfWeek: 6,
              opensAt: parseTime('09:00'),
              closesAt: parseTime('22:00'),
            },
          ],
        });
      });

      it.each([0, -5])(
        'AC5: rechaza una capacidad de %i con 422 DATOS_INVALIDOS',
        async (capacidad) => {
          await expectApiError(
            service.create(buildDto({ capacidad })),
            HttpStatus.UNPROCESSABLE_ENTITY,
            'DATOS_INVALIDOS',
          );
          expect(repository.create).not.toHaveBeenCalled();
        },
      );

      it.each([0, -1])(
        'AC5: rechaza una duración de bloque de %i con 422',
        async (duracionBloque) => {
          await expectApiError(
            service.create(buildDto({ duracionBloque })),
            HttpStatus.UNPROCESSABLE_ENTITY,
            'DATOS_INVALIDOS',
          );
        },
      );

      it('AC5: rechaza un bloque más largo que el horario de algún día con 422', async () => {
        const horarios = [
          { diaSemana: 1, horaApertura: '08:00', horaCierre: '20:00' },
          { diaSemana: 2, horaApertura: '08:00', horaCierre: '09:30' },
        ];
        await expectApiError(
          service.create(buildDto({ duracionBloque: 2, horarios })),
          HttpStatus.UNPROCESSABLE_ENTITY,
          'DATOS_INVALIDOS',
        );
      });

      it('AC1: acepta un bloque igual a la duración del horario', async () => {
        const horarios = [
          { diaSemana: 1, horaApertura: '08:00', horaCierre: '10:00' },
        ];
        await service.create(buildDto({ duracionBloque: 2, horarios }));
        expect(repository.create).toHaveBeenCalled();
      });

      it.each([
        ['igual', '10:00', '10:00'],
        ['anterior', '10:00', '09:30'],
      ])(
        'AC5: rechaza un cierre %s a la apertura con 422',
        async (_caso, horaApertura, horaCierre) => {
          await expectApiError(
            service.create(
              buildDto({
                horarios: [{ diaSemana: 1, horaApertura, horaCierre }],
              }),
            ),
            HttpStatus.UNPROCESSABLE_ENTITY,
            'DATOS_INVALIDOS',
          );
        },
      );

      it('AC5: rechaza dos horarios para el mismo día con 422', async () => {
        const horarios = [
          { diaSemana: 1, horaApertura: '08:00', horaCierre: '10:00' },
          { diaSemana: 1, horaApertura: '11:00', horaCierre: '12:00' },
        ];
        await expectApiError(
          service.create(buildDto({ horarios })),
          HttpStatus.UNPROCESSABLE_ENTITY,
          'DATOS_INVALIDOS',
        );
      });

      it('AC5: rechaza un nombre repetido con 409 AREA_DUPLICADA', async () => {
        repository.existsActiveByName.mockResolvedValue(true);
        await expectApiError(
          service.create(buildDto()),
          HttpStatus.CONFLICT,
          'AREA_DUPLICADA',
        );
      });

      it('AC5: traduce la violación de unicidad por una carrera a 409', async () => {
        repository.create.mockRejectedValue(
          new CommonAreaNameTakenError('Salón social'),
        );
        await expectApiError(
          service.create(buildDto()),
          HttpStatus.CONFLICT,
          'AREA_DUPLICADA',
        );
      });
    });

    describe('consulta', () => {
      it('AC1: el listado trae las áreas activas para que los residentes las consulten', async () => {
        repository.findAllActive.mockResolvedValue([buildArea()]);
        expect(await service.findAll()).toEqual([buildArea()]);
      });

      it('AC3: un área eliminada ya no se encuentra (404 AREA_INEXISTENTE)', async () => {
        repository.findActiveById.mockResolvedValue(null);
        await expectApiError(
          service.findOne(99),
          HttpStatus.NOT_FOUND,
          'AREA_INEXISTENTE',
        );
      });
    });

    describe('modificación', () => {
      it('AC2: excluye el área actual al verificar el nombre', async () => {
        await service.update(1, buildDto(), admin);
        expect(repository.existsActiveByName).toHaveBeenCalledWith(
          'Salón social',
          1,
        );
      });

      it('AC2: no registra historial si no cambian capacidad, duración de bloque ni horarios', async () => {
        await service.update(
          1,
          buildDto({ nombre: 'Salón de eventos' }),
          admin,
        );
        expect(repository.update).toHaveBeenCalledWith(
          1,
          expect.anything(),
          [],
          admin.id,
        );
      });

      it('AC2: registra en el historial el cambio de duración de bloque', async () => {
        await service.update(1, buildDto({ duracionBloque: 3 }), admin);

        const changes = repository.update.mock.calls[0][2];
        expect(changes).toEqual([
          { field: 'DURACION_BLOQUE', previousValue: 2, newValue: 3 },
        ]);
      });

      it('AC2: guarda la nueva capacidad y los horarios, y registra el cambio en el historial', async () => {
        const horarios = [
          { diaSemana: 6, horaApertura: '09:00', horaCierre: '22:00' },
          { diaSemana: 5, horaApertura: '10:00', horaCierre: '23:00' },
        ];
        await service.update(1, buildDto({ capacidad: 50, horarios }), admin);

        const changes = repository.update.mock.calls[0][2];
        expect(changes).toEqual([
          { field: 'CAPACIDAD', previousValue: 40, newValue: 50 },
          {
            field: 'HORARIOS',
            previousValue: [
              { diaSemana: 6, horaApertura: '09:00', horaCierre: '22:00' },
            ],
            newValue: [
              { diaSemana: 5, horaApertura: '10:00', horaCierre: '23:00' },
              { diaSemana: 6, horaApertura: '09:00', horaCierre: '22:00' },
            ],
          },
        ]);
      });

      it('AC2: responde 404 si el área no existe o fue eliminada', async () => {
        repository.findActiveById.mockResolvedValue(null);
        await expectApiError(
          service.update(1, buildDto(), admin),
          HttpStatus.NOT_FOUND,
          'AREA_INEXISTENTE',
        );
        expect(repository.update).not.toHaveBeenCalled();
      });
    });

    describe('eliminación', () => {
      it('AC3: elimina lógicamente un área sin reservas futuras, registrando usuario y fecha', async () => {
        await service.remove(1, admin);
        expect(repository.softDelete).toHaveBeenCalledWith(
          1,
          admin.id,
          expect.any(Date),
        );
      });

      it('AC4: no permite eliminar un área con reservas pendientes o confirmadas por realizarse', async () => {
        repository.countUpcomingReservations.mockResolvedValue(2);

        await expectApiError(
          service.remove(1, admin),
          HttpStatus.CONFLICT,
          'AREA_DUPLICADA',
        );
        expect(repository.countUpcomingReservations).toHaveBeenCalledWith(
          1,
          BLOCKING_RESERVATION_STATUSES,
          expect.any(Date),
        );
        expect(repository.softDelete).not.toHaveBeenCalled();
      });

      it('AC4: considera bloqueantes las reservas PENDIENTE y CONFIRMADA', () => {
        expect([...BLOCKING_RESERVATION_STATUSES].sort()).toEqual([
          'CONFIRMADA',
          'PENDIENTE',
        ]);
      });

      it('AC3: responde 404 si el área no existe', async () => {
        repository.findActiveById.mockResolvedValue(null);
        await expectApiError(
          service.remove(1, admin),
          HttpStatus.NOT_FOUND,
          'AREA_INEXISTENTE',
        );
      });
    });
  });

  describe('bloqueos de mantenimiento', () => {
    // Sábado (6) de 09:00 a 22:00, hora de El Salvador (UTC-6).
    const area: CommonAreaWithSchedules = {
      id: 1,
      name: 'Salón social',
      capacity: 40,
      location: 'Torre A, nivel 1',
      blockDurationHours: 2,
      usageConditions: null,
      status: 'ACTIVA',
      createdAt: new Date(),
      deletedAt: null,
      deletedById: null,
      schedules: [
        {
          id: 1,
          areaId: 1,
          dayOfWeek: 6,
          opensAt: parseTime('09:00'),
          closesAt: parseTime('22:00'),
        },
      ],
    };

    function dto(inicio: string, fin: string): CreateBlockDto {
      return { inicio, fin, motivo: 'MANTENIMIENTO' };
    }

    let repository: {
      [K in keyof CommonAreaBlockRepository]: ReturnType<typeof vi.fn>;
    };
    let areasService: { findOne: ReturnType<typeof vi.fn> };
    let service: CommonAreaBlocksService;

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-11-08T12:00:00Z'));

      repository = {
        findAllByArea: vi.fn().mockResolvedValue([]),
        findByIdAndArea: vi.fn(),
        hasOverlappingBlock: vi.fn().mockResolvedValue(false),
        countOverlappingReservations: vi.fn().mockResolvedValue(0),
        create: vi
          .fn()
          .mockImplementation((data) => Promise.resolve({ id: 1, ...data })),
        deleteById: vi.fn().mockResolvedValue(undefined),
      };
      areasService = { findOne: vi.fn().mockResolvedValue(area) };
      const config = { get: vi.fn().mockReturnValue('America/El_Salvador') };

      service = new CommonAreaBlocksService(
        repository as unknown as CommonAreaBlockRepository,
        areasService as unknown as CommonAreasService,
        config as unknown as ConfigService<any, true>,
      );
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    describe('registro', () => {
      it('AC2: registra un periodo de mantenimiento dentro del horario permitido', async () => {
        await service.create(
          1,
          dto('2026-11-14T10:00:00-06:00', '2026-11-14T14:00:00-06:00'),
          admin,
        );

        expect(repository.create).toHaveBeenCalledWith({
          areaId: 1,
          startsAt: new Date('2026-11-14T16:00:00Z'),
          endsAt: new Date('2026-11-14T20:00:00Z'),
          reason: 'MANTENIMIENTO',
          createdById: admin.id,
        });
      });

      it('AC2: acepta un bloqueo de todo el horario, de la apertura al cierre', async () => {
        await service.create(
          1,
          dto('2026-11-14T09:00:00-06:00', '2026-11-14T22:00:00-06:00'),
          admin,
        );
        expect(repository.create).toHaveBeenCalled();
      });

      it('AC2: interpreta las fechas UTC en la zona horaria configurada', async () => {
        // 15:00Z = 09:00 en El Salvador.
        await service.create(
          1,
          dto('2026-11-14T15:00:00Z', '2026-11-14T16:00:00Z'),
          admin,
        );
        expect(repository.create).toHaveBeenCalled();
      });

      it.each([
        [
          'empieza antes de la apertura',
          '2026-11-14T08:30:00-06:00',
          '2026-11-14T10:00:00-06:00',
        ],
        [
          'termina después del cierre',
          '2026-11-14T20:00:00-06:00',
          '2026-11-14T22:30:00-06:00',
        ],
        [
          'el área no abre ese día (domingo)',
          '2026-11-15T10:00:00-06:00',
          '2026-11-15T12:00:00-06:00',
        ],
        [
          'abarca más de un día',
          '2026-11-14T10:00:00-06:00',
          '2026-11-15T10:00:00-06:00',
        ],
        [
          'en UTC cae fuera del horario local',
          '2026-11-14T10:00:00Z',
          '2026-11-14T12:00:00Z',
        ],
      ])(
        'AC5: rechaza con 422 BLOQUEO_FUERA_DE_HORARIO si %s',
        async (_caso, inicio, fin) => {
          await expectApiError(
            service.create(1, dto(inicio, fin), admin),
            HttpStatus.UNPROCESSABLE_ENTITY,
            'BLOQUEO_FUERA_DE_HORARIO',
          );
          expect(repository.create).not.toHaveBeenCalled();
        },
      );

      it('AC5: rechaza con 422 DATOS_INVALIDOS si el fin no es posterior al inicio', async () => {
        await expectApiError(
          service.create(
            1,
            dto('2026-11-14T12:00:00-06:00', '2026-11-14T12:00:00-06:00'),
            admin,
          ),
          HttpStatus.UNPROCESSABLE_ENTITY,
          'DATOS_INVALIDOS',
        );
      });

      it('AC5: rechaza con 422 DATOS_INVALIDOS un bloqueo en el pasado', async () => {
        await expectApiError(
          service.create(
            1,
            dto('2026-11-07T10:00:00-06:00', '2026-11-07T12:00:00-06:00'),
            admin,
          ),
          HttpStatus.UNPROCESSABLE_ENTITY,
          'DATOS_INVALIDOS',
        );
      });

      it('AC5: rechaza con 409 BLOQUEO_SUPERPUESTO si se cruza con otro bloqueo', async () => {
        repository.hasOverlappingBlock.mockResolvedValue(true);
        await expectApiError(
          service.create(
            1,
            dto('2026-11-14T10:00:00-06:00', '2026-11-14T12:00:00-06:00'),
            admin,
          ),
          HttpStatus.CONFLICT,
          'BLOQUEO_SUPERPUESTO',
        );
      });

      it('AC5: traduce la superposición detectada por la base (carrera) a 409', async () => {
        repository.create.mockRejectedValue(new BlockOverlapError());
        await expectApiError(
          service.create(
            1,
            dto('2026-11-14T10:00:00-06:00', '2026-11-14T12:00:00-06:00'),
            admin,
          ),
          HttpStatus.CONFLICT,
          'BLOQUEO_SUPERPUESTO',
        );
      });

      it('AC5: rechaza con 409 BLOQUEO_CON_RESERVAS si hay reservas pendientes o confirmadas', async () => {
        repository.countOverlappingReservations.mockResolvedValue(1);
        await expectApiError(
          service.create(
            1,
            dto('2026-11-14T10:00:00-06:00', '2026-11-14T12:00:00-06:00'),
            admin,
          ),
          HttpStatus.CONFLICT,
          'BLOQUEO_CON_RESERVAS',
        );
        expect(repository.create).not.toHaveBeenCalled();
      });

      it('AC2: propaga el 404 si el área no existe', async () => {
        areasService.findOne.mockRejectedValue(
          new ApiException(
            HttpStatus.NOT_FOUND,
            'AREA_INEXISTENTE',
            'El área común no existe.',
          ),
        );
        await expectApiError(
          service.create(
            99,
            dto('2026-11-14T10:00:00-06:00', '2026-11-14T12:00:00-06:00'),
            admin,
          ),
          HttpStatus.NOT_FOUND,
          'AREA_INEXISTENTE',
        );
      });
    });

    describe('eliminación', () => {
      const block = (endsAt: string) =>
        ({ id: 5, areaId: 1, endsAt: new Date(endsAt) }) as CommonAreaBlock;

      it('AC2: elimina un bloqueo que aún no terminó', async () => {
        repository.findByIdAndArea.mockResolvedValue(
          block('2026-11-14T20:00:00Z'),
        );
        await service.remove(1, 5);
        expect(repository.deleteById).toHaveBeenCalledWith(5);
      });

      it('AC2: responde 404 BLOQUEO_INEXISTENTE si no existe en esa área', async () => {
        repository.findByIdAndArea.mockResolvedValue(null);
        await expectApiError(
          service.remove(1, 5),
          HttpStatus.NOT_FOUND,
          'BLOQUEO_INEXISTENTE',
        );
      });

      it('AC2: responde 409 TRANSICION_INVALIDA si el bloqueo ya terminó', async () => {
        repository.findByIdAndArea.mockResolvedValue(
          block('2026-11-01T20:00:00Z'),
        );
        await expectApiError(
          service.remove(1, 5),
          HttpStatus.CONFLICT,
          'TRANSICION_INVALIDA',
        );
        expect(repository.deleteById).not.toHaveBeenCalled();
      });
    });
  });
});
