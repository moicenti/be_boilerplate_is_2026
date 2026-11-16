import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDate,
  IsString,
  Length,
} from 'class-validator';
import { RequiredText } from '@Common/decorators';

export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 10;

export class VotingTopicDto {
  @ApiProperty({ example: 'Renovar el sistema de riego del jardín central' })
  @RequiredText('El título de la propuesta', 150)
  title!: string;

  @ApiProperty({
    example: 'Sustituir los aspersores dañados e instalar un programador.',
  })
  @RequiredText('La descripción de la propuesta', 1000, 'obligatoria')
  description!: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-11-18T20:30:00-06:00',
  })
  @Type(() => Date)
  @IsDate({ message: 'La apertura de la votación no es una fecha válida.' })
  opensAt!: Date;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-11-21T20:00:00-06:00',
  })
  @Type(() => Date)
  @IsDate({ message: 'El cierre de la votación no es una fecha válida.' })
  closesAt!: Date;

  @ApiProperty({
    type: [String],
    example: ['A favor', 'En contra', 'Abstención'],
  })
  @IsArray({ message: 'Las opciones deben ser una lista.' })
  @ArrayMinSize(MIN_OPTIONS, {
    message: `Cada propuesta necesita al menos ${MIN_OPTIONS} opciones.`,
  })
  @ArrayMaxSize(MAX_OPTIONS, {
    message: `Cada propuesta admite como máximo ${MAX_OPTIONS} opciones.`,
  })
  @Transform(({ value }: { value: unknown }) =>
    Array.isArray(value)
      ? value.map((v) => (typeof v === 'string' ? v.trim() : v))
      : value,
  )
  @IsString({ each: true, message: 'Cada opción debe ser texto.' })
  @Length(1, 80, {
    each: true,
    message: 'Cada opción debe tener entre 1 y 80 caracteres.',
  })
  options!: string[];
}
