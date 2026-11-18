var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, Role } from '@PrismaClient';
import { ApiException } from '@Common/errors';
import { PaymentPlanError, PaymentReferenceTakenError } from '../errors/index.js';
import { balanceOf, planPayment, totalBalance } from '../utils/index.js';
let PaymentsService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var PaymentsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            PaymentsService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        paymentRepository;
        unidadesService;
        cardGateway;
        constructor(paymentRepository, unidadesService, cardGateway) {
            this.paymentRepository = paymentRepository;
            this.unidadesService = unidadesService;
            this.cardGateway = cardGateway;
        }
        /** Estado de cuenta (BE-1.1). El residente solo ve su unidad; el administrador, cualquiera. */
        async getAccountStatement(unitId, user) {
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
        async pay(dto, user) {
            this.ensureOwnUnit(dto.unidadId, user);
            const amount = new Prisma.Decimal(dto.monto);
            const reference = dto.referencia ?? null;
            const plan = (fees) => planPayment(dto.cuotaIds, fees, amount);
            try {
                // Validación previa: no se cobra con la tarjeta un pago que no se podría registrar.
                plan(await this.paymentRepository.findFeeBalances(dto.unidadId, dto.cuotaIds));
                if (reference !== null && (await this.paymentRepository.referenceExists(reference))) {
                    throw new PaymentReferenceTakenError(reference);
                }
                if (dto.tarjetaUltimos4 !== undefined && !(await this.cardGateway.charge(dto.tarjetaUltimos4))) {
                    throw new ApiException(HttpStatus.PAYMENT_REQUIRED, 'PAGO_RECHAZADO', 'La tarjeta fue rechazada. No se realizó ningún cobro.');
                }
                return await this.paymentRepository.recordPayment({ unitId: dto.unidadId, userId: user.id, amount, reference, feeIds: dto.cuotaIds }, plan);
            }
            catch (error) {
                throw this.translateError(error, amount);
            }
        }
        ensureOwnUnit(unitId, user) {
            if (user.role === Role.ADMINISTRADOR)
                return;
            if (user.unitId !== unitId) {
                throw new ApiException(HttpStatus.FORBIDDEN, 'RECURSO_AJENO', 'La unidad no pertenece a tu cuenta.');
            }
        }
        translateError(error, amount) {
            if (error instanceof PaymentReferenceTakenError) {
                return new ApiException(HttpStatus.CONFLICT, 'CUOTA_YA_PAGADA', error.message);
            }
            if (!(error instanceof PaymentPlanError))
                return error;
            const ids = error.feeIds.join(', ');
            switch (error.reason) {
                case 'CUOTA_INEXISTENTE':
                    return new ApiException(HttpStatus.NOT_FOUND, 'CUOTA_INEXISTENTE', `No existe en tu unidad: cuota ${ids}.`);
                case 'CUOTA_YA_PAGADA':
                    return new ApiException(HttpStatus.CONFLICT, 'CUOTA_YA_PAGADA', `Ya está pagada o anulada: cuota ${ids}.`);
                case 'MONTO_EXCEDE_DEUDA':
                    return new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, 'MONTO_EXCEDE_DEUDA', `El monto (${amount.toFixed(2)}) supera lo adeudado en las cuotas elegidas ` +
                        `(${error.debt?.toFixed(2) ?? '0.00'}). No se realizó ningún cobro.`);
            }
        }
    };
    return PaymentsService = _classThis;
})();
export { PaymentsService };
