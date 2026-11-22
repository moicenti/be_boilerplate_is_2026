import { HttpStatus } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { ApiException } from '@Common/errors';
import { CommonAreaAvailabilityService } from './common-area-availability.service.js';
import type { CommonAreasService } from './common-areas.service.js';
import type {
  CommonAreaAvailabilityRepository,
  CommonAreaWithSchedules,
} from '../repositories/index.js';
import {
  AvailabilityResponseDto,
  type AvailabilityQueryDto,
} from '../dto/index.js';
import {
  dayOfWeekOf,
  parseTime,
  zonedDateTimeToInstant,
} from '../utils/time.js';

// 2026-11-14 es sábado (6). Horarios en hora de El Salvador (UTC-6).
function area(
  id: number,
  name: string,
  schedules: [number, string, string][],
): CommonAreaWithSchedules {
  return {
    id,
    name,
    capacity: 20,
    location: 'Torre A',
    blockDurationHours: 1,
    usageConditions: null,
    status: 'ACTIVA',
    createdAt: new Date(),
    deletedAt: null,
    deletedById: null,
    schedules: schedules.map(([dayOfWeek, opens, closes], i) => ({
      id: i + 1,
      areaId: id,
      dayOfWeek,
      opensAt: parseTime(opens),
      closesAt: parseTime(closes),
    })),
  };
}

const salon = area(1, 'Salón social', [[6, '09:00', '22:00']]);
const piscina = area(2, 'Piscina', [[6, '08:00', '18:00']]);
const gimnasio = area(3, 'Gimnasio', [[1, '06:00', '21:00']]); // solo lunes

const query = (
  overrides: Partial<AvailabilityQueryDto> = {},
): AvailabilityQueryDto => ({
  fecha: '2026-11-14',
  hora: '17:00',
  ...overrides,
});

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

describe('H4. Consultar áreas comunes disponibles según fecha y hora', () => {
  let repository: {
    findAreaIdsWithOverlappingBlocks: ReturnType<typeof vi.fn>;
    findAreaIdsWithOverlappingReservations: ReturnType<typeof vi.fn>;
  };
  let areasService: {
    findAll: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
  };
  let service: CommonAreaAvailabilityService;

  const reasons = async (q: AvailabilityQueryDto) =>
    Object.fromEntries(
      (await service.check(q)).map(({ area, reason }) => [area.name, reason]),
    );

  beforeEach(() => {
    vi.useFakeTimers();
    // Viernes 13 de noviembre, 10:00 en El Salvador.
    vi.setSystemTime(new Date('2026-11-13T16:00:00Z'));

    repository = {
      findAreaIdsWithOverlappingBlocks: vi.fn().mockResolvedValue(new Set()),
      findAreaIdsWithOverlappingReservations: vi
        .fn()
        .mockResolvedValue(new Set()),
    };
    areasService = {
      findAll: vi.fn().mockResolvedValue([salon, piscina, gimnasio]),
      findOne: vi.fn().mockResolvedValue(salon),
    };
    const config = { get: vi.fn().mockReturnValue('America/El_Salvador') };

    service = new CommonAreaAvailabilityService(
      repository as unknown as CommonAreaAvailabilityRepository,
      areasService as unknown as CommonAreasService,
      config as unknown as ConfigService<any, true>,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('AC1: marca cada área como disponible o no para la fecha y hora consultadas', async () => {
    expect(await reasons(query())).toEqual({
      'Salón social': null,
      Piscina: null,
      Gimnasio: 'FUERA_DE_HORARIO',
    });
  });

  it('AC2: busca las reservas confirmadas que se cruzan con el intervalo, en UTC y con 60 minutos por defecto', async () => {
    await service.check(query({ hora: '17:00' }));

    const interval = [
      new Date('2026-11-14T23:00:00Z'),
      new Date('2026-11-15T00:00:00Z'),
    ];
    expect(repository.findAreaIdsWithOverlappingBlocks).toHaveBeenCalledWith(
      [1, 2],
      ...interval,
    );
    expect(
      repository.findAreaIdsWithOverlappingReservations,
    ).toHaveBeenCalledWith([1, 2], ['CONFIRMADA'], ...interval);
  });

  it('AC1: respeta la duración indicada', async () => {
    await service.check(query({ hora: '10:00', duracionMin: 90 }));

    expect(repository.findAreaIdsWithOverlappingBlocks).toHaveBeenCalledWith(
      [1, 2],
      new Date('2026-11-14T16:00:00Z'),
      new Date('2026-11-14T17:30:00Z'),
    );
  });

  it('AC3: no está disponible si el intervalo empieza antes de abrir o termina después de cerrar', async () => {
    expect(await reasons(query({ hora: '08:30' }))).toMatchObject({
      'Salón social': 'FUERA_DE_HORARIO',
      Piscina: null,
    });
    expect(await reasons(query({ hora: '17:30' }))).toMatchObject({
      'Salón social': null,
      Piscina: 'FUERA_DE_HORARIO',
    });
  });

  it('AC3: un intervalo que termina justo al cerrar sí está dentro del horario', async () => {
    expect(await reasons(query({ hora: '21:00' }))).toMatchObject({
      'Salón social': null,
    });
  });

  it('AC3: si ninguna área abre en el intervalo, ninguna está disponible y no consulta la base', async () => {
    expect(await reasons(query({ hora: '23:00' }))).toEqual({
      'Salón social': 'FUERA_DE_HORARIO',
      Piscina: 'FUERA_DE_HORARIO',
      Gimnasio: 'FUERA_DE_HORARIO',
    });
    expect(repository.findAreaIdsWithOverlappingBlocks).not.toHaveBeenCalled();
    expect(
      repository.findAreaIdsWithOverlappingReservations,
    ).not.toHaveBeenCalled();
  });

  it('AC2: un área con una reserva que coincide aparece como RESERVADA', async () => {
    repository.findAreaIdsWithOverlappingReservations.mockResolvedValue(
      new Set([2]),
    );

    expect(await reasons(query())).toEqual({
      'Salón social': null,
      Piscina: 'RESERVADA',
      Gimnasio: 'FUERA_DE_HORARIO',
    });
  });

  it('AC3: un área en mantenimiento aparece como BLOQUEADA, con prioridad sobre la reserva', async () => {
    repository.findAreaIdsWithOverlappingBlocks.mockResolvedValue(new Set([1]));
    repository.findAreaIdsWithOverlappingReservations.mockResolvedValue(
      new Set([1, 2]),
    );

    expect(await reasons(query())).toEqual({
      'Salón social': 'BLOQUEADA',
      Piscina: 'RESERVADA',
      Gimnasio: 'FUERA_DE_HORARIO',
    });
  });

  it('AC1: limita la consulta al área indicada', async () => {
    const results = await service.check(query({ areaId: 1 }));

    expect(areasService.findOne).toHaveBeenCalledWith(1);
    expect(areasService.findAll).not.toHaveBeenCalled();
    expect(results.map((r) => r.area.id)).toEqual([1]);
  });

  it('AC1: propaga AREA_INEXISTENTE si el área no existe', async () => {
    areasService.findOne.mockRejectedValue(
      new ApiException(
        HttpStatus.NOT_FOUND,
        'AREA_INEXISTENTE',
        'El área común no existe.',
      ),
    );

    await expectApiError(
      service.check(query({ areaId: 99 })),
      HttpStatus.NOT_FOUND,
      'AREA_INEXISTENTE',
    );
  });

  it('AC1: rechaza fechas pasadas en la zona del condominio', async () => {
    await expectApiError(
      service.check(query({ fecha: '2026-11-12' })),
      HttpStatus.BAD_REQUEST,
      'SOLICITUD_INVALIDA',
    );
    expect(areasService.findAll).not.toHaveBeenCalled();
  });

  it('AC1: acepta el día de hoy aunque en UTC ya sea mañana', async () => {
    // 23:30 del viernes en El Salvador = 05:30 UTC del sábado.
    vi.setSystemTime(new Date('2026-11-14T05:30:00Z'));

    await expect(
      service.check(query({ fecha: '2026-11-13' })),
    ).resolves.toBeDefined();
  });

  it('AC1: la hora consultada es hora local de El Salvador (UTC-6)', () => {
    expect(
      zonedDateTimeToInstant('2026-11-14', '18:00', 'America/El_Salvador'),
    ).toEqual(new Date('2026-11-15T00:00:00Z'));
  });

  it('AC1: usa el desfase vigente en zonas con horario de verano', () => {
    // Nueva York: UTC-4 en julio, UTC-5 en diciembre.
    expect(
      zonedDateTimeToInstant('2026-07-01', '10:00', 'America/New_York'),
    ).toEqual(new Date('2026-07-01T14:00:00Z'));
    expect(
      zonedDateTimeToInstant('2026-12-01', '10:00', 'America/New_York'),
    ).toEqual(new Date('2026-12-01T15:00:00Z'));
    // El día del cambio (8 de marzo de 2026, 02:00 → 03:00), ya pasado el salto.
    expect(
      zonedDateTimeToInstant('2026-03-08', '12:00', 'America/New_York'),
    ).toEqual(new Date('2026-03-08T16:00:00Z'));
  });

  it('AC3: el horario de uso se toma del día de la semana de la fecha (0 domingo, 6 sábado)', () => {
    expect(dayOfWeekOf('2026-11-15')).toBe(0);
    expect(dayOfWeekOf('2026-11-14')).toBe(6);
  });

  it('AC4: la respuesta trae el id de cada área con la fecha y la hora consultadas, para pasar a reservarla', async () => {
    const response = AvailabilityResponseDto.from(
      '2026-11-14',
      '17:00',
      await service.check(query()),
    );

    expect(response.fecha).toBe('2026-11-14');
    expect(response.hora).toBe('17:00');
    expect(response.areas).toEqual([
      {
        areaId: 1,
        nombre: 'Salón social',
        capacidad: 20,
        disponible: true,
        motivo: null,
      },
      {
        areaId: 2,
        nombre: 'Piscina',
        capacidad: 20,
        disponible: true,
        motivo: null,
      },
      {
        areaId: 3,
        nombre: 'Gimnasio',
        capacidad: 20,
        disponible: false,
        motivo: 'FUERA_DE_HORARIO',
      },
    ]);
  });
});
