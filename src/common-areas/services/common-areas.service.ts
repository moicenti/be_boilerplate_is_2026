import { HttpStatus, Injectable } from '@nestjs/common';
import { CommonAreaChangeField, type User } from '@PrismaClient';
import { ApiException } from '@Common/errors';
import {
  CommonAreaRepository,
  type CommonAreaChangeData,
  type CommonAreaWithSchedules,
  type SaveCommonAreaData,
} from '../repositories/index.js';
import { CommonAreaNameTakenError } from '../errors/index.js';
import type { SaveCommonAreaDto, ScheduleDto } from '../dto/index.js';
import { formatTime, parseTime } from '../utils/time.js';
import { BLOCKING_RESERVATION_STATUSES } from '../constants.js';

type ScheduleSnapshot = { diaSemana: number; horaApertura: string; horaCierre: string };

@Injectable()
export class CommonAreasService {
  constructor(private readonly commonAreaRepository: CommonAreaRepository) {}

  findAll(): Promise<CommonAreaWithSchedules[]> {
    return this.commonAreaRepository.findAllActive();
  }

  async findOne(id: number): Promise<CommonAreaWithSchedules> {
    const area = await this.commonAreaRepository.findActiveById(id);
    if (!area) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'AREA_INEXISTENTE',
        'El área común no existe.',
      );
    }
    return area;
  }

  async create(dto: SaveCommonAreaDto): Promise<CommonAreaWithSchedules> {
    this.validateBusinessRules(dto);
    await this.ensureNameAvailable(dto.nombre);

    try {
      return await this.commonAreaRepository.create(this.toData(dto));
    } catch (error) {
      throw this.translateError(error);
    }
  }

  async update(
    id: number,
    dto: SaveCommonAreaDto,
    user: User,
  ): Promise<CommonAreaWithSchedules> {
    const current = await this.findOne(id);
    this.validateBusinessRules(dto);
    await this.ensureNameAvailable(dto.nombre, id);

    try {
      return await this.commonAreaRepository.update(
        id,
        this.toData(dto),
        this.detectChanges(current, dto),
        user.id,
      );
    } catch (error) {
      throw this.translateError(error);
    }
  }

  async remove(id: number, user: User): Promise<void> {
    await this.findOne(id);

    const now = new Date();
    const upcoming = await this.commonAreaRepository.countUpcomingReservations(
      id,
      BLOCKING_RESERVATION_STATUSES,
      now,
    );
    if (upcoming > 0) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        'AREA_DUPLICADA',
        `No se puede eliminar el área: tiene ${upcoming} reserva(s) pendiente(s) o confirmada(s) por realizarse.`,
      );
    }

    await this.commonAreaRepository.softDelete(id, user.id, now);
  }

  private validateBusinessRules({ capacidad, horarios }: SaveCommonAreaDto): void {
    if (capacidad <= 0) {
      throw this.invalidData('La capacidad debe ser mayor a 0.');
    }

    const seenDays = new Set<number>();
    for (const schedule of horarios) {
      if (seenDays.has(schedule.diaSemana)) {
        throw this.invalidData(
          `Hay más de un horario para el día ${schedule.diaSemana}; solo se permite uno por día.`,
        );
      }
      seenDays.add(schedule.diaSemana);

      // "HH:mm" con ceros a la izquierda se compara bien como texto.
      if (schedule.horaCierre <= schedule.horaApertura) {
        throw this.invalidData(
          `La hora de cierre debe ser posterior a la de apertura (día ${schedule.diaSemana}).`,
        );
      }
    }
  }

  private async ensureNameAvailable(name: string, excludeId?: number): Promise<void> {
    if (await this.commonAreaRepository.existsActiveByName(name, excludeId)) {
      throw this.duplicateName(name);
    }
  }

  private detectChanges(
    current: CommonAreaWithSchedules,
    dto: SaveCommonAreaDto,
  ): CommonAreaChangeData[] {
    const changes: CommonAreaChangeData[] = [];

    if (current.capacity !== dto.capacidad) {
      changes.push({
        field: CommonAreaChangeField.CAPACIDAD,
        previousValue: current.capacity,
        newValue: dto.capacidad,
      });
    }

    const previousSchedules = this.normalizeSchedules(
      current.schedules.map((schedule) => ({
        diaSemana: schedule.dayOfWeek,
        horaApertura: formatTime(schedule.opensAt),
        horaCierre: formatTime(schedule.closesAt),
      })),
    );
    const newSchedules = this.normalizeSchedules(dto.horarios);
    if (JSON.stringify(previousSchedules) !== JSON.stringify(newSchedules)) {
      changes.push({
        field: CommonAreaChangeField.HORARIOS,
        previousValue: previousSchedules,
        newValue: newSchedules,
      });
    }

    return changes;
  }

  /** Copia ordenada por día y con claves en orden fijo, para comparar y guardar. */
  private normalizeSchedules(schedules: ScheduleDto[]): ScheduleSnapshot[] {
    return schedules
      .map(({ diaSemana, horaApertura, horaCierre }) => ({ diaSemana, horaApertura, horaCierre }))
      .sort((a, b) => a.diaSemana - b.diaSemana);
  }

  private toData(dto: SaveCommonAreaDto): SaveCommonAreaData {
    return {
      name: dto.nombre,
      capacity: dto.capacidad,
      schedules: dto.horarios.map((schedule) => ({
        dayOfWeek: schedule.diaSemana,
        opensAt: parseTime(schedule.horaApertura),
        closesAt: parseTime(schedule.horaCierre),
      })),
    };
  }

  private translateError(error: unknown): unknown {
    // Carrera entre la verificación previa y el insert: lo resuelve el índice único.
    if (error instanceof CommonAreaNameTakenError) {
      return this.duplicateName(error.areaName);
    }
    return error;
  }

  private invalidData(mensaje: string): ApiException {
    return new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, 'DATOS_INVALIDOS', mensaje);
  }

  private duplicateName(name: string): ApiException {
    return new ApiException(
      HttpStatus.CONFLICT,
      'AREA_DUPLICADA',
      `Ya existe un área común activa llamada "${name}".`,
    );
  }
}
