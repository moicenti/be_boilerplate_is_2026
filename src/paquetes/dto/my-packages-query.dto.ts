import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { PackageStatus } from '@PrismaClient';

export class MyPackagesQueryDto {
  @ApiPropertyOptional({
    enum: PackageStatus,
    description: 'Sin estado se listan todos los paquetes de la unidad.',
  })
  @IsOptional()
  @IsEnum(PackageStatus, { message: 'El estado no es válido.' })
  estado?: PackageStatus;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero.' })
  @Min(1, { message: 'La página debe ser 1 o mayor.' })
  page: number = 1;
}
