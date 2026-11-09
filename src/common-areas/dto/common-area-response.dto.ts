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

  @ApiProperty({ example: 'Torre A, nivel 1' })
  ubicacion!: string;

  @ApiProperty({ example: 2, description: 'Horas por bloque de reserva' })
  duracionBloque!: number;

  @ApiProperty({ example: 'No se permite música después de las 21:00.', nullable: true, type: String })
  condicionesUso!: string | null;

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
      ubicacion: area.location,
      duracionBloque: area.blockDurationHours,
      condicionesUso: area.usageConditions,
      ...(includeStatus ? { estado: area.status } : {}),
      horarios: area.schedules.map((schedule) => ({
        diaSemana: schedule.dayOfWeek,
        horaApertura: formatTime(schedule.opensAt),
        horaCierre: formatTime(schedule.closesAt),
      })),
    };
  }
}
