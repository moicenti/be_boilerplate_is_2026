import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReservationStatus, type Reservation, type Unit, type User } from '@PrismaClient';
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

    const unit = await this.unitOf(user);
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
        unitId: unit.id,
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

  async findMine(user: User): Promise<Reservation[]> {
    const unit = await this.unitOf(user);
    return this.reservationRepository.findAllByUnit(unit.id);
  }

  async cancel(reservationId: number, user: User): Promise<Reservation> {
    const unit = await this.unitOf(user);
    const reservation = await this.reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'RESERVA_INEXISTENTE', 'La reserva no existe.');
    }
    if (reservation.unitId !== unit.id) {
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

  // La unidad sale de la sesión (users.unit es el código de la unidad), nunca del request.
  private async unitOf(user: User): Promise<Unit> {
    const unit = user.unit ? await this.reservationRepository.findUnitByCode(user.unit) : null;
    if (!unit) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        'UNIDAD_NO_ASIGNADA',
        'Tu cuenta no tiene una unidad registrada; contacta a la administración.',
      );
    }
    return unit;
  }

  private notAllowed(mensaje: string): ApiException {
    return new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, 'FUERA_DE_HORARIO', mensaje);
  }

  private invalidTransition(mensaje: string): ApiException {
    return new ApiException(HttpStatus.CONFLICT, 'TRANSICION_INVALIDA', mensaje);
  }
}
