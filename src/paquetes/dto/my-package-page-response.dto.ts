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

  @ApiProperty({
    example: { TODOS: 5, PENDIENTE_RETIRO: 2, ENTREGADO: 3 },
    description: 'Paquetes de la unidad por estado, sin aplicar la búsqueda.',
  })
  counts!: { TODOS: number; PENDIENTE_RETIRO: number; ENTREGADO: number };
}
