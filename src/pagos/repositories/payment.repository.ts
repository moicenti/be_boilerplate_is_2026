import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services';
import { FeeStatus, Prisma } from '@PrismaClient';
import { PaymentReferenceTakenError } from '../errors/index.js';
import { totalBalance, type Allocation, type FeeBalance } from '../utils/index.js';

/** Código de Prisma para violación de restricción única. */
const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

const ZERO = new Prisma.Decimal(0);

/** Cuota con lo que lleva pagado, para el estado de cuenta. */
export interface FeeWithPaid extends FeeBalance {
  concept: string;
  period: string;
}

/** Monto de un pago aplicado a una cuota. */
export interface PaymentLine {
  /** Id de la aplicación (pago_cuota). */
  id: number;
  paymentId: number;
  feeId: number;
  amount: Prisma.Decimal;
  paidAt: Date;
}

export interface AccountStatementData {
  /** Por fecha de vencimiento descendente. */
  fees: FeeWithPaid[];
  /** Del más reciente al más antiguo. */
  payments: PaymentLine[];
}

export interface NewPayment {
  unitId: string;
  userId: string;
  amount: Prisma.Decimal;
  reference: string | null;
  feeIds: number[];
}

export interface RecordedPayment {
  paymentId: number;
  paidAt: Date;
  allocations: Allocation[];
  /** Saldo total de la unidad después del pago. */
  unitBalance: Prisma.Decimal;
}

type Db = Prisma.TransactionClient | PrismaService;

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAccountStatement(unitId: string): Promise<AccountStatementData> {
    const [fees, lines] = await Promise.all([
      this.findFeesWithPaid(this.prisma, { unitId }, [{ dueDate: 'desc' }, { id: 'desc' }]),
      this.prisma.paymentAllocation.findMany({
        where: { fee: { unitId } },
        select: {
          id: true,
          paymentId: true,
          feeId: true,
          amount: true,
          payment: { select: { paidAt: true } },
        },
        orderBy: [{ payment: { paidAt: 'desc' } }, { id: 'desc' }],
      }),
    ]);

    return {
      fees,
      payments: lines.map(({ payment, ...line }) => ({ ...line, paidAt: payment.paidAt })),
    };
  }

  /** Cuotas de la unidad entre `feeIds`; las de otra unidad no aparecen. */
  findFeeBalances(unitId: string, feeIds: number[]): Promise<FeeWithPaid[]> {
    return this.findFeesWithPaid(this.prisma, { unitId, id: { in: feeIds } });
  }

  referenceExists(reference: string): Promise<boolean> {
    return this.prisma.payment
      .count({ where: { reference } })
      .then((count) => count > 0);
  }

  /**
   * Registra un pago en una sola transacción: bloquea las cuotas elegidas, vuelve a calcular
   * su saldo, le pasa las cuotas a `plan` (que valida y reparte el monto, o lanza), guarda el
   * pago con lo aplicado a cada cuota y actualiza sus estados. Si algo falla, no queda nada.
   */
  async recordPayment(
    input: NewPayment,
    plan: (fees: FeeBalance[]) => Allocation[],
  ): Promise<RecordedPayment> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Dos pagos simultáneos sobre la misma cuota no pueden aplicar el mismo saldo:
        // el segundo espera aquí y luego ve lo que registró el primero.
        await tx.$queryRaw`
          SELECT id FROM cuota
          WHERE unidad_id = ${input.unitId}::uuid AND id = ANY(${input.feeIds}::int[])
          ORDER BY id
          FOR UPDATE`;

        const fees = await this.findFeesWithPaid(tx, {
          unitId: input.unitId,
          id: { in: input.feeIds },
        });
        const allocations = plan(fees);
        const applied = allocations.filter((a) => a.amount.gt(0));

        const payment = await tx.payment.create({
          data: {
            unitId: input.unitId,
            userId: input.userId,
            amount: input.amount,
            reference: input.reference,
          },
          select: { id: true, paidAt: true },
        });

        await tx.paymentAllocation.createMany({
          data: applied.map((a) => ({
            paymentId: payment.id,
            feeId: a.feeId,
            amount: a.amount,
          })),
        });

        for (const allocation of applied) {
          await tx.fee.update({
            where: { id: allocation.feeId },
            data: { status: allocation.resultingStatus },
          });
        }

        const unitFees = await this.findFeesWithPaid(tx, {
          unitId: input.unitId,
          status: { not: FeeStatus.ANULADA },
        });

        return {
          paymentId: payment.id,
          paidAt: payment.paidAt,
          allocations,
          unitBalance: totalBalance(unitFees),
        };
      });
    } catch (error) {
      // Carrera entre la verificación previa y el insert: lo resuelve el índice único.
      if (
        input.reference !== null &&
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_CONSTRAINT_VIOLATION
      ) {
        throw new PaymentReferenceTakenError(input.reference);
      }
      throw error;
    }
  }

  private async findFeesWithPaid(
    db: Db,
    where: Prisma.FeeWhereInput,
    orderBy?: Prisma.FeeOrderByWithRelationInput[],
  ): Promise<FeeWithPaid[]> {
    const fees = await db.fee.findMany({
      where,
      select: {
        id: true,
        concept: true,
        period: true,
        amount: true,
        dueDate: true,
        status: true,
        allocations: { select: { amount: true } },
      },
      orderBy,
    });

    return fees.map(({ allocations, ...fee }) => ({
      ...fee,
      paid: allocations.reduce((sum, a) => sum.plus(a.amount), ZERO),
    }));
  }
}
