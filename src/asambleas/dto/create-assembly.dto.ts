import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDate,
  IsEnum,
  IsOptional,
  Length,
  ValidateNested,
} from 'class-validator';
import { RequiredText } from '@Common/decorators';
import { AssemblyModality, AssemblyType } from '@PrismaClient';
import { VotingTopicDto } from './voting-topic.dto.js';

export const MAX_TOPICS = 10;
export const MAX_AGENDA_ITEMS = 20;

export class AgendaItemDto {
  @ApiProperty({ example: 'Estado actual del jardín' })
  @RequiredText('El título del punto de agenda', 150)
  title!: string;

  @ApiPropertyOptional({ example: 'Revisar las zonas con riego irregular.' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @Length(0, 500, {
    message:
      'La descripción del punto de agenda no puede superar los 500 caracteres.',
  })
  description?: string;
}

export class CreateAssemblyDto {
  @ApiProperty({ example: 'Mejora del jardín central' })
  @RequiredText('El título', 150)
  title!: string;

  @ApiProperty({ enum: AssemblyType })
  @IsEnum(AssemblyType, { message: 'Selecciona el tipo de asamblea.' })
  type!: AssemblyType;

  @ApiProperty({ enum: AssemblyModality })
  @IsEnum(AssemblyModality, { message: 'Selecciona la modalidad.' })
  modality!: AssemblyModality;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-11-18T19:00:00-06:00',
  })
  @Type(() => Date)
  @IsDate({ message: 'La fecha y hora de inicio no son válidas.' })
  startsAt!: Date;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-11-18T20:30:00-06:00',
  })
  @Type(() => Date)
  @IsDate({ message: 'La hora de fin no es válida.' })
  endsAt!: Date;

  @ApiProperty({ example: 'Salón de eventos · Casa club · Los Olivos' })
  @RequiredText('El lugar', 150)
  location!: string;

  @ApiProperty({
    example: 'Convocamos a residentes a revisar la renovación del riego.',
  })
  @RequiredText('La descripción de la convocatoria', 2000, 'obligatoria')
  description!: string;

  @ApiProperty({ type: [AgendaItemDto] })
  @IsArray({ message: 'La agenda debe ser una lista.' })
  @ArrayMaxSize(MAX_AGENDA_ITEMS, {
    message: `La agenda admite como máximo ${MAX_AGENDA_ITEMS} puntos.`,
  })
  @ValidateNested({ each: true })
  @Type(() => AgendaItemDto)
  agenda!: AgendaItemDto[];

  @ApiProperty({ type: [VotingTopicDto] })
  @IsArray({ message: 'Las propuestas deben ser una lista.' })
  @ArrayMinSize(1, {
    message: 'La convocatoria necesita al menos una propuesta a votar.',
  })
  @ArrayMaxSize(MAX_TOPICS, {
    message: `La convocatoria admite como máximo ${MAX_TOPICS} propuestas.`,
  })
  @ValidateNested({ each: true })
  @Type(() => VotingTopicDto)
  topics!: VotingTopicDto[];
}
