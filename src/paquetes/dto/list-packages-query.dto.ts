import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PackageStatus } from '@PrismaClient';

const trimToUndefined = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

export class ListPackagesQueryDto {
  @ApiPropertyOptional({
    enum: PackageStatus,
    default: PackageStatus.PENDIENTE_RETIRO,
  })
  @IsOptional()
  @IsEnum(PackageStatus, { message: 'El estado no es válido.' })
  estado: PackageStatus = PackageStatus.PENDIENTE_RETIRO;

  @ApiPropertyOptional({
    example: 'A-304',
    description: 'Código exacto de la unidad.',
  })
  @Transform(trimToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(20)
  unidad?: string;

  @ApiPropertyOptional({ example: 'PAQ-2026-0187' })
  @Transform(trimToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(30)
  folio?: string;

  @ApiPropertyOptional({ example: 'DHL' })
  @Transform(trimToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(60)
  empresa?: string;

  @ApiPropertyOptional({
    example: 'Ana',
    description: 'Busca por folio, nombre del destinatario o unidad.',
  })
  @Transform(trimToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero.' })
  @Min(1, { message: 'La página debe ser 1 o mayor.' })
  page: number = 1;
}
