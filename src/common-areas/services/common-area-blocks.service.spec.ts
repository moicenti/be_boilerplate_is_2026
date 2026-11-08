import { HttpStatus } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { CommonAreaBlock, User } from '@PrismaClient';
import { ApiException } from '@Common/errors';
import { CommonAreaBlocksService } from './common-area-blocks.service.js';
import type { CommonAreasService } from './common-areas.service.js';
import type { CommonAreaBlockRepository, CommonAreaWithSchedules } from '../repositories/index.js';
import { BlockOverlapError } from '../errors/index.js';
import type { CreateBlockDto } from '../dto/index.js';
import { parseTime } from '../utils/time.js';

const admin = { id: 'admin-id' } as User;

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
    { id: 1, areaId: 1, dayOfWeek: 6, opensAt: parseTime('09:00'), closesAt: parseTime('22:00') },
  ],
};

function dto(inicio: string, fin: string): CreateBlockDto {
  return { inicio, fin, motivo: 'MANTENIMIENTO' };
}

async function expectApiError(promise: Promise<unknown>, status: HttpStatus, codigo: string) {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(ApiException);
  expect((error as ApiException).getStatus()).toBe(status);
  expect((error as ApiException).getResponse()).toMatchObject({ codigo });
}

describe('CommonAreaBlocksService', () => {
  let repository: { [K in keyof CommonAreaBlockRepository]: ReturnType<typeof vi.fn> };
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
      create: vi.fn().mockImplementation((data) => Promise.resolve({ id: 1, ...data })),
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

  describe('create', () => {
    it('crea un bloqueo dentro del horario permitido', async () => {
      await service.create(1, dto('2026-11-14T10:00:00-06:00', '2026-11-14T14:00:00-06:00'), admin);

      expect(repository.create).toHaveBeenCalledWith({
        areaId: 1,
        startsAt: new Date('2026-11-14T16:00:00Z'),
        endsAt: new Date('2026-11-14T20:00:00Z'),
        reason: 'MANTENIMIENTO',
        createdById: admin.id,
      });
    });

    it('acepta exactamente el horario completo (apertura a cierre)', async () => {
      await service.create(1, dto('2026-11-14T09:00:00-06:00', '2026-11-14T22:00:00-06:00'), admin);
      expect(repository.create).toHaveBeenCalled();
    });

    it('interpreta las fechas UTC en la zona horaria configurada', async () => {
      // 15:00Z = 09:00 en El Salvador.
      await service.create(1, dto('2026-11-14T15:00:00Z', '2026-11-14T16:00:00Z'), admin);
      expect(repository.create).toHaveBeenCalled();
    });

    it.each([
      ['empieza antes de la apertura', '2026-11-14T08:30:00-06:00', '2026-11-14T10:00:00-06:00'],
      ['termina después del cierre', '2026-11-14T20:00:00-06:00', '2026-11-14T22:30:00-06:00'],
      ['el área no abre ese día (domingo)', '2026-11-15T10:00:00-06:00', '2026-11-15T12:00:00-06:00'],
      ['abarca más de un día', '2026-11-14T10:00:00-06:00', '2026-11-15T10:00:00-06:00'],
      ['en UTC cae fuera del horario local', '2026-11-14T10:00:00Z', '2026-11-14T12:00:00Z'],
    ])('rechaza con 422 BLOQUEO_FUERA_DE_HORARIO si %s', async (_caso, inicio, fin) => {
      await expectApiError(
        service.create(1, dto(inicio, fin), admin),
        HttpStatus.UNPROCESSABLE_ENTITY,
        'BLOQUEO_FUERA_DE_HORARIO',
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('rechaza con 422 DATOS_INVALIDOS si el fin no es posterior al inicio', async () => {
      await expectApiError(
        service.create(1, dto('2026-11-14T12:00:00-06:00', '2026-11-14T12:00:00-06:00'), admin),
        HttpStatus.UNPROCESSABLE_ENTITY,
        'DATOS_INVALIDOS',
      );
    });

    it('rechaza con 422 DATOS_INVALIDOS un bloqueo en el pasado', async () => {
      await expectApiError(
        service.create(1, dto('2026-11-07T10:00:00-06:00', '2026-11-07T12:00:00-06:00'), admin),
        HttpStatus.UNPROCESSABLE_ENTITY,
        'DATOS_INVALIDOS',
      );
    });

    it('rechaza con 409 BLOQUEO_SUPERPUESTO si se cruza con otro bloqueo', async () => {
      repository.hasOverlappingBlock.mockResolvedValue(true);
      await expectApiError(
        service.create(1, dto('2026-11-14T10:00:00-06:00', '2026-11-14T12:00:00-06:00'), admin),
        HttpStatus.CONFLICT,
        'BLOQUEO_SUPERPUESTO',
      );
    });

    it('traduce la superposición detectada por la base (carrera) a 409', async () => {
      repository.create.mockRejectedValue(new BlockOverlapError());
      await expectApiError(
        service.create(1, dto('2026-11-14T10:00:00-06:00', '2026-11-14T12:00:00-06:00'), admin),
        HttpStatus.CONFLICT,
        'BLOQUEO_SUPERPUESTO',
      );
    });

    it('rechaza con 409 BLOQUEO_CON_RESERVAS si hay reservas pendientes o confirmadas', async () => {
      repository.countOverlappingReservations.mockResolvedValue(1);
      await expectApiError(
        service.create(1, dto('2026-11-14T10:00:00-06:00', '2026-11-14T12:00:00-06:00'), admin),
        HttpStatus.CONFLICT,
        'BLOQUEO_CON_RESERVAS',
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('propaga el 404 si el área no existe', async () => {
      areasService.findOne.mockRejectedValue(
        new ApiException(HttpStatus.NOT_FOUND, 'AREA_INEXISTENTE', 'El área común no existe.'),
      );
      await expectApiError(
        service.create(99, dto('2026-11-14T10:00:00-06:00', '2026-11-14T12:00:00-06:00'), admin),
        HttpStatus.NOT_FOUND,
        'AREA_INEXISTENTE',
      );
    });
  });

  describe('remove', () => {
    const block = (endsAt: string) =>
      ({ id: 5, areaId: 1, endsAt: new Date(endsAt) }) as CommonAreaBlock;

    it('elimina un bloqueo que aún no terminó', async () => {
      repository.findByIdAndArea.mockResolvedValue(block('2026-11-14T20:00:00Z'));
      await service.remove(1, 5);
      expect(repository.deleteById).toHaveBeenCalledWith(5);
    });

    it('responde 404 BLOQUEO_INEXISTENTE si no existe en esa área', async () => {
      repository.findByIdAndArea.mockResolvedValue(null);
      await expectApiError(service.remove(1, 5), HttpStatus.NOT_FOUND, 'BLOQUEO_INEXISTENTE');
    });

    it('responde 409 TRANSICION_INVALIDA si el bloqueo ya terminó', async () => {
      repository.findByIdAndArea.mockResolvedValue(block('2026-11-01T20:00:00Z'));
      await expectApiError(service.remove(1, 5), HttpStatus.CONFLICT, 'TRANSICION_INVALIDA');
      expect(repository.deleteById).not.toHaveBeenCalled();
    });
  });
});
