import { HttpStatus } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Reservation, User } from '@PrismaClient';
import { ApiException } from '@Common/errors';
import type { CommonAreasService } from '@CommonAreas/services';
import { parseTime, toZonedIso } from '@CommonAreas/utils';
import { ReservationsService } from './reservations.service.js';
import type { ReservationRepository } from '../repositories/index.js';
import { ReservationOverlapError } from '../errors/index.js';
import { ReservationResponseDto } from '../dto/reservation-response.dto.js';

const unit = { id: 'unit-a304', code: 'A-304' };
const resident = { id: 'resident-id', unitId: unit.id } as User;

// Sábado (6) de 10:00 a 20:00, hora de El Salvador (UTC-6).
const area = {
  id: 2,
  schedules: [
    {
      id: 1,
      areaId: 2,
      dayOfWeek: 6,
      opensAt: parseTime('10:00'),
      closesAt: parseTime('20:00'),
    },
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

describe('H5. Reserva de área común y protección de reservación duplicada', () => {
  let repository: {
    [K in keyof ReservationRepository]: ReturnType<typeof vi.fn>;
  };
  let areasService: { findOne: ReturnType<typeof vi.fn> };
  let service: ReservationsService;

  beforeEach(() => {
    vi.useFakeTimers();
    // Sábado 14 nov 2026, 06:00 hora local.
    vi.setSystemTime(new Date('2026-11-14T12:00:00Z'));

    repository = {
      hasOverlappingBlock: vi.fn().mockResolvedValue(false),
      findAllByUnit: vi.fn().mockResolvedValue([]),
      findById: vi.fn(),
      create: vi
        .fn()
        .mockImplementation((data) => Promise.resolve({ id: 77, ...data })),
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

  describe('reservar', () => {
    it('AC1: registra la reserva con el residente y la unidad de la sesión', async () => {
      await service.create(
        dto('2026-11-14T14:00:00-06:00', '2026-11-14T16:00:00-06:00'),
        resident,
      );

      expect(repository.create).toHaveBeenCalledWith({
        areaId: 2,
        residentId: resident.id,
        unitId: unit.id,
        startsAt: new Date('2026-11-14T20:00:00Z'),
        endsAt: new Date('2026-11-14T22:00:00Z'),
      });
    });

    it('AC4: acepta el horario completo del día, de la apertura al cierre', async () => {
      await service.create(
        dto('2026-11-14T10:00:00-06:00', '2026-11-14T20:00:00-06:00'),
        resident,
      );
      expect(repository.create).toHaveBeenCalled();
    });

    it('AC1: interpreta correctamente fechas con otro desfase (UTC)', async () => {
      await service.create(
        dto('2026-11-14T20:00:00Z', '2026-11-14T22:00:00Z'),
        resident,
      );
      expect(repository.create).toHaveBeenCalled();
    });

    it('AC4: rechaza un fin igual o anterior al inicio con 400', async () => {
      await expectApiError(
        service.create(
          dto('2026-11-14T16:00:00-06:00', '2026-11-14T16:00:00-06:00'),
          resident,
        ),
        HttpStatus.BAD_REQUEST,
        'SOLICITUD_INVALIDA',
      );
    });

    it('AC1: propaga el 404 si el área no existe', async () => {
      areasService.findOne.mockRejectedValue(
        new ApiException(
          HttpStatus.NOT_FOUND,
          'AREA_INEXISTENTE',
          'El área común no existe.',
        ),
      );
      await expectApiError(
        service.create(
          dto('2026-11-14T14:00:00-06:00', '2026-11-14T16:00:00-06:00'),
          resident,
        ),
        HttpStatus.NOT_FOUND,
        'AREA_INEXISTENTE',
      );
    });

    it('AC4: rechaza una hora ya pasada de hoy con 422', async () => {
      vi.setSystemTime(new Date('2026-11-14T21:00:00Z')); // 15:00 local
      await expectApiError(
        service.create(
          dto('2026-11-14T14:00:00-06:00', '2026-11-14T16:00:00-06:00'),
          resident,
        ),
        HttpStatus.UNPROCESSABLE_ENTITY,
        'FUERA_DE_HORARIO',
      );
    });

    it.each([
      [
        'antes de la apertura',
        '2026-11-14T09:00:00-06:00',
        '2026-11-14T11:00:00-06:00',
      ],
      [
        'después del cierre',
        '2026-11-14T19:00:00-06:00',
        '2026-11-14T21:00:00-06:00',
      ],
      [
        'en un día que el área no abre',
        '2026-11-15T12:00:00-06:00',
        '2026-11-15T14:00:00-06:00',
      ],
      [
        'cruzando la medianoche',
        '2026-11-14T19:00:00-06:00',
        '2026-11-15T01:00:00-06:00',
      ],
    ])(
      'AC4: rechaza una reserva %s con 422, sin crearla',
      async (_caso, inicio, fin) => {
        await expectApiError(
          service.create(dto(inicio, fin), resident),
          HttpStatus.UNPROCESSABLE_ENTITY,
          'FUERA_DE_HORARIO',
        );
        expect(repository.create).not.toHaveBeenCalled();
      },
    );

    it('AC4: rechaza un horario bloqueado por mantenimiento con 422', async () => {
      repository.hasOverlappingBlock.mockResolvedValue(true);
      await expectApiError(
        service.create(
          dto('2026-11-14T14:00:00-06:00', '2026-11-14T16:00:00-06:00'),
          resident,
        ),
        HttpStatus.UNPROCESSABLE_ENTITY,
        'FUERA_DE_HORARIO',
      );
    });

    it('AC2: rechaza la misma área en un horario que se cruza con 409 RESERVA_CRUZADA e indica el motivo', async () => {
      repository.create.mockRejectedValue(new ReservationOverlapError());
      await expectApiError(
        service.create(
          dto('2026-11-14T14:00:00-06:00', '2026-11-14T16:00:00-06:00'),
          resident,
        ),
        HttpStatus.CONFLICT,
        'RESERVA_CRUZADA',
      );

      const error = (await service
        .create(
          dto('2026-11-14T15:00:00-06:00', '2026-11-14T17:00:00-06:00'),
          resident,
        )
        .catch((e: ApiException) => e.getResponse())) as { mensaje: string };
      expect(error.mensaje).toBe(
        'El espacio ya está reservado en ese horario.',
      );
    });

    it('AC3: si dos residentes confirman a la vez, solo uno obtiene la reserva y el otro recibe el conflicto', async () => {
      // La restricción de exclusión de PostgreSQL deja pasar solo la primera inserción.
      let taken = false;
      repository.create.mockImplementation((data) => {
        if (taken) return Promise.reject(new ReservationOverlapError());
        taken = true;
        return Promise.resolve({ id: 78, ...data });
      });
      const other = { id: 'other-id', unitId: 'unit-b205' } as User;
      const slot = dto(
        '2026-11-14T14:00:00-06:00',
        '2026-11-14T16:00:00-06:00',
      );

      const results = await Promise.allSettled([
        service.create(slot, resident),
        service.create(slot, other),
      ]);

      expect(results.map((r) => r.status)).toEqual(['fulfilled', 'rejected']);
      const rejected = (results[1] as PromiseRejectedResult)
        .reason as ApiException;
      expect(rejected.getStatus()).toBe(HttpStatus.CONFLICT);
      expect(rejected.getResponse()).toMatchObject({
        codigo: 'RESERVA_CRUZADA',
      });
    });

    it('AC1: la reserva registrada se muestra con su inicio y fin en hora local', () => {
      expect(
        ReservationResponseDto.fromEntity(reservation(), 'America/El_Salvador'),
      ).toEqual({
        reservaId: 77,
        areaId: 2,
        inicio: '2026-11-14T14:00:00-06:00',
        fin: '2026-11-14T16:00:00-06:00',
        estado: 'CONFIRMADA',
      });
      expect(toZonedIso(new Date('2026-11-13T00:30:15Z'), 'UTC')).toBe(
        '2026-11-13T00:30:15+00:00',
      );
    });

    it('AC1: rechaza a un usuario sin unidad registrada con 403', async () => {
      await expectApiError(
        service.create(
          dto('2026-11-14T14:00:00-06:00', '2026-11-14T16:00:00-06:00'),
          { ...resident, unitId: null },
        ),
        HttpStatus.FORBIDDEN,
        'UNIDAD_NO_ASIGNADA',
      );
    });
  });

  describe('mis reservas', () => {
    it('AC1: lista las reservas de la unidad de la sesión', async () => {
      await service.findMine(resident);
      expect(repository.findAllByUnit).toHaveBeenCalledWith(unit.id);
    });
  });

  describe('cancelación', () => {
    it('AC1: el residente cancela una reserva próxima de su unidad', async () => {
      repository.findById.mockResolvedValue(reservation());
      repository.cancel.mockResolvedValue(reservation({ status: 'CANCELADA' }));

      const result = await service.cancel(77, resident);
      expect(result.status).toBe('CANCELADA');
    });

    it('AC1: responde 404 si la reserva no existe', async () => {
      repository.findById.mockResolvedValue(null);
      await expectApiError(
        service.cancel(77, resident),
        HttpStatus.NOT_FOUND,
        'RESERVA_INEXISTENTE',
      );
    });

    it('AC1: no permite cancelar la reserva de otra unidad (403)', async () => {
      repository.findById.mockResolvedValue(
        reservation({ unitId: 'otra-unidad' }),
      );
      await expectApiError(
        service.cancel(77, resident),
        HttpStatus.FORBIDDEN,
        'RECURSO_AJENO',
      );
    });

    it('AC1: responde 409 si ya estaba cancelada', async () => {
      repository.findById.mockResolvedValue(
        reservation({ status: 'CANCELADA' }),
      );
      await expectApiError(
        service.cancel(77, resident),
        HttpStatus.CONFLICT,
        'TRANSICION_INVALIDA',
      );
    });

    it('AC1: responde 409 si ya terminó', async () => {
      repository.findById.mockResolvedValue(
        reservation({ endsAt: new Date('2026-11-14T11:00:00Z') }),
      );
      await expectApiError(
        service.cancel(77, resident),
        HttpStatus.CONFLICT,
        'TRANSICION_INVALIDA',
      );
    });

    it('AC1: responde 409 si otra solicitud la canceló antes', async () => {
      repository.findById.mockResolvedValue(reservation());
      repository.cancel.mockResolvedValue(null);
      await expectApiError(
        service.cancel(77, resident),
        HttpStatus.CONFLICT,
        'TRANSICION_INVALIDA',
      );
    });
  });
});
