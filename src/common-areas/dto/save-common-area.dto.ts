import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ScheduleDto } from './schedule.dto.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class SaveCommonAreaDto {
  @ApiProperty({ example: 'Salón social', maxLength: 100 })
  @Transform(trim)
  @IsString({ message: 'nombre debe ser texto' })
  @IsNotEmpty({ message: 'nombre es obligatorio' })
  @MaxLength(100, { message: 'nombre no puede exceder los 100 caracteres' })
  nombre!: string;

  @ApiProperty({ example: 40, description: 'Debe ser mayor a 0' })
  @IsInt({ message: 'capacidad debe ser un número entero' })
  capacidad!: number;

  @ApiProperty({ example: 'Torre A, nivel 1', maxLength: 150 })
  @Transform(trim)
  @IsString({ message: 'ubicacion debe ser texto' })
  @IsNotEmpty({ message: 'ubicacion es obligatoria' })
  @MaxLength(150, { message: 'ubicacion no puede exceder los 150 caracteres' })
  ubicacion!: string;

  @ApiProperty({
    example: 2,
    description: 'Horas por bloque de reserva. Mayor a 0 y no más largo que ningún horario del área',
  })
  @IsInt({ message: 'duracionBloque debe ser un número entero de horas' })
  duracionBloque!: number;

  @ApiPropertyOptional({
    example: 'No se permite música después de las 21:00.',
    maxLength: 1000,
    nullable: true,
  })
  // Texto vacío equivale a no indicar condiciones.
  @Transform(({ value }) => {
    const trimmed = trim({ value });
    return trimmed === '' ? null : trimmed;
  })
  @IsOptional()
  @IsString({ message: 'condicionesUso debe ser texto' })
  @MaxLength(1000, { message: 'condicionesUso no puede exceder los 1000 caracteres' })
  condicionesUso?: string | null;

  @ApiProperty({ type: [ScheduleDto] })
  @IsArray({ message: 'horarios debe ser una lista' })
  @ArrayMinSize(1, { message: 'Debe indicarse al menos un horario' })
  @ArrayMaxSize(7, { message: 'No puede haber más de 7 horarios (uno por día)' })
  @ValidateNested({ each: true })
  @Type(() => ScheduleDto)
  horarios!: ScheduleDto[];
}
