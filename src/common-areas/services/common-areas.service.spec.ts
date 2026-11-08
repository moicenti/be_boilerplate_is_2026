import { HttpStatus } from '@nestjs/common';
import type { User } from '@PrismaClient';
import { ApiException } from '@Common/errors';
import {
  BLOCKING_RESERVATION_STATUSES,
  CommonAreasService,
} from './common-areas.service.js';
import type {
  CommonAreaRepository,
  CommonAreaWithSchedules,
} from '../repositories/index.js';
import { CommonAreaNameTakenError } from '../errors/index.js';
import type { SaveCommonAreaDto } from '../dto/index.js';
import { parseTime } from '../utils/time.js';

const admin = { id: 'admin-id' } as User;

function buildDto(overrides: Partial<SaveCommonAreaDto> = {}): SaveCommonAreaDto {
  return {
    nombre: 'Salón social',
    capacidad: 40,
    horarios: [{ diaSemana: 6, horaApertura: '09:00', horaCierre: '22:00' }],
    ...overrides,
  };
}

function buildArea(): CommonAreaWithSchedules {
  return {
    id: 1,
    name: 'Salón social',
    capacity: 40,
    status: 'ACTIVA',
    createdAt: new Date(),
    deletedAt: null,
    deletedById: null,
    schedules: [
      { id: 1, areaId: 1, dayOfWeek: 6, opensAt: parseTime('09:00'), closesAt: parseTime('22:00') },
    ],
  };
}

async function expectApiError(promise: Promise<unknown>, status: HttpStatus, codigo: string) {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(ApiException);
  expect((error as ApiException).getStatus()).toBe(status);
  expect((error as ApiException).getResponse()).toMatchObject({ codigo });
}

describe('CommonAreasService', () => {
  let repository: { [K in keyof CommonAreaRepository]: ReturnType<typeof vi.fn> };
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
    service = new CommonAreasService(repository as unknown as CommonAreaRepository);
  });

  describe('create', () => {
    it('crea el área convirtiendo los horarios a horas', async () => {
      await service.create(buildDto());

      expect(repository.create).toHaveBeenCalledWith({
        name: 'Salón social',
        capacity: 40,
        schedules: [{ dayOfWeek: 6, opensAt: parseTime('09:00'), closesAt: parseTime('22:00') }],
      });
    });

    it.each([0, -5])('rechaza capacidad %i con 422 DATOS_INVALIDOS', async (capacidad) => {
      await expectApiError(
        service.create(buildDto({ capacidad })),
        HttpStatus.UNPROCESSABLE_ENTITY,
        'DATOS_INVALIDOS',
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it.each([
      ['igual', '10:00', '10:00'],
      ['anterior', '10:00', '09:30'],
    ])('rechaza cierre %s a la apertura con 422', async (_caso, horaApertura, horaCierre) => {
      await expectApiError(
        service.create(buildDto({ horarios: [{ diaSemana: 1, horaApertura, horaCierre }] })),
        HttpStatus.UNPROCESSABLE_ENTITY,
        'DATOS_INVALIDOS',
      );
    });

    it('rechaza dos horarios para el mismo día con 422', async () => {
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

    it('rechaza un nombre repetido con 409 AREA_DUPLICADA', async () => {
      repository.existsActiveByName.mockResolvedValue(true);
      await expectApiError(service.create(buildDto()), HttpStatus.CONFLICT, 'AREA_DUPLICADA');
    });

    it('traduce la violación de unicidad del repositorio (carrera) a 409', async () => {
      repository.create.mockRejectedValue(new CommonAreaNameTakenError('Salón social'));
      await expectApiError(service.create(buildDto()), HttpStatus.CONFLICT, 'AREA_DUPLICADA');
    });
  });

  describe('findOne', () => {
    it('responde 404 AREA_INEXISTENTE si no hay un área activa', async () => {
      repository.findActiveById.mockResolvedValue(null);
      await expectApiError(service.findOne(99), HttpStatus.NOT_FOUND, 'AREA_INEXISTENTE');
    });
  });

  describe('update', () => {
    it('excluye el área actual al verificar el nombre', async () => {
      await service.update(1, buildDto(), admin);
      expect(repository.existsActiveByName).toHaveBeenCalledWith('Salón social', 1);
    });

    it('no registra historial si no cambian capacidad ni horarios', async () => {
      await service.update(1, buildDto({ nombre: 'Salón de eventos' }), admin);
      expect(repository.update).toHaveBeenCalledWith(1, expect.anything(), [], admin.id);
    });

    it('registra en el historial los cambios de capacidad y horario', async () => {
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
          previousValue: [{ diaSemana: 6, horaApertura: '09:00', horaCierre: '22:00' }],
          newValue: [
            { diaSemana: 5, horaApertura: '10:00', horaCierre: '23:00' },
            { diaSemana: 6, horaApertura: '09:00', horaCierre: '22:00' },
          ],
        },
      ]);
    });

    it('responde 404 si el área no existe o fue eliminada', async () => {
      repository.findActiveById.mockResolvedValue(null);
      await expectApiError(
        service.update(1, buildDto(), admin),
        HttpStatus.NOT_FOUND,
        'AREA_INEXISTENTE',
      );
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('elimina lógicamente registrando usuario y fecha', async () => {
      await service.remove(1, admin);
      expect(repository.softDelete).toHaveBeenCalledWith(1, admin.id, expect.any(Date));
    });

    it('bloquea la eliminación con reservas pendientes o confirmadas por realizarse', async () => {
      repository.countUpcomingReservations.mockResolvedValue(2);

      await expectApiError(service.remove(1, admin), HttpStatus.CONFLICT, 'AREA_DUPLICADA');
      expect(repository.countUpcomingReservations).toHaveBeenCalledWith(
        1,
        BLOCKING_RESERVATION_STATUSES,
        expect.any(Date),
      );
      expect(repository.softDelete).not.toHaveBeenCalled();
    });

    it('considera bloqueantes las reservas PENDIENTE y CONFIRMADA', () => {
      expect([...BLOCKING_RESERVATION_STATUSES].sort()).toEqual(['CONFIRMADA', 'PENDIENTE']);
    });

    it('responde 404 si el área no existe', async () => {
      repository.findActiveById.mockResolvedValue(null);
      await expectApiError(service.remove(1, admin), HttpStatus.NOT_FOUND, 'AREA_INEXISTENTE');
    });
  });
});
