import { ApiProperty } from '@nestjs/swagger';
import { UnavailabilityReason } from '../constants.js';
import type { AreaAvailability } from '../services/index.js';

export class AreaAvailabilityDto {
  @ApiProperty({ example: 2 })
  areaId!: number;

  @ApiProperty({ example: 'Salón social' })
  nombre!: string;

  @ApiProperty({ example: 40 })
  capacidad!: number;

  @ApiProperty({ example: false })
  disponible!: boolean;

  @ApiProperty({
    enum: Object.values(UnavailabilityReason),
    nullable: true,
    example: UnavailabilityReason.RESERVADA,
    description: 'null cuando el área está disponible',
  })
  motivo!: UnavailabilityReason | null;
}

export class AvailabilityResponseDto {
  @ApiProperty({ example: '2026-11-14' })
  fecha!: string;

  @ApiProperty({ example: '18:00' })
  hora!: string;

  @ApiProperty({ type: [AreaAvailabilityDto] })
  areas!: AreaAvailabilityDto[];

  static from(fecha: string, hora: string, results: AreaAvailability[]): AvailabilityResponseDto {
    return {
      fecha,
      hora,
      areas: results.map(({ area, reason }) => ({
        areaId: area.id,
        nombre: area.name,
        capacidad: area.capacity,
        disponible: reason === null,
        motivo: reason,
      })),
    };
  }
}
