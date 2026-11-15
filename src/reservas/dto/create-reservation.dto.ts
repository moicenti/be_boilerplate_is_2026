import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsInt, Matches, Min } from 'class-validator';

const ISO_WITH_OFFSET = /(Z|[+-]\d{2}:\d{2})$/;

export class CreateReservationDto {
  @ApiProperty({ example: 2 })
  @IsInt({ message: 'areaId debe ser un número entero' })
  @Min(1, { message: 'areaId debe ser un número entero positivo' })
  areaId!: number;

  @ApiProperty({ example: '2026-11-12T18:00:00-06:00' })
  @IsISO8601({ strict: true }, { message: 'inicio debe ser una fecha ISO 8601' })
  @Matches(ISO_WITH_OFFSET, { message: 'inicio debe indicar la zona horaria (Z o ±HH:mm)' })
  inicio!: string;

  @ApiProperty({ example: '2026-11-12T20:00:00-06:00' })
  @IsISO8601({ strict: true }, { message: 'fin debe ser una fecha ISO 8601' })
  @Matches(ISO_WITH_OFFSET, { message: 'fin debe indicar la zona horaria (Z o ±HH:mm)' })
  fin!: string;
}
