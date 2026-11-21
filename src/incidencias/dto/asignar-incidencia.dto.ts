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
  @ApiProperty({
    enum: Priority,
    example: Priority.ALTA,
    description: 'Prioridad del reporte',
  })
  @IsEnum(Priority, { message: 'Prioridad inválida' })
  priority: Priority;

  @ApiProperty({
    format: 'uuid',
    example: '3e459034-e612-49e9-a921-4b98069e96b2',
    description: 'ID del administrador responsable',
  })
  @IsUUID('4', { message: 'assigneeId debe ser un UUID válido' })
  assigneeId: string;

  @ApiProperty({
    format: 'date-time',
    example: '2026-11-20T18:00:00.000Z',
    description: 'Fecha compromiso de resolución',
  })
  @IsDateString({}, { message: 'dueDate debe ser una fecha válida (ISO 8601)' })
  dueDate: string;

  @ApiProperty({
    required: false,
    example: 'Fuga activa en área común, riesgo eléctrico.',
    description: 'Obligatoria si priority = CRITICA (10-200 caracteres)',
    minLength: 10,
    maxLength: 200,
  })
  @ValidateIf((o) => o.priority === Priority.CRITICA)
  @IsString()
  @IsNotEmpty({ message: 'La justificación es obligatoria para prioridad Crítica' })
  @MinLength(10, { message: 'La justificación debe tener al menos 10 caracteres' })
  @MaxLength(200, { message: 'La justificación no puede exceder 200 caracteres' })
  @IsOptional()
  priorityJustification?: string;
}