import { HttpStatus } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { FeeStatus, Prisma, Role, type User } from '@PrismaClient';
import { ApiException } from '@Common/errors';
import { validateEnv, type EnvConfig } from '@Config';
import type { UnidadesService } from '@Unidades/services';
import { PaymentsService } from './payments.service.js';
import { SimulatedCardGateway } from './simulated-card-gateway.js';
import type { FeeWithPaid, PaymentRepository } from '../repositories/index.js';
import type { CreatePaymentDto } from '../dto/index.js';
import { PaymentPlanError } from '../errors/index.js';
import {
  balanceOf,
  planPayment,
  totalBalance,
  type Allocation,
  type FeeBalance,
} from '../utils/index.js';

const UNIT = '11111111-1111-1111-1111-111111111111';
const OTHER_UNIT = '22222222-2222-2222-2222-222222222222';

const resident = { id: 'res-1', role: Role.RESIDENTE, unitId: UNIT } as User;
const admin = { id: 'adm-1', role: Role.ADMINISTRADOR, unitId: null } as User;

const d = (value: number | string) => new Prisma.Decimal(value);

function fee(
  id: number,
  amount: number,
  paid = 0,
  status: FeeStatus = FeeStatus.PENDIENTE,
): FeeWithPaid {
  return {
    id,
    concept: 'Mantenimiento',
    period: '2026-11',
    dueDate: new Date(
      `2026-${String(id % 12 || 12).padStart(2, '0')}-10T00:00:00Z`,
    ),
    status,
    amount: d(amount),
    paid: d(paid),
  };
}

/** Cuota para el plan de pago, con vencimiento explícito. */
function balance(
  id: number,
  dueDate: string,
  amount: number | string,
  paid: number | string = 0,
  status: FeeStatus = FeeStatus.PENDIENTE,
): FeeBalance {
  return {
    id,
    dueDate: new Date(`${dueDate}T00:00:00Z`),
    status,
    amount: d(amount),
    paid: d(paid),
  };
}

const dto = (overrides: Partial<CreatePaymentDto> = {}): CreatePaymentDto => ({
  unidadId: UNIT,
  cuotaIds: [10, 11],
  monto: 150,
  ...overrides,
});

async function expectApiError(
  promise: Promise<unknown>,
  status: HttpStatus,
  codigo: string,
) {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(ApiException);
  expect((error as ApiException).getStatus()).toBe(status);
  expect((error as ApiException).getResponse()).toMatchObject({ codigo });
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

const summary = (allocations: Allocation[]) =>
  allocations.map((a) => [a.feeId, a.amount.toFixed(2), a.resultingStatus]);

const gatewayWithDelay = (delayMs: number) =>
  new SimulatedCardGateway({ get: () => delayMs } as unknown as ConfigService<
    EnvConfig,
    true
  >);

describe('H1. Pago de Cuotas Residente', () => {
  let repository: { [K in keyof PaymentRepository]: ReturnType<typeof vi.fn> };
  let unidades: { findById: ReturnType<typeof vi.fn> };
  let gateway: { charge: ReturnType<typeof vi.fn> };
  let service: PaymentsService;
  let fees: FeeWithPaid[];

  const october = balance(301, '2026-10-10', 100);
  const november = balance(302, '2026-11-10', 100);

  beforeEach(() => {
    fees = [fee(10, 100), fee(11, 100)];
    repository = {
      findAccountStatement: vi
        .fn()
        .mockResolvedValue({ fees: [], payments: [] }),
      findFeeBalances: vi.fn().mockImplementation(() => Promise.resolve(fees)),
      referenceExists: vi.fn().mockResolvedValue(false),
      // Como la transacción real: le pasa las cuotas actuales al plan.
      recordPayment: vi
        .fn()
        .mockImplementation((_input, plan: (f: FeeBalance[]) => Allocation[]) =>
          Promise.resolve({
            paymentId: 1,
            paidAt: new Date(),
            allocations: plan(fees),
            unitBalance: d(50),
          }),
        ),
    };
    unidades = { findById: vi.fn().mockResolvedValue({ id: UNIT }) };
    gateway = { charge: vi.fn().mockResolvedValue(true) };

    service = new PaymentsService(
      repository as unknown as PaymentRepository,
      unidades as unknown as UnidadesService,
      gateway as unknown as SimulatedCardGateway,
    );
  });

  it('AC1: el estado de cuenta trae el saldo de cada cuota con su estado y el total sin contar las anuladas', async () => {
    repository.findAccountStatement.mockResolvedValue({
      fees: [
        fee(12, 100),
        fee(11, 100, 50, FeeStatus.PARCIAL),
        fee(10, 80, 0, FeeStatus.ANULADA),
      ],
      payments: [],
    });

    const statement = await service.getAccountStatement(UNIT, resident);

    expect(statement.total.toFixed(2)).toBe('150.00');
    expect(statement.fees.map((f) => [f.status, f.balance.toFixed(2)])).toEqual(
      [
        ['PENDIENTE', '100.00'],
        ['PARCIAL', '50.00'],
        ['ANULADA', '80.00'],
      ],
    );
  });

  it('AC1: el estado de cuenta trae los pagos tal como están registrados', async () => {
    const payments = [
      {
        id: 7,
        paymentId: 3,
        feeId: 10,
        amount: d(50),
        paidAt: new Date('2026-11-05T15:00:00Z'),
      },
    ];
    repository.findAccountStatement.mockResolvedValue({ fees: [], payments });

    const statement = await service.getAccountStatement(UNIT, resident);

    expect(statement.payments).toBe(payments);
  });

  it('AC1: una unidad sin cuotas tiene saldo 0 y listas vacías', async () => {
    const statement = await service.getAccountStatement(UNIT, resident);
    expect(statement.total.toNumber()).toBe(0);
    expect(statement.fees).toEqual([]);
    expect(statement.payments).toEqual([]);
  });

  it('AC1: el saldo de una cuota es su monto menos lo pagado', () => {
    expect(
      balanceOf(balance(1, '2026-11-10', '100.00', '35.50')).toFixed(2),
    ).toBe('64.50');
  });

  it('AC1: el saldo total no cuenta las cuotas pagadas ni las anuladas', () => {
    const balances = [
      balance(1, '2026-10-10', 100, 50, FeeStatus.PARCIAL),
      balance(2, '2026-11-10', 100),
      balance(3, '2026-09-10', 100, 100, FeeStatus.PAGADA),
      balance(4, '2026-08-10', 80, 0, FeeStatus.ANULADA),
    ];
    expect(totalBalance(balances).toFixed(2)).toBe('150.00');
    expect(totalBalance([]).toNumber()).toBe(0);
  });

  it('AC1: el saldo no arrastra errores de punto flotante', () => {
    const balances = [
      balance(1, '2026-10-10', '0.10'),
      balance(2, '2026-11-10', '0.20'),
    ];
    expect(totalBalance(balances).toFixed(2)).toBe('0.30');
  });

  it('AC1: UNIDAD_INEXISTENTE si la unidad no existe', async () => {
    unidades.findById.mockResolvedValue(null);
    await expectApiError(
      service.getAccountStatement(OTHER_UNIT, admin),
      HttpStatus.NOT_FOUND,
      'UNIDAD_INEXISTENTE',
    );
  });

  it('AC2: registra el pago de varias cuotas con lo aplicado a cada una', async () => {
    const record = await service.pay(
      dto({ referencia: 'TARJ-2026' }),
      resident,
    );

    expect(repository.recordPayment).toHaveBeenCalledWith(
      {
        unitId: UNIT,
        userId: 'res-1',
        amount: d(150),
        reference: 'TARJ-2026',
        feeIds: [10, 11],
      },
      expect.any(Function),
    );
    expect(summary(record.allocations)).toEqual([
      [10, '100.00', 'PAGADA'],
      [11, '50.00', 'PARCIAL'],
    ]);
    expect(record.unitBalance.toFixed(2)).toBe('50.00');
    expect(gateway.charge).not.toHaveBeenCalled();
  });

  it('AC2: un pago total deja la cuota PAGADA', () => {
    expect(summary(planPayment([301], [october], d(100)))).toEqual([
      [301, '100.00', 'PAGADA'],
    ]);
  });

  it('AC2: un pago parcial deja la cuota PARCIAL', () => {
    expect(summary(planPayment([301], [october], d('40.25')))).toEqual([
      [301, '40.25', 'PARCIAL'],
    ]);
  });

  it('AC2: aplica el pago por fecha de vencimiento ascendente, sin importar el orden pedido', () => {
    expect(
      summary(planPayment([302, 301], [november, october], d(150))),
    ).toEqual([
      [301, '100.00', 'PAGADA'],
      [302, '50.00', 'PARCIAL'],
    ]);
  });

  it('AC2: a igual vencimiento, desempata por id', () => {
    const a = balance(7, '2026-11-10', 30);
    const b = balance(5, '2026-11-10', 30);
    expect(summary(planPayment([7, 5], [a, b], d(30)))).toEqual([
      [5, '30.00', 'PAGADA'],
      [7, '0.00', 'PENDIENTE'],
    ]);
  });

  it('AC2: una cuota a la que no le alcanza el monto conserva su estado', () => {
    const partial = balance(303, '2026-12-10', 100, 20, FeeStatus.PARCIAL);
    expect(
      summary(planPayment([301, 303], [october, partial], d(100))),
    ).toEqual([
      [301, '100.00', 'PAGADA'],
      [303, '0.00', 'PARCIAL'],
    ]);
  });

  it('AC2: completa una cuota PARCIAL con exactamente su saldo', () => {
    const partial = balance(303, '2026-12-10', 100, 20, FeeStatus.PARCIAL);
    expect(summary(planPayment([303], [partial], d(80)))).toEqual([
      [303, '80.00', 'PAGADA'],
    ]);
  });

  it('AC3: MONTO_EXCEDE_DEUDA (422) sin cobrar con la tarjeta ni registrar el pago', async () => {
    await expectApiError(
      service.pay(dto({ monto: 200.01, tarjetaUltimos4: '2026' }), resident),
      HttpStatus.UNPROCESSABLE_ENTITY,
      'MONTO_EXCEDE_DEUDA',
    );
    expect(gateway.charge).not.toHaveBeenCalled();
    expect(repository.recordPayment).not.toHaveBeenCalled();
  });

  it('AC3: el rechazo indica cuánto se adeuda en las cuotas elegidas', () => {
    const error = planError(() =>
      planPayment([301, 302], [october, november], d('200.01')),
    );
    expect(error.reason).toBe('MONTO_EXCEDE_DEUDA');
    expect(error.debt?.toFixed(2)).toBe('200.00');
  });

  it('AC3: valida el monto después de las cuotas inexistentes y las ya pagadas', () => {
    const paid = balance(304, '2026-09-10', 100, 100, FeeStatus.PAGADA);
    expect(
      planError(() => planPayment([304, 999], [paid], d(1000))).reason,
    ).toBe('CUOTA_INEXISTENTE');
    expect(
      planError(() => planPayment([304, 301], [paid, october], d(1000))).reason,
    ).toBe('CUOTA_YA_PAGADA');
  });

  it('AC4: RECURSO_AJENO si un residente consulta otra unidad, sin revelar si existe', async () => {
    await expectApiError(
      service.getAccountStatement(OTHER_UNIT, resident),
      HttpStatus.FORBIDDEN,
      'RECURSO_AJENO',
    );
    expect(unidades.findById).not.toHaveBeenCalled();
    expect(repository.findAccountStatement).not.toHaveBeenCalled();
  });

  it('AC4: RECURSO_AJENO para un residente sin unidad asignada', async () => {
    const homeless = { ...resident, unitId: null } as User;
    await expectApiError(
      service.getAccountStatement(UNIT, homeless),
      HttpStatus.FORBIDDEN,
      'RECURSO_AJENO',
    );
  });

  it('AC4: RECURSO_AJENO si se intenta pagar por otra unidad', async () => {
    await expectApiError(
      service.pay(dto({ unidadId: OTHER_UNIT }), resident),
      HttpStatus.FORBIDDEN,
      'RECURSO_AJENO',
    );
    expect(repository.findFeeBalances).not.toHaveBeenCalled();
  });

  it('AC4: CUOTA_INEXISTENTE (404) si una cuota no es de la unidad', async () => {
    await expectApiError(
      service.pay(dto({ cuotaIds: [10, 99] }), resident),
      HttpStatus.NOT_FOUND,
      'CUOTA_INEXISTENTE',
    );

    const error = planError(() => planPayment([301, 999], [october], d(10)));
    expect(error.feeIds).toEqual([999]);
  });

  it('AC4: el administrador sí puede consultar cualquier unidad', async () => {
    await service.getAccountStatement(OTHER_UNIT, admin);
    expect(repository.findAccountStatement).toHaveBeenCalledWith(OTHER_UNIT);
  });

  it('AC5: cobra con la pasarela cuando se indica tarjeta y después registra el pago', async () => {
    await service.pay(dto({ tarjetaUltimos4: '2026' }), resident);
    expect(gateway.charge).toHaveBeenCalledWith('2026');
    expect(repository.recordPayment).toHaveBeenCalled();
  });

  it('AC5: PAGO_RECHAZADO (402) si la pasarela rechaza, sin registrar nada', async () => {
    gateway.charge.mockResolvedValue(false);
    await expectApiError(
      service.pay(dto({ tarjetaUltimos4: '2000' }), resident),
      HttpStatus.PAYMENT_REQUIRED,
      'PAGO_RECHAZADO',
    );
    expect(repository.recordPayment).not.toHaveBeenCalled();
  });

  describe('pasarela simulada', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('AC5: la espera simulada es de 5 segundos por defecto', () => {
      const env = validateEnv({
        DATABASE_URL: 'postgresql://localhost/db',
        JWT_SECRET: 'x'.repeat(32),
      });
      expect(env.PAGO_SIMULADO_ESPERA_MS).toBe(5000);
    });

    it('AC5: la tarjeta que termina en 2026 se acepta después de la espera', async () => {
      let result: boolean | undefined;
      const charge = gatewayWithDelay(5000)
        .charge('2026')
        .then((approved) => (result = approved));

      await vi.advanceTimersByTimeAsync(4999);
      expect(result).toBeUndefined();
      await vi.advanceTimersByTimeAsync(1);
      await charge;
      expect(result).toBe(true);
    });

    it('AC5: la tarjeta que termina en 2000 siempre se rechaza', async () => {
      const charge = gatewayWithDelay(5000).charge('2000');
      await vi.advanceTimersByTimeAsync(5000);
      await expect(charge).resolves.toBe(false);
    });
  });

  it('AC6: CUOTA_YA_PAGADA (409) si una cuota está pagada o anulada', async () => {
    fees = [fee(10, 100, 100, FeeStatus.PAGADA), fee(11, 100)];
    await expectApiError(
      service.pay(dto({ monto: 10 }), resident),
      HttpStatus.CONFLICT,
      'CUOTA_YA_PAGADA',
    );

    const paid = balance(304, '2026-09-10', 100, 100, FeeStatus.PAGADA);
    const voided = balance(305, '2026-08-10', 100, 0, FeeStatus.ANULADA);
    const error = planError(() =>
      planPayment([301, 304, 305], [october, paid, voided], d(10)),
    );
    expect(error.reason).toBe('CUOTA_YA_PAGADA');
    expect(error.feeIds).toEqual([304, 305]);
  });

  it('AC6: CUOTA_YA_PAGADA también si el saldo ya es 0 aunque el estado no lo diga', () => {
    const stale = balance(306, '2026-09-10', 100, 100, FeeStatus.PARCIAL);
    expect(planError(() => planPayment([306], [stale], d(1))).reason).toBe(
      'CUOTA_YA_PAGADA',
    );
  });

  it('AC6: CUOTA_YA_PAGADA (409) si la referencia del pago ya existe, sin registrar nada', async () => {
    repository.referenceExists.mockResolvedValue(true);
    await expectApiError(
      service.pay(dto({ referencia: 'TARJ-2026' }), resident),
      HttpStatus.CONFLICT,
      'CUOTA_YA_PAGADA',
    );
    expect(repository.recordPayment).not.toHaveBeenCalled();
  });

  it('AC6: vuelve a validar dentro de la transacción, por si otro pago cubrió la cuota durante la espera', async () => {
    gateway.charge.mockImplementation(() => {
      fees = [fee(10, 100, 100, FeeStatus.PAGADA), fee(11, 100)];
      return Promise.resolve(true);
    });
    await expectApiError(
      service.pay(dto({ tarjetaUltimos4: '2026' }), resident),
      HttpStatus.CONFLICT,
      'CUOTA_YA_PAGADA',
    );
  });
});
