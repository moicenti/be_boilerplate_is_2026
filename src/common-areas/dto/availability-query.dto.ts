import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsISO8601, IsInt, IsOptional, Matches, Max, Min } from 'class-validator';
import { TIME_PATTERN } from './schedule.dto.js';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Los query params llegan como texto; uno vacío (`areaId=`) equivale a no enviarlo. */
const toOptionalNumber = ({ value }: { value: unknown }) =>
  value === undefined || value === '' ? undefined : Number(value);

export class AvailabilityQueryDto {
  @ApiProperty({ example: '2026-11-14', description: 'Fecha local del condominio (AAAA-MM-DD)' })
  @Matches(DATE_PATTERN, { message: 'fecha debe tener el formato AAAA-MM-DD' })
  @IsISO8601({ strict: true }, { message: 'fecha debe ser una fecha válida' })
  fecha!: string;

  @ApiProperty({ example: '18:00', description: 'Hora local de inicio (HH:mm)' })
  @Matches(TIME_PATTERN, { message: 'hora debe tener el formato HH:mm' })
  hora!: string;

  @ApiPropertyOptional({ example: 60, default: 60, minimum: 1, maximum: 1440 })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt({ message: 'duracionMin debe ser un número entero de minutos' })
  @Min(1, { message: 'duracionMin debe ser de al menos 1 minuto' })
  @Max(1440, { message: 'duracionMin no puede superar 1440 minutos (un día)' })
  duracionMin?: number;

  @ApiPropertyOptional({ example: 2, description: 'Limita la consulta a una sola área' })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt({ message: 'areaId debe ser un número entero' })
  @Min(1, { message: 'areaId debe ser un número entero positivo' })
  areaId?: number;
}
