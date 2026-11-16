import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePreautorizacionDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del visitante es obligatorio' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  nombreVisitante: string;

  @ApiProperty({ example: '12345678' })
  @IsString()
  @IsNotEmpty({ message: 'El documento es obligatorio' })
  @MaxLength(20)
  documento: string;

  @ApiProperty({ example: '2026-11-15T10:00:00.000Z' })
  @IsDateString({}, { message: 'La fecha de inicio debe ser válida' })
  inicio: string;

  @ApiProperty({ example: '2026-11-15T18:00:00.000Z' })
  @IsDateString({}, { message: 'La fecha de fin debe ser válida' })
  fin: string;

  @ApiProperty({ example: 2, minimum: 0, maximum: 5 })
  @IsInt({ message: 'Los acompañantes deben ser un número entero' })
  @Min(0, { message: 'Los acompañantes no pueden ser negativos' })
  @Max(5, { message: 'No puedes autorizar más de 5 acompañantes' })
  acompanantes: number;

  @ApiProperty({ required: false, example: 'Entrega de paquetería' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  motivo?: string;
}