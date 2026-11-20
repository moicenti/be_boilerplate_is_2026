import { ApiProperty } from '@nestjs/swagger';
import { FeeStatus } from '@PrismaClient';
import { toZonedIso } from '@CommonAreas/utils';
import type { RecordedPayment } from '../repositories/index.js';

export class AppliedFeeDto {
  @ApiProperty({ example: 301 })
  cuotaId!: number;

  @ApiProperty({ example: 100.0, description: '0 si el monto no alcanzó para esta cuota' })
  montoAplicado!: number;

  @ApiProperty({ enum: FeeStatus, example: FeeStatus.PAGADA })
  estadoResultante!: FeeStatus;
}

export class PaymentResponseDto {
  @ApiProperty({ example: 78 })
  pagoId!: number;

  @ApiProperty({ example: '2026-11-05T10:35:00-06:00', description: 'Hora local del condominio' })
  fechaPago!: string;

  @ApiProperty({ type: [AppliedFeeDto], description: 'Por fecha de vencimiento ascendente' })
  aplicado!: AppliedFeeDto[];

  @ApiProperty({ example: 50.0, description: 'Saldo total de la unidad después del pago' })
  saldoRestante!: number;

  static fromRecord(record: RecordedPayment, timeZone: string): PaymentResponseDto {
    return {
      pagoId: record.paymentId,
      fechaPago: toZonedIso(record.paidAt, timeZone),
      aplicado: record.allocations.map((a) => ({
        cuotaId: a.feeId,
        montoAplicado: a.amount.toNumber(),
        estadoResultante: a.resultingStatus,
      })),
      saldoRestante: record.unitBalance.toNumber(),
    };
  }
}
