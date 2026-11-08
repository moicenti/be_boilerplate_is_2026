import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CommonAreaBlock, User } from '@PrismaClient';
import type { EnvConfig } from '@Config';
import { ApiException } from '@Common/errors';
import { CommonAreaBlockRepository } from '../repositories/index.js';
import { BlockOverlapError } from '../errors/index.js';
import type { CreateBlockDto } from '../dto/index.js';
import { BLOCKING_RESERVATION_STATUSES } from '../constants.js';
import { formatTime, timeToSeconds, toZonedParts } from '../utils/time.js';
import { CommonAreasService } from './common-areas.service.js';

const DAY_NAMES = ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'];

@Injectable()
export class CommonAreaBlocksService {
  private readonly timeZone: string;

  constructor(
    private readonly blockRepository: CommonAreaBlockRepository,
    private readonly commonAreasService: CommonAreasService,
    configService: ConfigService<EnvConfig, true>,
  ) {
    this.timeZone = configService.get('APP_TIMEZONE', { infer: true });
  }

  async findAll(areaId: number): Promise<CommonAreaBlock[]> {
    await this.commonAreasService.findOne(areaId);
    return this.blockRepository.findAllByArea(areaId);
  }

  async create(areaId: number, dto: CreateBlockDto, user: User): Promise<CommonAreaBlock> {
    const area = await this.commonAreasService.findOne(areaId);
    const startsAt = new Date(dto.inicio);
    const endsAt = new Date(dto.fin);

    if (endsAt <= startsAt) {
      throw this.error(HttpStatus.UNPROCESSABLE_ENTITY, 'DATOS_INVALIDOS', 'El fin del bloqueo debe ser posterior al inicio.');
    }
    if (startsAt <= new Date()) {
      throw this.error(HttpStatus.UNPROCESSABLE_ENTITY, 'DATOS_INVALIDOS', 'No se pueden crear bloqueos que empiecen en el pasado.');
    }

    const start = toZonedParts(startsAt, this.timeZone);
    const end = toZonedParts(endsAt, this.timeZone);
    if (start.date !== end.date) {
      throw this.outsideSchedule('El bloqueo debe empezar y terminar el mismo día.');
    }

    const schedule = area.schedules.find((s) => s.dayOfWeek === start.dayOfWeek);
    if (!schedule) {
      throw this.outsideSchedule(`El área no abre los ${DAY_NAMES[start.dayOfWeek]}.`);
    }
    if (
      start.secondsOfDay < timeToSeconds(schedule.opensAt) ||
      end.secondsOfDay > timeToSeconds(schedule.closesAt)
    ) {
      throw this.outsideSchedule(
        `El bloqueo debe quedar dentro del horario del área los ${DAY_NAMES[start.dayOfWeek]} ` +
          `(${formatTime(schedule.opensAt)} a ${formatTime(schedule.closesAt)}, hora local).`,
      );
    }

    if (await this.blockRepository.hasOverlappingBlock(areaId, startsAt, endsAt)) {
      throw this.overlap();
    }

    const reservations = await this.blockRepository.countOverlappingReservations(
      areaId,
      BLOCKING_RESERVATION_STATUSES,
      startsAt,
      endsAt,
    );
    if (reservations > 0) {
      throw this.error(
        HttpStatus.CONFLICT,
        'BLOQUEO_CON_RESERVAS',
        `No se puede bloquear: hay ${reservations} reserva(s) pendiente(s) o confirmada(s) en ese horario.`,
      );
    }

    try {
      return await this.blockRepository.create({
        areaId,
        startsAt,
        endsAt,
        reason: dto.motivo,
        createdById: user.id,
      });
    } catch (error) {
      if (error instanceof BlockOverlapError) throw this.overlap();
      throw error;
    }
  }

  async remove(areaId: number, blockId: number): Promise<void> {
    await this.commonAreasService.findOne(areaId);

    const block = await this.blockRepository.findByIdAndArea(blockId, areaId);
    if (!block) {
      throw this.error(HttpStatus.NOT_FOUND, 'BLOQUEO_INEXISTENTE', 'El bloqueo no existe.');
    }
    if (block.endsAt <= new Date()) {
      throw this.error(
        HttpStatus.CONFLICT,
        'TRANSICION_INVALIDA',
        'El bloqueo ya terminó; se conserva como historial y no se puede eliminar.',
      );
    }

    await this.blockRepository.deleteById(blockId);
  }

  private outsideSchedule(mensaje: string): ApiException {
    return this.error(HttpStatus.UNPROCESSABLE_ENTITY, 'BLOQUEO_FUERA_DE_HORARIO', mensaje);
  }

  private overlap(): ApiException {
    return this.error(
      HttpStatus.CONFLICT,
      'BLOQUEO_SUPERPUESTO',
      'El bloqueo se superpone con otro bloqueo de la misma área.',
    );
  }

  private error(status: HttpStatus, codigo: string, mensaje: string): ApiException {
    return new ApiException(status, codigo, mensaje);
  }
}
