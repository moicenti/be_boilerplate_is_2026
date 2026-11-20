import type { Prisma } from '@PrismaClient';

/** Por qué no se puede aplicar un pago a las cuotas elegidas. */
export type PaymentPlanFailure =
  | 'CUOTA_INEXISTENTE'
  | 'CUOTA_YA_PAGADA'
  | 'MONTO_EXCEDE_DEUDA';

export class PaymentPlanError extends Error {
  constructor(
    public readonly reason: PaymentPlanFailure,
    /** Cuotas que causan el error (inexistentes o ya cerradas). */
    public readonly feeIds: number[] = [],
    /** Lo adeudado en las cuotas elegidas, para MONTO_EXCEDE_DEUDA. */
    public readonly debt?: Prisma.Decimal,
  ) {
    super(reason);
    this.name = 'PaymentPlanError';
  }
}
