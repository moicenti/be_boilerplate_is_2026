import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '@Config';
import { ApiException } from '@Common/errors';
import {
  CommonAreaAvailabilityRepository,
  type CommonAreaWithSchedules,
} from '../repositories/index.js';
import type { AvailabilityQueryDto } from '../dto/index.js';
import {
  DEFAULT_AVAILABILITY_DURATION_MIN,
  OCCUPYING_RESERVATION_STATUSES,
  UnavailabilityReason,
} from '../constants.js';
import {
  dayOfWeekOf,
  parseTime,
  timeToSeconds,
  toZonedParts,
  zonedDateTimeToInstant,
} from '../utils/time.js';
import { CommonAreasService } from './common-areas.service.js';

export interface AreaAvailability {
  area: CommonAreaWithSchedules;
  /** null si el área está disponible en el intervalo consultado. */
  reason: UnavailabilityReason | null;
}

/**
 * Disponibilidad de las áreas comunes en un intervalo (H4). Solo lectura.
 *
 * Por cada área ACTIVA, en este orden: ¿el intervalo cae dentro de su horario del día?
 * (si no, FUERA_DE_HORARIO) → ¿cruza un bloqueo? (BLOQUEADA) → ¿cruza una reserva
 * CONFIRMADA? (RESERVADA) → disponible.
 */
@Injectable()
export class CommonAreaAvailabilityService {
  private readonly timeZone: string;

  constructor(
    private readonly availabilityRepository: CommonAreaAvailabilityRepository,
    private readonly commonAreasService: CommonAreasService,
    configService: ConfigService<EnvConfig, true>,
  ) {
    this.timeZone = configService.get('APP_TIMEZONE', { infer: true });
  }

  async check(query: AvailabilityQueryDto): Promise<AreaAvailability[]> {
    const { fecha, hora, areaId } = query;
    const durationMin = query.duracionMin ?? DEFAULT_AVAILABILITY_DURATION_MIN;

    // "YYYY-MM-DD" se compara bien como texto.
    if (fecha < toZonedParts(new Date(), this.timeZone).date) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'SOLICITUD_INVALIDA',
        'No se puede consultar la disponibilidad de una fecha pasada.',
      );
    }

    const areas =
      areaId !== undefined
        ? [await this.commonAreasService.findOne(areaId)]
        : await this.commonAreasService.findAll();

    // El horario se compara en hora local; bloqueos y reservas, como instantes.
    const dayOfWeek = dayOfWeekOf(fecha);
    const startSeconds = timeToSeconds(parseTime(hora));
    const endSeconds = startSeconds + durationMin * 60;
    const startsAt = zonedDateTimeToInstant(fecha, hora, this.timeZone);
    const endsAt = new Date(startsAt.getTime() + durationMin * 60_000);

    const openAreaIds = areas
      .filter((area) => this.isWithinSchedule(area, dayOfWeek, startSeconds, endSeconds))
      .map((area) => area.id);

    const [blocked, reserved] =
      openAreaIds.length === 0
        ? [new Set<number>(), new Set<number>()]
        : await Promise.all([
            this.availabilityRepository.findAreaIdsWithOverlappingBlocks(
              openAreaIds,
              startsAt,
              endsAt,
            ),
            this.availabilityRepository.findAreaIdsWithOverlappingReservations(
              openAreaIds,
              OCCUPYING_RESERVATION_STATUSES,
              startsAt,
              endsAt,
            ),
          ]);

    const open = new Set(openAreaIds);
    return areas.map((area) => ({
      area,
      reason: !open.has(area.id)
        ? UnavailabilityReason.FUERA_DE_HORARIO
        : blocked.has(area.id)
          ? UnavailabilityReason.BLOQUEADA
          : reserved.has(area.id)
            ? UnavailabilityReason.RESERVADA
            : null,
    }));
  }

  /** El intervalo completo cae dentro del horario del área ese día (y no cruza la medianoche). */
  private isWithinSchedule(
    area: CommonAreaWithSchedules,
    dayOfWeek: number,
    startSeconds: number,
    endSeconds: number,
  ): boolean {
    const schedule = area.schedules.find((s) => s.dayOfWeek === dayOfWeek);
    return (
      schedule !== undefined &&
      startSeconds >= timeToSeconds(schedule.opensAt) &&
      endSeconds <= timeToSeconds(schedule.closesAt)
    );
  }
}
