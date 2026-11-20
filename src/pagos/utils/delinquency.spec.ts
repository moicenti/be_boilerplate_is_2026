import { Prisma, type FeeStatus } from '@PrismaClient';
import {
  daysBetween,
  isOverdue,
  summarizeDelinquency,
  type UnitFeeBalance,
} from './delinquency.js';

const TODAY = '2026-11-05';

const fee = (
  due: string,
  overrides: Partial<Omit<UnitFeeBalance, 'amount' | 'paid'>> & {
    amount?: number;
    paid?: number;
  } = {},
): UnitFeeBalance => ({
  unitId: overrides.unitId ?? 'u1',
  status: overrides.status ?? 'PENDIENTE',
  dueDate: new Date(`${due}T00:00:00Z`),
  amount: new Prisma.Decimal(overrides.amount ?? 100),
  paid: new Prisma.Decimal(overrides.paid ?? 0),
});

describe('regla de mora', () => {
  describe('isOverdue', () => {
    it('una cuota PENDIENTE que venció ayer está vencida', () => {
      expect(isOverdue(fee('2026-11-04'), TODAY)).toBe(true);
    });

    it('una cuota que vence hoy no cuenta como vencida', () => {
      expect(isOverdue(fee('2026-11-05'), TODAY)).toBe(false);
    });

    it('una cuota PARCIAL vencida con saldo está vencida', () => {
      expect(
        isOverdue(fee('2026-10-10', { status: 'PARCIAL', paid: 40 }), TODAY),
      ).toBe(true);
    });

    it.each<FeeStatus>(['PAGADA', 'ANULADA'])(
      'una cuota %s nunca cuenta',
      (status) => {
        expect(isOverdue(fee('2026-09-10', { status }), TODAY)).toBe(false);
      },
    );

    it('sin saldo no cuenta aunque el estado diga PARCIAL', () => {
      expect(
        isOverdue(fee('2026-09-10', { status: 'PARCIAL', paid: 100 }), TODAY),
      ).toBe(false);
    });
  });

  describe('summarizeDelinquency', () => {
    it('agrupa por unidad: desde la más antigua, días de atraso, saldo y cantidad', () => {
      const [unit] = summarizeDelinquency(
        [
          fee('2026-10-10', { status: 'PARCIAL', paid: 40 }),
          fee('2026-09-10'),
          fee('2026-11-10'), // aún no vence
          fee('2026-08-10', { status: 'PAGADA' }),
        ],
        TODAY,
      );
      expect(unit).toEqual({
        unitId: 'u1',
        since: '2026-09-10',
        daysLate: 56,
        amountOwed: new Prisma.Decimal(160),
        overdueFees: 2,
      });
    });

    it('solo incluye unidades con al menos una cuota vencida y con saldo', () => {
      const units = summarizeDelinquency(
        [
          fee('2026-10-10', { unitId: 'morosa' }),
          fee('2026-10-10', { unitId: 'pagada', status: 'PAGADA' }),
          fee('2026-11-05', { unitId: 'vence-hoy' }),
          fee('2026-12-10', { unitId: 'al-dia' }),
        ],
        TODAY,
      );
      expect(units.map((u) => u.unitId)).toEqual(['morosa']);
    });

    it('sin cuotas no hay unidades en mora', () => {
      expect(summarizeDelinquency([], TODAY)).toEqual([]);
    });
  });

  it('daysBetween cuenta días de calendario, también entre años', () => {
    expect(daysBetween('2026-11-04', TODAY)).toBe(1);
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
    expect(daysBetween('2026-02-28', '2026-03-01')).toBe(1);
  });
});
