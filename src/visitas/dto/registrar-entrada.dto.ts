import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegistrarEntradaDto {
  @ApiProperty({
    required: false,
    description: 'ID de la pre-autorización si el visitante está autorizado',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: 'preautorizacionId debe ser un UUID válido' })
  preautorizacionId?: string;

  @ApiProperty({
    required: false,
    example: 'Juan Pérez',
    description: 'Nombre completo del visitante (obligatorio sin pre-autorización)',
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  nombreVisitante?: string;

  @ApiProperty({
    required: false,
    example: '12345678',
    description: 'Documento de identidad (obligatorio sin pre-autorización)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  documento?: string;

  @ApiProperty({
    required: false,
    example: 2,
    minimum: 0,
    maximum: 5,
    description: 'Acompañantes (solo sin pre-autorización)',
  })
  @IsOptional()
  @IsInt()
  @Min(0, { message: 'Los acompañantes no pueden ser negativos' })
  @Max(5, { message: 'No puedes registrar más de 5 acompañantes' })
  acompanantes?: number;

  @ApiProperty({
    required: false,
    example: 'A-19',
    description: 'Código de la unidad a visitar (solo sin pre-autorización)',
  })
  @IsOptional()
  @IsString()
  unidadCode?: string;

  @ApiProperty({
    required: false,
    example: 'Entrega urgente sin pre-autorización',
    minLength: 10,
    maxLength: 200,
    description: 'Motivo de la visita sin autorización',
  })
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'El motivo debe tener al menos 10 caracteres' })
  @MaxLength(200, { message: 'El motivo no puede exceder 200 caracteres' })
  motivo?: string;
}