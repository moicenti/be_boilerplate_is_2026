import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ScheduleDto } from './schedule.dto.js';

export class SaveCommonAreaDto {
  @ApiProperty({ example: 'Salón social', maxLength: 100 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'nombre debe ser texto' })
  @IsNotEmpty({ message: 'nombre es obligatorio' })
  @MaxLength(100, { message: 'nombre no puede exceder los 100 caracteres' })
  nombre!: string;

  @ApiProperty({ example: 40, description: 'Debe ser mayor a 0' })
  @IsInt({ message: 'capacidad debe ser un número entero' })
  capacidad!: number;

  @ApiProperty({ type: [ScheduleDto] })
  @IsArray({ message: 'horarios debe ser una lista' })
  @ArrayMinSize(1, { message: 'Debe indicarse al menos un horario' })
  @ArrayMaxSize(7, { message: 'No puede haber más de 7 horarios (uno por día)' })
  @ValidateNested({ each: true })
  @Type(() => ScheduleDto)
  horarios!: ScheduleDto[];
}
