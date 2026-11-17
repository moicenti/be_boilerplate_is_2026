import { HttpStatus } from '@nestjs/common';
import { FeeStatus, Prisma, Role, type User } from '@PrismaClient';
import { ApiException } from '@Common/errors';
import type { UnidadesService } from '@Unidades/services';
import { PaymentsService } from './payments.service.js';
import type { SimulatedCardGateway } from './simulated-card-gateway.js';
import type { FeeWithPaid, PaymentRepository } from '../repositories/index.js';
import type { CreatePaymentDto } from '../dto/index.js';
import type { Allocation, FeeBalance } from '../utils/index.js';

const UNIT = '11111111-1111-1111-1111-111111111111';
const OTHER_UNIT = '22222222-2222-2222-2222-222222222222';

const resident = { id: 'res-1', role: Role.RESIDENTE, unitId: UNIT } as User;
const admin = { id: 'adm-1', role: Role.ADMINISTRADOR, unitId: null } as User;

const d = (value: number | string) => new Prisma.Decimal(value);

function fee(id: number, amount: number, paid = 0, status: FeeStatus = FeeStatus.PENDIENTE): FeeWithPaid {
  return {
    id,
    concept: 'Mantenimiento',
    period: '2026-11',
    dueDate: new Date(`2026-${String(id % 12 || 12).padStart(2, '0')}-10T00:00:00Z`),
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

async function expectApiError(promise: Promise<unknown>, status: HttpStatus, codigo: string) {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(ApiException);
  expect((error as ApiException).getStatus()).toBe(status);
  expect((error as ApiException).getResponse()).toMatchObject({ codigo });
}

describe('PaymentsService', () => {
  let repository: { [K in keyof PaymentRepository]: ReturnType<typeof vi.fn> };
  let unidades: { findById: ReturnType<typeof vi.fn> };
  let gateway: { charge: ReturnType<typeof vi.fn> };
  let service: PaymentsService;
  let fees: FeeWithPaid[];

  beforeEach(() => {
    fees = [fee(10, 100), fee(11, 100)];
    repository = {
      findAccountStatement: vi.fn().mockResolvedValue({ fees: [], payments: [] }),
      findFeeBalances: vi.fn().mockImplementation(() => Promise.resolve(fees)),
      referenceExists: vi.fn().mockResolvedValue(false),
      // Como la transacción real: le pasa las cuotas actuales al plan.
      recordPayment: vi
        .fn()
        .mockImplementation((_input, plan: (f: FeeBalance[]) => Allocation[]) =>
          Promise.resolve({ paymentId: 1, paidAt: new Date(), allocations: plan(fees), unitBalance: d(50) }),
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

  describe('getAccountStatement', () => {
    it('calcula el saldo de cada cuota y el total sin contar las anuladas', async () => {
      repository.findAccountStatement.mockResolvedValue({
        fees: [fee(12, 100), fee(11, 100, 50, FeeStatus.PARCIAL), fee(10, 80, 0, FeeStatus.ANULADA)],
        payments: [],
      });

      const statement = await service.getAccountStatement(UNIT, resident);

      expect(statement.total.toFixed(2)).toBe('150.00');
      expect(statement.fees.map((f) => f.balance.toFixed(2))).toEqual(['100.00', '50.00', '80.00']);
    });

    it('una unidad sin cuotas tiene saldo 0 y listas vacías', async () => {
      const statement = await service.getAccountStatement(UNIT, resident);
      expect(statement.total.toNumber()).toBe(0);
      expect(statement.fees).toEqual([]);
      expect(statement.payments).toEqual([]);
    });

    it('RECURSO_AJENO para un residente que consulta otra unidad, sin revelar si existe', async () => {
      await expectApiError(service.getAccountStatement(OTHER_UNIT, resident), HttpStatus.FORBIDDEN, 'RECURSO_AJENO');
      expect(unidades.findById).not.toHaveBeenCalled();
      expect(repository.findAccountStatement).not.toHaveBeenCalled();
    });

    it('RECURSO_AJENO para un residente sin unidad asignada', async () => {
      const homeless = { ...resident, unitId: null } as User;
      await expectApiError(service.getAccountStatement(UNIT, homeless), HttpStatus.FORBIDDEN, 'RECURSO_AJENO');
    });

    it('el administrador consulta cualquier unidad', async () => {
      await service.getAccountStatement(OTHER_UNIT, admin);
      expect(repository.findAccountStatement).toHaveBeenCalledWith(OTHER_UNIT);
    });

    it('UNIDAD_INEXISTENTE si la unidad no existe', async () => {
      unidades.findById.mockResolvedValue(null);
      await expectApiError(service.getAccountStatement(OTHER_UNIT, admin), HttpStatus.NOT_FOUND, 'UNIDAD_INEXISTENTE');
    });
  });

  describe('pay', () => {
    it('registra el pago con lo aplicado a cada cuota', async () => {
      const record = await service.pay(dto({ referencia: 'TARJ-2026' }), resident);

      expect(repository.recordPayment).toHaveBeenCalledWith(
        { unitId: UNIT, userId: 'res-1', amount: d(150), reference: 'TARJ-2026', feeIds: [10, 11] },
        expect.any(Function),
      );
      expect(record.allocations.map((a) => [a.feeId, a.amount.toFixed(2), a.resultingStatus])).toEqual([
        [10, '100.00', 'PAGADA'],
        [11, '50.00', 'PARCIAL'],
      ]);
      expect(gateway.charge).not.toHaveBeenCalled();
    });

    it('RECURSO_AJENO si la unidad del cuerpo no es la del residente', async () => {
      await expectApiError(service.pay(dto({ unidadId: OTHER_UNIT }), resident), HttpStatus.FORBIDDEN, 'RECURSO_AJENO');
      expect(repository.findFeeBalances).not.toHaveBeenCalled();
    });

    it('CUOTA_INEXISTENTE (404) si una cuota no es de la unidad', async () => {
      await expectApiError(service.pay(dto({ cuotaIds: [10, 99] }), resident), HttpStatus.NOT_FOUND, 'CUOTA_INEXISTENTE');
    });

    it('CUOTA_YA_PAGADA (409) si una cuota está pagada o anulada', async () => {
      fees = [fee(10, 100, 100, FeeStatus.PAGADA), fee(11, 100)];
      await expectApiError(service.pay(dto({ monto: 10 }), resident), HttpStatus.CONFLICT, 'CUOTA_YA_PAGADA');
    });

    it('CUOTA_YA_PAGADA (409) si la referencia ya existe, sin registrar nada', async () => {
      repository.referenceExists.mockResolvedValue(true);
      await expectApiError(service.pay(dto({ referencia: 'TARJ-2026' }), resident), HttpStatus.CONFLICT, 'CUOTA_YA_PAGADA');
      expect(repository.recordPayment).not.toHaveBeenCalled();
    });

    it('MONTO_EXCEDE_DEUDA (422) sin cobrar ni registrar', async () => {
      await expectApiError(
        service.pay(dto({ monto: 200.01, tarjetaUltimos4: '2026' }), resident),
        HttpStatus.UNPROCESSABLE_ENTITY,
        'MONTO_EXCEDE_DEUDA',
      );
      expect(gateway.charge).not.toHaveBeenCalled();
      expect(repository.recordPayment).not.toHaveBeenCalled();
    });

    it('cobra con la pasarela si se indicó tarjeta y luego registra', async () => {
      await service.pay(dto({ tarjetaUltimos4: '2026' }), resident);
      expect(gateway.charge).toHaveBeenCalledWith('2026');
      expect(repository.recordPayment).toHaveBeenCalled();
    });

    it('PAGO_RECHAZADO (402) si la pasarela rechaza, sin registrar nada', async () => {
      gateway.charge.mockResolvedValue(false);
      await expectApiError(
        service.pay(dto({ tarjetaUltimos4: '2000' }), resident),
        HttpStatus.PAYMENT_REQUIRED,
        'PAGO_RECHAZADO',
      );
      expect(repository.recordPayment).not.toHaveBeenCalled();
    });

    it('vuelve a validar dentro de la transacción: el saldo pudo cambiar durante la espera', async () => {
      gateway.charge.mockImplementation(() => {
        // Otro pago cubrió la cuota 10 mientras la pasarela procesaba.
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
});
