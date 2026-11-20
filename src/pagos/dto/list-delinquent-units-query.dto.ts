import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const DELINQUENCY_SORT_FIELDS = [
  'unidad',
  'responsable',
  'enMoraDesde',
  'diasAtraso',
  'montoAdeudado',
  'cuotasVencidas',
] as const;
export type DelinquencySortField = (typeof DELINQUENCY_SORT_FIELDS)[number];

/** Campo ascendente, o con `-` delante para descendente. */
export const DELINQUENCY_SORTS = DELINQUENCY_SORT_FIELDS.flatMap((field) => [
  field,
  `-${field}`,
]);

export const MAX_DELINQUENCY_PAGE_SIZE = 100;

const trimToUndefined = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

export class ListDelinquentUnitsQueryDto {
  @ApiPropertyOptional({
    example: 'Torre A',
    description: 'Torre exacta, sin distinguir mayúsculas.',
  })
  @Transform(trimToUndefined)
  @IsOptional()
  @IsString({ message: 'torre debe ser texto' })
  @MaxLength(100, { message: 'torre admite hasta 100 caracteres' })
  torre?: string;

  @ApiPropertyOptional({
    example: 30,
    minimum: 0,
    description: 'Solo unidades con al menos estos días de atraso.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'antiguedadMinDias debe ser un número entero' })
  @Min(0, { message: 'antiguedadMinDias debe ser 0 o mayor' })
  @Max(36500, { message: 'antiguedadMinDias es demasiado grande' })
  antiguedadMinDias?: number;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'pagina debe ser un número entero' })
  @Min(1, { message: 'pagina debe ser 1 o mayor' })
  pagina: number = 1;

  @ApiPropertyOptional({
    default: 20,
    minimum: 1,
    maximum: MAX_DELINQUENCY_PAGE_SIZE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'tamano debe ser un número entero' })
  @Min(1, {
    message: `tamano debe estar entre 1 y ${MAX_DELINQUENCY_PAGE_SIZE}`,
  })
  @Max(MAX_DELINQUENCY_PAGE_SIZE, {
    message: `tamano debe estar entre 1 y ${MAX_DELINQUENCY_PAGE_SIZE}`,
  })
  tamano: number = 20;

  @ApiPropertyOptional({
    enum: DELINQUENCY_SORTS,
    default: '-diasAtraso',
    description:
      'Campo por el que ordenar; con `-` delante, descendente. Empata por código de unidad.',
  })
  @IsOptional()
  @IsIn(DELINQUENCY_SORTS, {
    message: `orden debe ser uno de: ${DELINQUENCY_SORTS.join(', ')}`,
  })
  orden: string = '-diasAtraso';
}
