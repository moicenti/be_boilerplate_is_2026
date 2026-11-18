import { FeeStatus, Prisma } from '@PrismaClient';
import { PaymentPlanError } from '../errors/index.js';
const ZERO = new Prisma.Decimal(0);
/** Cuotas que ya no admiten pagos. */
const CLOSED_STATUSES = new Set([FeeStatus.PAGADA, FeeStatus.ANULADA]);
/** Saldo de una cuota: monto menos la suma de sus pagos. No se almacena. */
export function balanceOf(fee) {
    return fee.amount.minus(fee.paid);
}
/** Saldo total de una unidad: suma de los saldos de sus cuotas no anuladas. */
export function totalBalance(fees) {
    return fees
        .filter((fee) => fee.status !== FeeStatus.ANULADA)
        .reduce((sum, fee) => sum.plus(balanceOf(fee)), ZERO);
}
/**
 * Reparte `amount` entre las cuotas elegidas por fecha de vencimiento ascendente: cada
 * cuota recibe hasta su saldo y queda PAGADA si llega a 0 o PARCIAL si le queda saldo.
 *
 * Lanza PaymentPlanError, en este orden, si alguna cuota no está entre `fees`
 * (CUOTA_INEXISTENTE), si alguna ya está pagada o anulada (CUOTA_YA_PAGADA) o si el monto
 * supera lo adeudado en las cuotas elegidas (MONTO_EXCEDE_DEUDA).
 */
export function planPayment(feeIds, fees, amount) {
    const byId = new Map(fees.map((fee) => [fee.id, fee]));
    const missing = feeIds.filter((id) => !byId.has(id));
    if (missing.length > 0) {
        throw new PaymentPlanError('CUOTA_INEXISTENTE', missing);
    }
    const selected = fees.filter((fee) => feeIds.includes(fee.id));
    const closed = selected.filter((fee) => CLOSED_STATUSES.has(fee.status) || balanceOf(fee).lte(0));
    if (closed.length > 0) {
        throw new PaymentPlanError('CUOTA_YA_PAGADA', closed.map((fee) => fee.id));
    }
    const debt = selected.reduce((sum, fee) => sum.plus(balanceOf(fee)), ZERO);
    if (amount.gt(debt)) {
        throw new PaymentPlanError('MONTO_EXCEDE_DEUDA', [], debt);
    }
    let remaining = amount;
    return [...selected]
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime() || a.id - b.id)
        .map((fee) => {
        const balance = balanceOf(fee);
        const applied = Prisma.Decimal.min(remaining, balance);
        remaining = remaining.minus(applied);
        return {
            feeId: fee.id,
            amount: applied,
            resultingStatus: applied.isZero()
                ? fee.status
                : applied.eq(balance)
                    ? FeeStatus.PAGADA
                    : FeeStatus.PARCIAL,
        };
    });
}
