import { FeeStatus, Prisma } from '@PrismaClient';
import { PaymentPlanError } from '../errors/index.js';
import { balanceOf, planPayment, totalBalance, type FeeBalance } from './payment-plan.js';

const d = (value: number | string) => new Prisma.Decimal(value);

function fee(
  id: number,
  dueDate: string,
  amount: number | string,
  paid: number | string = 0,
  status: FeeStatus = FeeStatus.PENDIENTE,
): FeeBalance {
  return { id, dueDate: new Date(`${dueDate}T00:00:00Z`), status, amount: d(amount), paid: d(paid) };
}

function planError(fn: () => unknown): PaymentPlanError {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(PaymentPlanError);
    return error as PaymentPlanError;
  }
  throw new Error('Se esperaba un PaymentPlanError');
}

const summary = (allocations: ReturnType<typeof planPayment>) =>
  allocations.map((a) => [a.feeId, a.amount.toFixed(2), a.resultingStatus]);

describe('balanceOf / totalBalance', () => {
  it('saldo = monto menos lo pagado', () => {
    expect(balanceOf(fee(1, '2026-11-10', '100.00', '35.50')).toFixed(2)).toBe('64.50');
  });

  it('el saldo total no cuenta las cuotas anuladas', () => {
    const fees = [
      fee(1, '2026-10-10', 100, 50, FeeStatus.PARCIAL),
      fee(2, '2026-11-10', 100),
      fee(3, '2026-09-10', 100, 100, FeeStatus.PAGADA),
      fee(4, '2026-08-10', 80, 0, FeeStatus.ANULADA),
    ];
    expect(totalBalance(fees).toFixed(2)).toBe('150.00');
  });

  it('una unidad sin cuotas tiene saldo 0', () => {
    expect(totalBalance([]).toNumber()).toBe(0);
  });

  it('no arrastra errores de punto flotante', () => {
    const fees = [fee(1, '2026-10-10', '0.10'), fee(2, '2026-11-10', '0.20')];
    expect(totalBalance(fees).toFixed(2)).toBe('0.30');
  });
});

describe('planPayment', () => {
  const october = fee(301, '2026-10-10', 100);
  const november = fee(302, '2026-11-10', 100);

  it('un pago total deja la cuota PAGADA', () => {
    expect(summary(planPayment([301], [october], d(100)))).toEqual([[301, '100.00', 'PAGADA']]);
  });

  it('un pago parcial deja la cuota PARCIAL', () => {
    expect(summary(planPayment([301], [october], d('40.25')))).toEqual([[301, '40.25', 'PARCIAL']]);
  });

  it('aplica por fecha de vencimiento ascendente, sin importar el orden pedido', () => {
    expect(summary(planPayment([302, 301], [november, october], d(150)))).toEqual([
      [301, '100.00', 'PAGADA'],
      [302, '50.00', 'PARCIAL'],
    ]);
  });

  it('a igual vencimiento, desempata por id', () => {
    const a = fee(7, '2026-11-10', 30);
    const b = fee(5, '2026-11-10', 30);
    expect(summary(planPayment([7, 5], [a, b], d(30)))).toEqual([
      [5, '30.00', 'PAGADA'],
      [7, '0.00', 'PENDIENTE'],
    ]);
  });

  it('una cuota a la que no le alcanza el monto conserva su estado', () => {
    const partial = fee(303, '2026-12-10', 100, 20, FeeStatus.PARCIAL);
    expect(summary(planPayment([301, 303], [october, partial], d(100)))).toEqual([
      [301, '100.00', 'PAGADA'],
      [303, '0.00', 'PARCIAL'],
    ]);
  });

  it('completa una cuota PARCIAL con exactamente su saldo', () => {
    const partial = fee(303, '2026-12-10', 100, 20, FeeStatus.PARCIAL);
    expect(summary(planPayment([303], [partial], d(80)))).toEqual([[303, '80.00', 'PAGADA']]);
  });

  it('CUOTA_INEXISTENTE si una cuota no está entre las de la unidad', () => {
    const error = planError(() => planPayment([301, 999], [october], d(10)));
    expect(error.reason).toBe('CUOTA_INEXISTENTE');
    expect(error.feeIds).toEqual([999]);
  });

  it('CUOTA_YA_PAGADA si una cuota está pagada o anulada', () => {
    const paid = fee(304, '2026-09-10', 100, 100, FeeStatus.PAGADA);
    const voided = fee(305, '2026-08-10', 100, 0, FeeStatus.ANULADA);
    const error = planError(() => planPayment([301, 304, 305], [october, paid, voided], d(10)));
    expect(error.reason).toBe('CUOTA_YA_PAGADA');
    expect(error.feeIds).toEqual([304, 305]);
  });

  it('CUOTA_YA_PAGADA también si el saldo ya es 0 aunque el estado no lo diga', () => {
    const stale = fee(306, '2026-09-10', 100, 100, FeeStatus.PARCIAL);
    expect(planError(() => planPayment([306], [stale], d(1))).reason).toBe('CUOTA_YA_PAGADA');
  });

  it('MONTO_EXCEDE_DEUDA si el monto supera lo adeudado en las cuotas elegidas', () => {
    const error = planError(() => planPayment([301, 302], [october, november], d('200.01')));
    expect(error.reason).toBe('MONTO_EXCEDE_DEUDA');
    expect(error.debt?.toFixed(2)).toBe('200.00');
  });

  it('valida en orden: inexistente, luego pagada, luego monto', () => {
    const paid = fee(304, '2026-09-10', 100, 100, FeeStatus.PAGADA);
    expect(planError(() => planPayment([304, 999], [paid], d(1000))).reason).toBe('CUOTA_INEXISTENTE');
    expect(planError(() => planPayment([304, 301], [paid, october], d(1000))).reason).toBe('CUOTA_YA_PAGADA');
  });
});
