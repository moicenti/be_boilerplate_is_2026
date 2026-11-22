import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Prisma, Role, type FeeStatus } from '@PrismaClient';
import type { EnvConfig } from '@Config';
import { RolesGuard } from '@Auth/guards';
import { DelinquencyController } from '../controllers/index.js';
import type {
  DelinquencyRepository,
  DelinquentUnitInfo,
} from '../repositories/index.js';
import {
  daysBetween,
  isOverdue,
  summarizeDelinquency,
  type UnitFeeBalance,
} from '../utils/index.js';
import {
  DelinquencyService,
  type DelinquencyQuery,
} from './delinquency.service.js';

// 5 nov 2026, 11:10 en El Salvador (UTC-6).
const NOW = new Date('2026-11-05T17:10:00Z');

const fee = (unitId: string, due: string, amount = 100): UnitFeeBalance => ({
  unitId,
  status: 'PENDIENTE',
  dueDate: new Date(`${due}T00:00:00Z`),
  amount: new Prisma.Decimal(amount),
  paid: new Prisma.Decimal(0),
});

const TODAY = '2026-11-05';

/** Cuota para la regla de mora, con estado y pagos opcionales. */
const rule = (
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

/** Ejecuta el guard de roles sobre GET /unidades/mora con el usuario dado. */
function canListDelinquency(role?: Role): boolean {
  const context = {
    // El guard lee los metadatos de @Roles del método y de la clase reales.
    getHandler: () =>
      Reflect.get(DelinquencyController.prototype, 'list') as unknown,
    getClass: () => DelinquencyController,
    switchToHttp: () => ({ getRequest: () => ({ user: role && { role } }) }),
  } as unknown as ExecutionContext;
  return new RolesGuard(new Reflector()).canActivate(context);
}

const info = (
  id: string,
  code: string,
  responsible: string | null = `${code.toLowerCase()}@x.com`,
): DelinquentUnitInfo => ({ id, code, tower: `Torre ${code[0]}`, responsible });

describe('H2. Visualización de unidades en mora', () => {
  let repository: {
    findOverdueFees: ReturnType<typeof vi.fn>;
    findUnitsInfo: ReturnType<typeof vi.fn>;
  };
  let service: DelinquencyService;

  const list = (query: Partial<DelinquencyQuery> = {}, now = NOW) =>
    service.list({ page: 1, pageSize: 20, sort: '-diasAtraso', ...query }, now);

  beforeEach(() => {
    repository = {
      // B-205: desde ago (87 días), 3 cuotas · A-202: desde sep, 2 cuotas, 4800
      // A-304: desde oct, 1 cuota, 2400 · sin residente.
      findOverdueFees: vi
        .fn()
        .mockResolvedValue([
          fee('b205', '2026-08-10', 2400),
          fee('b205', '2026-09-10', 2400),
          fee('b205', '2026-10-10', 2400),
          fee('a202', '2026-09-10', 2400),
          fee('a202', '2026-10-10', 2400),
          fee('a304', '2026-10-10', 2400),
        ]),
      findUnitsInfo: vi
        .fn()
        .mockResolvedValue([
          info('b205', 'B-205'),
          info('a202', 'A-202'),
          info('a304', 'A-304', null),
        ]),
    };
    const config = {
      get: () => 'America/El_Salvador',
    } as unknown as ConfigService<EnvConfig, true>;
    service = new DelinquencyService(
      repository as unknown as DelinquencyRepository,
      config,
    );
  });

  it('AC1: lista cada unidad morosa con la fecha desde la que está en mora y el monto que adeuda', async () => {
    const page = await list();

    expect(page).toMatchObject({
      total: 3,
      page: 1,
      pageSize: 20,
      today: '2026-11-05',
    });
    expect(page.items.map((u) => u.code)).toEqual(['B-205', 'A-202', 'A-304']);
    expect(page.items[0]).toMatchObject({
      unitId: 'b205',
      tower: 'Torre B',
      responsible: 'b-205@x.com',
      since: '2026-08-10',
      daysLate: 87,
      overdueFees: 3,
    });
    expect(page.items[0].amountOwed.toFixed(2)).toBe('7200.00');
    expect(repository.findOverdueFees).toHaveBeenCalledWith(
      '2026-11-05',
      undefined,
    );
  });

  it('AC1: agrupa por unidad desde la cuota vencida más antigua, con días de atraso, saldo y cantidad', () => {
    const [unit] = summarizeDelinquency(
      [
        rule('2026-10-10', { status: 'PARCIAL', paid: 40 }),
        rule('2026-09-10'),
        rule('2026-11-10'), // aún no vence
        rule('2026-08-10', { status: 'PAGADA' }),
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

  it('AC1: una cuota PENDIENTE que venció ayer está vencida; la que vence hoy todavía no', () => {
    expect(isOverdue(rule('2026-11-04'), TODAY)).toBe(true);
    expect(isOverdue(rule('2026-11-05'), TODAY)).toBe(false);
  });

  it('AC1: una cuota PARCIAL vencida con saldo está vencida', () => {
    expect(
      isOverdue(rule('2026-10-10', { status: 'PARCIAL', paid: 40 }), TODAY),
    ).toBe(true);
  });

  it('AC1: "hoy" es la fecha del condominio, no la UTC', async () => {
    // 6 nov 03:00 UTC sigue siendo 5 nov en El Salvador.
    const page = await list({}, new Date('2026-11-06T03:00:00Z'));
    expect(page.today).toBe('2026-11-05');
  });

  it('AC1: los días de atraso son días de calendario, también entre años', () => {
    expect(daysBetween('2026-11-04', TODAY)).toBe(1);
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
    expect(daysBetween('2026-02-28', '2026-03-01')).toBe(1);
  });

  it.each([
    ['unidad', ['A-202', 'A-304', 'B-205']],
    ['-unidad', ['B-205', 'A-304', 'A-202']],
    ['diasAtraso', ['A-304', 'A-202', 'B-205']],
    ['enMoraDesde', ['B-205', 'A-202', 'A-304']],
    ['-montoAdeudado', ['B-205', 'A-202', 'A-304']],
    ['cuotasVencidas', ['A-304', 'A-202', 'B-205']],
    ['responsable', ['A-202', 'B-205', 'A-304']], // sin responsable al final
  ])('AC1: ordena la lista por %s', async (sort, codes) => {
    const page = await list({ sort });
    expect(page.items.map((u) => u.code)).toEqual(codes);
  });

  it('AC1: a igual atraso, ordena por código de unidad', async () => {
    repository.findOverdueFees.mockResolvedValue([
      fee('b205', '2026-10-10'),
      fee('a202', '2026-10-10'),
    ]);
    const page = await list({ sort: '-diasAtraso' });
    expect(page.items.map((u) => u.code)).toEqual(['A-202', 'B-205']);
  });

  it('AC1: pagina con pagina y tamano; total cuenta todas las páginas', async () => {
    const page = await list({ page: 2, pageSize: 2 });
    expect(page.total).toBe(3);
    expect(page.items.map((u) => u.code)).toEqual(['A-304']);
  });

  it('AC2: una unidad que pagó todo lo vencido deja de aparecer', async () => {
    repository.findOverdueFees.mockResolvedValue([
      {
        ...fee('b205', '2026-08-10', 2400),
        status: 'PAGADA',
        paid: new Prisma.Decimal(2400),
      },
      fee('a202', '2026-09-10', 2400),
    ]);

    const page = await list();

    expect(page.items.map((u) => u.code)).toEqual(['A-202']);
    expect(page.total).toBe(1);
  });

  it.each<FeeStatus>(['PAGADA', 'ANULADA'])(
    'AC2: una cuota %s nunca cuenta como vencida',
    (status) => {
      expect(isOverdue(rule('2026-09-10', { status }), TODAY)).toBe(false);
    },
  );

  it('AC2: sin saldo no cuenta aunque el estado diga PARCIAL', () => {
    expect(
      isOverdue(rule('2026-09-10', { status: 'PARCIAL', paid: 100 }), TODAY),
    ).toBe(false);
  });

  it('AC2: solo incluye unidades con al menos una cuota vencida y con saldo', () => {
    const units = summarizeDelinquency(
      [
        rule('2026-10-10', { unitId: 'morosa' }),
        rule('2026-10-10', { unitId: 'pagada', status: 'PAGADA' }),
        rule('2026-11-05', { unitId: 'vence-hoy' }),
        rule('2026-12-10', { unitId: 'al-dia' }),
      ],
      TODAY,
    );
    expect(units.map((u) => u.unitId)).toEqual(['morosa']);
  });

  it('AC2: sin cuotas vencidas la lista queda vacía', async () => {
    expect(summarizeDelinquency([], TODAY)).toEqual([]);

    repository.findOverdueFees.mockResolvedValue([]);
    repository.findUnitsInfo.mockResolvedValue([]);
    expect(await list()).toMatchObject({ total: 0, items: [] });
    expect(repository.findUnitsInfo).toHaveBeenCalledWith([]);
  });

  it('AC3: filtra por torre', async () => {
    await list({ tower: 'Torre A' });
    expect(repository.findOverdueFees).toHaveBeenCalledWith(
      '2026-11-05',
      'Torre A',
    );
  });

  it('AC3: filtra por antigüedad mínima de la mora', async () => {
    const page = await list({ minDaysLate: 30 });
    expect(page.items.map((u) => u.code)).toEqual(['B-205', 'A-202']);
    expect(page.total).toBe(2);
  });

  it('AC4: un residente o un guardia de seguridad no pueden consultar las unidades en mora', () => {
    expect(() => canListDelinquency(Role.RESIDENTE)).toThrow(
      ForbiddenException,
    );
    expect(() => canListDelinquency(Role.SEGURIDAD)).toThrow(
      ForbiddenException,
    );
    expect(() => canListDelinquency(undefined)).toThrow(ForbiddenException);
  });

  it('AC4: el administrador sí puede consultarlas', () => {
    expect(canListDelinquency(Role.ADMINISTRADOR)).toBe(true);
  });
});
