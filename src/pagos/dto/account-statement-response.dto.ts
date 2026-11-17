import { ApiProperty } from '@nestjs/swagger';
import { FeeStatus } from '@PrismaClient';
import { toZonedIso } from '@CommonAreas/utils';
import type { AccountStatement } from '../services/index.js';

export class StatementFeeDto {
  @ApiProperty({ example: 301 })
  id!: number;

  @ApiProperty({ example: '2026-11' })
  periodo!: string;

  @ApiProperty({ example: 'Mantenimiento' })
  concepto!: string;

  @ApiProperty({ example: 100.0 })
  monto!: number;

  @ApiProperty({ example: '2026-11-10' })
  fechaVencimiento!: string;

  @ApiProperty({ enum: FeeStatus, example: FeeStatus.PENDIENTE })
  estado!: FeeStatus;

  @ApiProperty({ example: 100.0, description: 'Monto menos la suma de sus pagos' })
  saldo!: number;
}

export class StatementPaymentDto {
  @ApiProperty({ example: 55, description: 'Id de lo aplicado a la cuota' })
  id!: number;

  @ApiProperty({ example: 78, description: 'Pago al que pertenece; uno puede cubrir varias cuotas' })
  pagoId!: number;

  @ApiProperty({ example: 300 })
  cuotaId!: number;

  @ApiProperty({ example: 50.0 })
  monto!: number;

  @ApiProperty({ example: '2026-10-08T10:35:00-06:00', description: 'Hora local del condominio' })
  fechaPago!: string;
}

export class AccountStatementResponseDto {
  @ApiProperty({ format: 'uuid' })
  unidadId!: string;

  @ApiProperty({ example: 150.0, description: 'Suma de los saldos de las cuotas no anuladas' })
  saldoTotal!: number;

  @ApiProperty({ type: [StatementFeeDto], description: 'Por fecha de vencimiento descendente' })
  cuotas!: StatementFeeDto[];

  @ApiProperty({ type: [StatementPaymentDto], description: 'Del más reciente al más antiguo' })
  pagos!: StatementPaymentDto[];

  static fromStatement(statement: AccountStatement, timeZone: string): AccountStatementResponseDto {
    return {
      unidadId: statement.unitId,
      saldoTotal: statement.total.toNumber(),
      cuotas: statement.fees.map((fee) => ({
        id: fee.id,
        periodo: fee.period,
        concepto: fee.concept,
        monto: fee.amount.toNumber(),
        // Columna DATE: llega como medianoche UTC.
        fechaVencimiento: fee.dueDate.toISOString().slice(0, 10),
        estado: fee.status,
        saldo: fee.balance.toNumber(),
      })),
      pagos: statement.payments.map((line) => ({
        id: line.id,
        pagoId: line.paymentId,
        cuotaId: line.feeId,
        monto: line.amount.toNumber(),
        fechaPago: toZonedIso(line.paidAt, timeZone),
      })),
    };
  }
}
