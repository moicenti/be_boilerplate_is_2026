import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReservationStatus, type Reservation, type User } from '@PrismaClient';
import type { EnvConfig } from '@Config';
import { ApiException } from '@Common/errors';
import { CommonAreasService } from '@CommonAreas/services';
import { formatTime, timeToSeconds, toZonedParts } from '@CommonAreas/utils';
import { ReservationRepository } from '../repositories/index.js';
import { ReservationOverlapError } from '../errors/index.js';
import type { CreateReservationDto } from '../dto/index.js';

const DAY_NAMES = ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'];

@Injectable()
export class ReservationsService {
  private readonly timeZone: string;

  constructor(
    private readonly reservationRepository: ReservationRepository,
    private readonly commonAreasService: CommonAreasService,
    configService: ConfigService<EnvConfig, true>,
  ) {
    this.timeZone = configService.get('APP_TIMEZONE', { infer: true });
  }

  async create(dto: CreateReservationDto, user: User): Promise<Reservation> {
    const startsAt = new Date(dto.inicio);
    const endsAt = new Date(dto.fin);
    if (endsAt <= startsAt) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'SOLICITUD_INVALIDA',
        'El fin de la reserva debe ser posterior al inicio.',
      );
    }

    const unitId = this.unitOf(user);
    const area = await this.commonAreasService.findOne(dto.areaId);

    if (startsAt <= new Date()) {
      throw this.notAllowed('No se puede reservar en una fecha u hora pasada.');
    }

    const start = toZonedParts(startsAt, this.timeZone);
    const end = toZonedParts(endsAt, this.timeZone);
    if (start.date !== end.date) {
      throw this.notAllowed('La reserva debe empezar y terminar el mismo día.');
    }
    const schedule = area.schedules.find((s) => s.dayOfWeek === start.dayOfWeek);
    if (!schedule) {
      throw this.notAllowed(`El área no abre los ${DAY_NAMES[start.dayOfWeek]}.`);
    }
    if (
      start.secondsOfDay < timeToSeconds(schedule.opensAt) ||
      end.secondsOfDay > timeToSeconds(schedule.closesAt)
    ) {
      throw this.notAllowed(
        `La reserva debe quedar dentro del horario del área los ${DAY_NAMES[start.dayOfWeek]} ` +
          `(${formatTime(schedule.opensAt)} a ${formatTime(schedule.closesAt)}, hora local).`,
      );
    }
    if (await this.reservationRepository.hasOverlappingBlock(area.id, startsAt, endsAt)) {
      throw this.notAllowed('El área está bloqueada en ese horario.');
    }

    // Sin verificación previa de cruces: la restricción de exclusión decide, también ante
    // dos requests simultáneos.
    try {
      return await this.reservationRepository.create({
        areaId: area.id,
        residentId: user.id,
        unitId,
        startsAt,
        endsAt,
      });
    } catch (error) {
      if (error instanceof ReservationOverlapError) {
        throw new ApiException(
          HttpStatus.CONFLICT,
          'RESERVA_CRUZADA',
          'El espacio ya está reservado en ese horario.',
        );
      }
      throw error;
    }
  }

  findMine(user: User): Promise<Reservation[]> {
    return this.reservationRepository.findAllByUnit(this.unitOf(user));
  }

  async cancel(reservationId: number, user: User): Promise<Reservation> {
    const unitId = this.unitOf(user);
    const reservation = await this.reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'RESERVA_INEXISTENTE', 'La reserva no existe.');
    }
    if (reservation.unitId !== unitId) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        'RECURSO_AJENO',
        'Solo puedes cancelar reservas de tu unidad.',
      );
    }

    const now = new Date();
    if (reservation.status === ReservationStatus.CANCELADA) {
      throw this.invalidTransition('La reserva ya está cancelada.');
    }
    if (reservation.endsAt <= now) {
      throw this.invalidTransition('La reserva ya terminó; se conserva en el historial.');
    }

    const cancelled = await this.reservationRepository.cancel(reservationId, now);
    if (!cancelled) throw this.invalidTransition('Esta reserva ya no se puede cancelar.');
    return cancelled;
  }

  // La unidad sale de la sesión, nunca del request.
  private unitOf(user: User): string {
    if (!user.unitId) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        'UNIDAD_NO_ASIGNADA',
        'Tu cuenta no tiene una unidad registrada; contacta a la administración.',
      );
    }
    return user.unitId;
  }

  private notAllowed(mensaje: string): ApiException {
    return new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, 'FUERA_DE_HORARIO', mensaje);
  }

  private invalidTransition(mensaje: string): ApiException {
    return new ApiException(HttpStatus.CONFLICT, 'TRANSICION_INVALIDA', mensaje);
  }
}
