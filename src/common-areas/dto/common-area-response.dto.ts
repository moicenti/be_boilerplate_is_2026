import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { CommonAreaStatus } from '@PrismaClient';
import { ScheduleDto } from './schedule.dto.js';
import type { CommonAreaWithSchedules } from '../repositories/index.js';
import { formatTime } from '../utils/time.js';

export class CommonAreaResponseDto {
  @ApiProperty({ example: 2 })
  id!: number;

  @ApiProperty({ example: 'Salón social' })
  nombre!: string;

  @ApiProperty({ example: 40 })
  capacidad!: number;

  @ApiPropertyOptional({ enum: ['ACTIVA', 'ELIMINADA'] })
  estado?: CommonAreaStatus;

  @ApiProperty({ type: [ScheduleDto] })
  horarios!: ScheduleDto[];

  static fromEntity(
    area: CommonAreaWithSchedules,
    { includeStatus = false } = {},
  ): CommonAreaResponseDto {
    return {
      id: area.id,
      nombre: area.name,
      capacidad: area.capacity,
      ...(includeStatus ? { estado: area.status } : {}),
      horarios: area.schedules.map((schedule) => ({
        diaSemana: schedule.dayOfWeek,
        horaApertura: formatTime(schedule.opensAt),
        horaCierre: formatTime(schedule.closesAt),
      })),
    };
  }
}
