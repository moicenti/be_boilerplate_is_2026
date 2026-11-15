import { ApiProperty } from '@nestjs/swagger';
import { PackageResponseDto } from './package-response.dto.js';

export class MyPackagePageResponseDto {
  @ApiProperty({ type: PackageResponseDto, isArray: true })
  items!: PackageResponseDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;

  @ApiProperty({ example: 6, description: 'Total con el filtro aplicado.' })
  total!: number;

  @ApiProperty({ example: 1 })
  totalPages!: number;

  @ApiProperty({
    example: 2,
    description: 'Paquetes pendientes de retiro de la unidad.',
  })
  pendingCount!: number;
}
