var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
import { Controller, Post, UseFilters } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOperation, ApiPaymentRequiredResponse, ApiTags, ApiUnauthorizedResponse, ApiUnprocessableEntityResponse, } from '@nestjs/swagger';
import { Role } from '@PrismaClient';
import { Roles } from '@Auth/decorators';
import { ApiExceptionFilter } from '@Common/filters';
import { PaymentResponseDto } from '../dto/index.js';
let PaymentsController = (() => {
    let _classDecorators = [ApiTags('pagos'), ApiBearerAuth(), ApiUnauthorizedResponse({ description: 'NO_AUTENTICADO' }), UseFilters(ApiExceptionFilter), Controller('pagos')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _pay_decorators;
    var PaymentsController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _pay_decorators = [Post(), Roles(Role.RESIDENTE), ApiOperation({
                    summary: 'Paga una o varias cuotas de la unidad del residente',
                    description: 'El monto se aplica por fecha de vencimiento ascendente: la cuota queda PAGADA si su ' +
                        'saldo llega a 0 o PARCIAL si le queda saldo. Todo ocurre en una sola transacción.',
                }), ApiCreatedResponse({ type: PaymentResponseDto }), ApiBadRequestResponse({ description: 'SOLICITUD_INVALIDA: lista vacía o monto menor o igual a 0' }), ApiPaymentRequiredResponse({ description: 'PAGO_RECHAZADO: la tarjeta de prueba termina en 2000' }), ApiForbiddenResponse({ description: 'ROL_NO_PERMITIDO / RECURSO_AJENO: unidad ajena' }), ApiNotFoundResponse({ description: 'CUOTA_INEXISTENTE' }), ApiConflictResponse({ description: 'CUOTA_YA_PAGADA: cuota pagada o anulada, o referencia repetida' }), ApiUnprocessableEntityResponse({ description: 'MONTO_EXCEDE_DEUDA' })];
            __esDecorate(this, null, _pay_decorators, { kind: "method", name: "pay", static: false, private: false, access: { has: obj => "pay" in obj, get: obj => obj.pay }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            PaymentsController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        paymentsService = __runInitializers(this, _instanceExtraInitializers);
        timeZone;
        constructor(paymentsService, configService) {
            this.paymentsService = paymentsService;
            this.timeZone = configService.get('APP_TIMEZONE', { infer: true });
        }
        async pay(dto, user) {
            const record = await this.paymentsService.pay(dto, user);
            return PaymentResponseDto.fromRecord(record, this.timeZone);
        }
    };
    return PaymentsController = _classThis;
})();
export { PaymentsController };
