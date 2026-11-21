import { FeeStatus, Prisma } from '@PrismaClient';

const ZERO = new Prisma.Decimal(0);
const DAY_MS = 24 * 60 * 60 * 1000;

/** Estados que pueden dejar una unidad en mora. PAGADA y ANULADA nunca cuentan. */
export const DELINQUENT_STATUSES: FeeStatus[] = [
  FeeStatus.PENDIENTE,
  FeeStatus.PARCIAL,
];

export interface UnitFeeBalance {
  unitId: string;
  status: FeeStatus;
  /** Columna DATE: medianoche UTC del día de vencimiento. */
  dueDate: Date;
  amount: Prisma.Decimal;
  paid: Prisma.Decimal;
}

export interface DelinquentUnit {
  unitId: string;
  /** Vencimiento más antiguo de sus cuotas vencidas (AAAA-MM-DD). */
  since: string;
  daysLate: number;
  amountOwed: Prisma.Decimal;
  overdueFees: number;
}

const dateOf = (date: Date): string => date.toISOString().slice(0, 10);

/** Días de `from` a `to`, ambos AAAA-MM-DD. */
export function daysBetween(from: string, to: string): number {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS,
  );
}

/**
 * Regla de mora: la cuota está PENDIENTE o PARCIAL, tiene saldo y venció antes de hoy.
 * Una cuota que vence hoy todavía no está vencida.
 */
export function isOverdue(fee: UnitFeeBalance, today: string): boolean {
  return (
    DELINQUENT_STATUSES.includes(fee.status) &&
    fee.amount.minus(fee.paid).gt(ZERO) &&
    dateOf(fee.dueDate) < today
  );
}

/** Agrupa por unidad las cuotas vencidas. Solo aparecen unidades con al menos una. */
export function summarizeDelinquency(
  fees: UnitFeeBalance[],
  today: string,
): DelinquentUnit[] {
  const byUnit = new Map<string, DelinquentUnit>();
  for (const fee of fees) {
    if (!isOverdue(fee, today)) continue;
    const due = dateOf(fee.dueDate);
    const balance = fee.amount.minus(fee.paid);
    const unit = byUnit.get(fee.unitId);
    if (!unit) {
      byUnit.set(fee.unitId, {
        unitId: fee.unitId,
        since: due,
        daysLate: daysBetween(due, today),
        amountOwed: balance,
        overdueFees: 1,
      });
      continue;
    }
    unit.amountOwed = unit.amountOwed.plus(balance);
    unit.overdueFees++;
    if (due < unit.since) {
      unit.since = due;
      unit.daysLate = daysBetween(due, today);
    }
  }
  return [...byUnit.values()];
}
