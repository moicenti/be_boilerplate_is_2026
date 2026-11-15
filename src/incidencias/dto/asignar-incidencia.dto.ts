import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Priority } from '@PrismaClient';

export class AsignarIncidenciaDto {
  @ApiProperty({ enum: Priority, example: Priority.ALTA })
  @IsEnum(Priority, { message: 'Prioridad inválida' })
  priority: Priority;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'assigneeId debe ser un UUID válido' })
  assigneeId: string;

  @ApiProperty({ format: 'date-time', example: '2026-11-20T18:00:00.000Z' })
  @IsDateString({}, { message: 'dueDate debe ser una fecha válida (ISO 8601)' })
  dueDate: string;

  @ApiProperty({
    required: false,
    description: 'Obligatoria si priority = CRITICA (10-200 caracteres)',
  })
  @ValidateIf((o) => o.priority === Priority.CRITICA)
  @IsString()
  @IsNotEmpty({ message: 'La justificación es obligatoria para prioridad Crítica' })
  @MinLength(10, { message: 'La justificación debe tener al menos 10 caracteres' })
  @MaxLength(200, { message: 'La justificación no puede exceder 200 caracteres' })
  @IsOptional()
  priorityJustification?: string;
}