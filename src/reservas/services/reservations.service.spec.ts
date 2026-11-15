import { HttpStatus } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Reservation, User } from '@PrismaClient';
import { ApiException } from '@Common/errors';
import type { CommonAreasService } from '@CommonAreas/services';
import { parseTime } from '@CommonAreas/utils';
import { ReservationsService } from './reservations.service.js';
import type { ReservationRepository } from '../repositories/index.js';
import { ReservationOverlapError } from '../errors/index.js';

const resident = { id: 'resident-id', unit: 'A-304' } as User;
const unit = { id: 'unit-a304', code: 'A-304' };

// Sábado (6) de 10:00 a 20:00, hora de El Salvador (UTC-6).
const area = {
  id: 2,
  schedules: [
    { id: 1, areaId: 2, dayOfWeek: 6, opensAt: parseTime('10:00'), closesAt: parseTime('20:00') },
  ],
};

const dto = (inicio: string, fin: string) => ({ areaId: 2, inicio, fin });

function reservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: 77,
    areaId: 2,
    residentId: resident.id,
    unitId: unit.id,
    startsAt: new Date('2026-11-14T20:00:00Z'),
    endsAt: new Date('2026-11-14T22:00:00Z'),
    status: 'CONFIRMADA',
    createdAt: new Date(),
    ...overrides,
  };
}

async function expectApiError(promise: Promise<unknown>, status: HttpStatus, codigo: string) {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(ApiException);
  expect((error as ApiException).getStatus()).toBe(status);
  expect((error as ApiException).getResponse()).toMatchObject({ codigo });
}

describe('ReservationsService', () => {
  let repository: { [K in keyof ReservationRepository]: ReturnType<typeof vi.fn> };
  let areasService: { findOne: ReturnType<typeof vi.fn> };
  let service: ReservationsService;

  beforeEach(() => {
    vi.useFakeTimers();
    // Sábado 14 nov 2026, 06:00 hora local.
    vi.setSystemTime(new Date('2026-11-14T12:00:00Z'));

    repository = {
      findUnitByCode: vi.fn().mockResolvedValue(unit),
      hasOverlappingBlock: vi.fn().mockResolvedValue(false),
      findAllByUnit: vi.fn().mockResolvedValue([]),
      findById: vi.fn(),
      create: vi.fn().mockImplementation((data) => Promise.resolve({ id: 77, ...data })),
      cancel: vi.fn(),
    };
    areasService = { findOne: vi.fn().mockResolvedValue(area) };
    const config = { get: vi.fn().mockReturnValue('America/El_Salvador') };

    service = new ReservationsService(
      repository as unknown as ReservationRepository,
      areasService as unknown as CommonAreasService,
      config as unknown as ConfigService<any, true>,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('create', () => {
    it('crea la reserva con residente y unidad de la sesión', async () => {
      await service.create(dto('2026-11-14T14:00:00-06:00', '2026-11-14T16:00:00-06:00'), resident);

      expect(repository.findUnitByCode).toHaveBeenCalledWith('A-304');
      expect(repository.create).toHaveBeenCalledWith({
        areaId: 2,
        residentId: resident.id,
        unitId: unit.id,
        startsAt: new Date('2026-11-14T20:00:00Z'),
        endsAt: new Date('2026-11-14T22:00:00Z'),
      });
    });

    it('acepta el horario completo del día (apertura a cierre)', async () => {
      await service.create(dto('2026-11-14T10:00:00-06:00', '2026-11-14T20:00:00-06:00'), resident);
      expect(repository.create).toHaveBeenCalled();
    });

    it('interpreta correctamente fechas con otro desfase (UTC)', async () => {
      await service.create(dto('2026-11-14T20:00:00Z', '2026-11-14T22:00:00Z'), resident);
      expect(repository.create).toHaveBeenCalled();
    });

    it('rechaza fin igual o anterior al inicio con 400', async () => {
      await expectApiError(
        service.create(dto('2026-11-14T16:00:00-06:00', '2026-11-14T16:00:00-06:00'), resident),
        HttpStatus.BAD_REQUEST,
        'SOLICITUD_INVALIDA',
      );
    });

    it('propaga el 404 si el área no existe', async () => {
      areasService.findOne.mockRejectedValue(
        new ApiException(HttpStatus.NOT_FOUND, 'AREA_INEXISTENTE', 'El área común no existe.'),
      );
      await expectApiError(
        service.create(dto('2026-11-14T14:00:00-06:00', '2026-11-14T16:00:00-06:00'), resident),
        HttpStatus.NOT_FOUND,
        'AREA_INEXISTENTE',
      );
    });

    it('rechaza una hora ya pasada de hoy con 422', async () => {
      vi.setSystemTime(new Date('2026-11-14T21:00:00Z')); // 15:00 local
      await expectApiError(
        service.create(dto('2026-11-14T14:00:00-06:00', '2026-11-14T16:00:00-06:00'), resident),
        HttpStatus.UNPROCESSABLE_ENTITY,
        'FUERA_DE_HORARIO',
      );
    });

    it.each([
      ['antes de la apertura', '2026-11-14T09:00:00-06:00', '2026-11-14T11:00:00-06:00'],
      ['después del cierre', '2026-11-14T19:00:00-06:00', '2026-11-14T21:00:00-06:00'],
      ['en un día que el área no abre', '2026-11-15T12:00:00-06:00', '2026-11-15T14:00:00-06:00'],
      ['cruzando la medianoche', '2026-11-14T19:00:00-06:00', '2026-11-15T01:00:00-06:00'],
    ])('rechaza una reserva %s con 422', async (_caso, inicio, fin) => {
      await expectApiError(
        service.create(dto(inicio, fin), resident),
        HttpStatus.UNPROCESSABLE_ENTITY,
        'FUERA_DE_HORARIO',
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('rechaza un horario bloqueado con 422', async () => {
      repository.hasOverlappingBlock.mockResolvedValue(true);
      await expectApiError(
        service.create(dto('2026-11-14T14:00:00-06:00', '2026-11-14T16:00:00-06:00'), resident),
        HttpStatus.UNPROCESSABLE_ENTITY,
        'FUERA_DE_HORARIO',
      );
    });

    it('convierte el rechazo de la restricción de exclusión en 409', async () => {
      repository.create.mockRejectedValue(new ReservationOverlapError());
      await expectApiError(
        service.create(dto('2026-11-14T14:00:00-06:00', '2026-11-14T16:00:00-06:00'), resident),
        HttpStatus.CONFLICT,
        'RESERVA_CRUZADA',
      );
    });

    it('rechaza a un usuario sin unidad registrada con 403', async () => {
      repository.findUnitByCode.mockResolvedValue(null);
      await expectApiError(
        service.create(dto('2026-11-14T14:00:00-06:00', '2026-11-14T16:00:00-06:00'), resident),
        HttpStatus.FORBIDDEN,
        'UNIDAD_NO_ASIGNADA',
      );
    });
  });

  describe('findMine', () => {
    it('lista por la unidad de la sesión', async () => {
      await service.findMine(resident);
      expect(repository.findAllByUnit).toHaveBeenCalledWith(unit.id);
    });
  });

  describe('cancel', () => {
    it('cancela una reserva próxima de la unidad', async () => {
      repository.findById.mockResolvedValue(reservation());
      repository.cancel.mockResolvedValue(reservation({ status: 'CANCELADA' }));

      const result = await service.cancel(77, resident);
      expect(result.status).toBe('CANCELADA');
    });

    it('responde 404 si la reserva no existe', async () => {
      repository.findById.mockResolvedValue(null);
      await expectApiError(service.cancel(77, resident), HttpStatus.NOT_FOUND, 'RESERVA_INEXISTENTE');
    });

    it('responde 403 si la reserva es de otra unidad', async () => {
      repository.findById.mockResolvedValue(reservation({ unitId: 'otra-unidad' }));
      await expectApiError(service.cancel(77, resident), HttpStatus.FORBIDDEN, 'RECURSO_AJENO');
    });

    it('responde 409 si ya estaba cancelada', async () => {
      repository.findById.mockResolvedValue(reservation({ status: 'CANCELADA' }));
      await expectApiError(service.cancel(77, resident), HttpStatus.CONFLICT, 'TRANSICION_INVALIDA');
    });

    it('responde 409 si ya terminó', async () => {
      repository.findById.mockResolvedValue(
        reservation({ endsAt: new Date('2026-11-14T11:00:00Z') }),
      );
      await expectApiError(service.cancel(77, resident), HttpStatus.CONFLICT, 'TRANSICION_INVALIDA');
    });

    it('responde 409 si otra request la canceló antes', async () => {
      repository.findById.mockResolvedValue(reservation());
      repository.cancel.mockResolvedValue(null);
      await expectApiError(service.cancel(77, resident), HttpStatus.CONFLICT, 'TRANSICION_INVALIDA');
    });
  });
});
