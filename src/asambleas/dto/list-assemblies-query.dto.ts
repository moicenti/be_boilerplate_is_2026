import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { AssemblyStatus } from '../domain/assembly-status.js';

const trimToUndefined = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class ListAssembliesQueryDto {
  @ApiPropertyOptional({ description: 'Busca por título o folio.' })
  @Transform(trimToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ enum: Object.values(AssemblyStatus) })
  @Transform(trimToUndefined)
  @IsOptional()
  @IsIn(Object.values(AssemblyStatus), { message: 'El estado no es válido.' })
  estado?: AssemblyStatus;

  @ApiPropertyOptional({
    example: '2026-10-01',
    description: 'Reuniones desde este día.',
  })
  @Transform(trimToUndefined)
  @IsOptional()
  @Matches(DATE, {
    message: 'La fecha "desde" debe tener el formato AAAA-MM-DD.',
  })
  desde?: string;

  @ApiPropertyOptional({
    example: '2026-11-30',
    description: 'Reuniones hasta este día.',
  })
  @Transform(trimToUndefined)
  @IsOptional()
  @Matches(DATE, {
    message: 'La fecha "hasta" debe tener el formato AAAA-MM-DD.',
  })
  hasta?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero.' })
  @Min(1, { message: 'La página debe ser 1 o mayor.' })
  page: number = 1;
}
