import { ApiProperty } from '@nestjs/swagger';
import type { DelinquencyPage } from '../services/index.js';

export class DelinquentUnitDto {
  @ApiProperty({ format: 'uuid' })
  unidadId!: string;

  @ApiProperty({ example: 'B-205' })
  codigoUnidad!: string;

  @ApiProperty({ example: 'Torre B' })
  torre!: string;

  @ApiProperty({
    example: 'jorge.salas@example.com',
    nullable: true,
    type: String,
    description:
      'Correo del residente activo más antiguo de la unidad; nulo si no tiene residentes.',
  })
  responsable!: string | null;

  @ApiProperty({
    example: '2026-09-10',
    description: 'Vencimiento más antiguo de sus cuotas vencidas',
  })
  enMoraDesde!: string;

  @ApiProperty({ example: 56, description: 'Hoy menos enMoraDesde' })
  diasAtraso!: number;

  @ApiProperty({
    example: 250.0,
    description: 'Suma de los saldos de sus cuotas vencidas',
  })
  montoAdeudado!: number;

  @ApiProperty({ example: 3 })
  cuotasVencidas!: number;
}

export class DelinquentUnitsPageResponseDto {
  @ApiProperty({ example: 14, description: 'Unidades en mora con los filtros' })
  total!: number;

  @ApiProperty({ example: 1 })
  pagina!: number;

  @ApiProperty({ example: 20 })
  tamano!: number;

  @ApiProperty({
    example: '2026-11-05',
    description: 'Fecha de corte (hoy en APP_TIMEZONE)',
  })
  fechaCorte!: string;

  @ApiProperty({ type: DelinquentUnitDto, isArray: true })
  items!: DelinquentUnitDto[];

  static fromPage(page: DelinquencyPage): DelinquentUnitsPageResponseDto {
    return {
      total: page.total,
      pagina: page.page,
      tamano: page.pageSize,
      fechaCorte: page.today,
      items: page.items.map((item) => ({
        unidadId: item.unitId,
        codigoUnidad: item.code,
        torre: item.tower,
        responsable: item.responsible,
        enMoraDesde: item.since,
        diasAtraso: item.daysLate,
        montoAdeudado: item.amountOwed.toNumber(),
        cuotasVencidas: item.overdueFees,
      })),
    };
  }
}
