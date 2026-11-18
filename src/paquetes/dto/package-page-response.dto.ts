import { ApiProperty } from '@nestjs/swagger';
import { PackageResponseDto } from './package-response.dto.js';

export class PackagePageResponseDto {
  @ApiProperty({ type: PackageResponseDto, isArray: true })
  items!: PackageResponseDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;

  @ApiProperty({ example: 4, description: 'Total con los filtros aplicados.' })
  total!: number;

  @ApiProperty({ example: 1 })
  totalPages!: number;

  @ApiProperty({
    example: 4,
    description: 'Paquetes pendientes de retiro en total.',
  })
  pendingCount!: number;

  @ApiProperty({
    example: 4,
    description: 'Destinatarios distintos con paquetes pendientes.',
  })
  pendingRecipientCount!: number;

  @ApiProperty({ example: ['DHL', 'Estafeta', 'FedEx'] })
  carriers!: string[];
}
