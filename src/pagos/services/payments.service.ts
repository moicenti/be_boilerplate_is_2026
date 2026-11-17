import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, Role, type User } from '@PrismaClient';
import { ApiException } from '@Common/errors';
import { UnidadesService } from '@Unidades/services';
import {
  PaymentRepository,
  type FeeWithPaid,
  type PaymentLine,
  type RecordedPayment,
} from '../repositories/index.js';
import { PaymentPlanError, PaymentReferenceTakenError } from '../errors/index.js';
import { balanceOf, planPayment, totalBalance } from '../utils/index.js';
import type { CreatePaymentDto } from '../dto/index.js';
import { SimulatedCardGateway } from './simulated-card-gateway.js';

export interface AccountStatement {
  unitId: string;
  total: Prisma.Decimal;
  fees: (FeeWithPaid & { balance: Prisma.Decimal })[];
  payments: PaymentLine[];
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly unidadesService: UnidadesService,
    private readonly cardGateway: SimulatedCardGateway,
  ) {}

  /** Estado de cuenta (BE-1.1). El residente solo ve su unidad; el administrador, cualquiera. */
  async getAccountStatement(unitId: string, user: User): Promise<AccountStatement> {
    // Antes de buscar la unidad: a un residente no se le confirma si una unidad ajena existe.
    this.ensureOwnUnit(unitId, user);

    if (!(await this.unidadesService.findById(unitId))) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'UNIDAD_INEXISTENTE', 'La unidad no existe.');
    }

    const { fees, payments } = await this.paymentRepository.findAccountStatement(unitId);
    return {
      unitId,
      total: totalBalance(fees),
      fees: fees.map((fee) => ({ ...fee, balance: balanceOf(fee) })),
      payments,
    };
  }

  /**
   * Pago de cuotas (BE-1.2). Valida contra el saldo actual, cobra con la pasarela simulada si
   * se indicó tarjeta y registra todo en una sola transacción, donde vuelve a validar: el saldo
   * pudo cambiar durante la espera de la pasarela.
   */
  async pay(dto: CreatePaymentDto, user: User): Promise<RecordedPayment> {
    this.ensureOwnUnit(dto.unidadId, user);

    const amount = new Prisma.Decimal(dto.monto);
    const reference = dto.referencia ?? null;
    const plan = (fees: Parameters<typeof planPayment>[1]) =>
      planPayment(dto.cuotaIds, fees, amount);

    try {
      // Validación previa: no se cobra con la tarjeta un pago que no se podría registrar.
      plan(await this.paymentRepository.findFeeBalances(dto.unidadId, dto.cuotaIds));
      if (reference !== null && (await this.paymentRepository.referenceExists(reference))) {
        throw new PaymentReferenceTakenError(reference);
      }

      if (dto.tarjetaUltimos4 !== undefined && !(await this.cardGateway.charge(dto.tarjetaUltimos4))) {
        throw new ApiException(
          HttpStatus.PAYMENT_REQUIRED,
          'PAGO_RECHAZADO',
          'La tarjeta fue rechazada. No se realizó ningún cobro.',
        );
      }

      return await this.paymentRepository.recordPayment(
        { unitId: dto.unidadId, userId: user.id, amount, reference, feeIds: dto.cuotaIds },
        plan,
      );
    } catch (error) {
      throw this.translateError(error, amount);
    }
  }

  private ensureOwnUnit(unitId: string, user: User): void {
    if (user.role === Role.ADMINISTRADOR) return;
    if (user.unitId !== unitId) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        'RECURSO_AJENO',
        'La unidad no pertenece a tu cuenta.',
      );
    }
  }

  private translateError(error: unknown, amount: Prisma.Decimal): unknown {
    if (error instanceof PaymentReferenceTakenError) {
      return new ApiException(HttpStatus.CONFLICT, 'CUOTA_YA_PAGADA', error.message);
    }
    if (!(error instanceof PaymentPlanError)) return error;

    const ids = error.feeIds.join(', ');
    switch (error.reason) {
      case 'CUOTA_INEXISTENTE':
        return new ApiException(
          HttpStatus.NOT_FOUND,
          'CUOTA_INEXISTENTE',
          `No existe en tu unidad: cuota ${ids}.`,
        );
      case 'CUOTA_YA_PAGADA':
        return new ApiException(
          HttpStatus.CONFLICT,
          'CUOTA_YA_PAGADA',
          `Ya está pagada o anulada: cuota ${ids}.`,
        );
      case 'MONTO_EXCEDE_DEUDA':
        return new ApiException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'MONTO_EXCEDE_DEUDA',
          `El monto (${amount.toFixed(2)}) supera lo adeudado en las cuotas elegidas ` +
            `(${error.debt?.toFixed(2) ?? '0.00'}). No se realizó ningún cobro.`,
        );
    }
  }
}
