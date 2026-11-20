import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Priority } from '@PrismaClient';

export class FilterIncidenciaDto {
  @ApiProperty({
    required: false,
    example: 'En atención',
    description: 'Filtrar por estado',
    enum: ['Abierto', 'En atención', 'Rechazado', 'Resuelto', 'Cerrado'],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({
    required: false,
    enum: Priority,
    example: Priority.ALTA,
    description: 'Filtrar por prioridad',
  })
  @IsOptional()
  @IsEnum(Priority, { message: 'Prioridad inválida' })
  priority?: Priority;

  @ApiProperty({
    required: false,
    example: 'A-19',
    description: 'Filtrar por unidad',
  })
  @IsOptional()
  @IsString()
  unit?: string;
}