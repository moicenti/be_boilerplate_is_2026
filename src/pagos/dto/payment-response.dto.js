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
import { ApiProperty } from '@nestjs/swagger';
import { FeeStatus } from '@PrismaClient';
import { toZonedIso } from '@CommonAreas/utils';
let AppliedFeeDto = (() => {
    let _cuotaId_decorators;
    let _cuotaId_initializers = [];
    let _cuotaId_extraInitializers = [];
    let _montoAplicado_decorators;
    let _montoAplicado_initializers = [];
    let _montoAplicado_extraInitializers = [];
    let _estadoResultante_decorators;
    let _estadoResultante_initializers = [];
    let _estadoResultante_extraInitializers = [];
    return class AppliedFeeDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _cuotaId_decorators = [ApiProperty({ example: 301 })];
            _montoAplicado_decorators = [ApiProperty({ example: 100.0, description: '0 si el monto no alcanzó para esta cuota' })];
            _estadoResultante_decorators = [ApiProperty({ enum: FeeStatus, example: FeeStatus.PAGADA })];
            __esDecorate(null, null, _cuotaId_decorators, { kind: "field", name: "cuotaId", static: false, private: false, access: { has: obj => "cuotaId" in obj, get: obj => obj.cuotaId, set: (obj, value) => { obj.cuotaId = value; } }, metadata: _metadata }, _cuotaId_initializers, _cuotaId_extraInitializers);
            __esDecorate(null, null, _montoAplicado_decorators, { kind: "field", name: "montoAplicado", static: false, private: false, access: { has: obj => "montoAplicado" in obj, get: obj => obj.montoAplicado, set: (obj, value) => { obj.montoAplicado = value; } }, metadata: _metadata }, _montoAplicado_initializers, _montoAplicado_extraInitializers);
            __esDecorate(null, null, _estadoResultante_decorators, { kind: "field", name: "estadoResultante", static: false, private: false, access: { has: obj => "estadoResultante" in obj, get: obj => obj.estadoResultante, set: (obj, value) => { obj.estadoResultante = value; } }, metadata: _metadata }, _estadoResultante_initializers, _estadoResultante_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        cuotaId = __runInitializers(this, _cuotaId_initializers, void 0);
        montoAplicado = (__runInitializers(this, _cuotaId_extraInitializers), __runInitializers(this, _montoAplicado_initializers, void 0));
        estadoResultante = (__runInitializers(this, _montoAplicado_extraInitializers), __runInitializers(this, _estadoResultante_initializers, void 0));
        constructor() {
            __runInitializers(this, _estadoResultante_extraInitializers);
        }
    };
})();
export { AppliedFeeDto };
let PaymentResponseDto = (() => {
    let _pagoId_decorators;
    let _pagoId_initializers = [];
    let _pagoId_extraInitializers = [];
    let _fechaPago_decorators;
    let _fechaPago_initializers = [];
    let _fechaPago_extraInitializers = [];
    let _aplicado_decorators;
    let _aplicado_initializers = [];
    let _aplicado_extraInitializers = [];
    let _saldoRestante_decorators;
    let _saldoRestante_initializers = [];
    let _saldoRestante_extraInitializers = [];
    return class PaymentResponseDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _pagoId_decorators = [ApiProperty({ example: 78 })];
            _fechaPago_decorators = [ApiProperty({ example: '2026-11-05T10:35:00-06:00', description: 'Hora local del condominio' })];
            _aplicado_decorators = [ApiProperty({ type: [AppliedFeeDto], description: 'Por fecha de vencimiento ascendente' })];
            _saldoRestante_decorators = [ApiProperty({ example: 50.0, description: 'Saldo total de la unidad después del pago' })];
            __esDecorate(null, null, _pagoId_decorators, { kind: "field", name: "pagoId", static: false, private: false, access: { has: obj => "pagoId" in obj, get: obj => obj.pagoId, set: (obj, value) => { obj.pagoId = value; } }, metadata: _metadata }, _pagoId_initializers, _pagoId_extraInitializers);
            __esDecorate(null, null, _fechaPago_decorators, { kind: "field", name: "fechaPago", static: false, private: false, access: { has: obj => "fechaPago" in obj, get: obj => obj.fechaPago, set: (obj, value) => { obj.fechaPago = value; } }, metadata: _metadata }, _fechaPago_initializers, _fechaPago_extraInitializers);
            __esDecorate(null, null, _aplicado_decorators, { kind: "field", name: "aplicado", static: false, private: false, access: { has: obj => "aplicado" in obj, get: obj => obj.aplicado, set: (obj, value) => { obj.aplicado = value; } }, metadata: _metadata }, _aplicado_initializers, _aplicado_extraInitializers);
            __esDecorate(null, null, _saldoRestante_decorators, { kind: "field", name: "saldoRestante", static: false, private: false, access: { has: obj => "saldoRestante" in obj, get: obj => obj.saldoRestante, set: (obj, value) => { obj.saldoRestante = value; } }, metadata: _metadata }, _saldoRestante_initializers, _saldoRestante_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        pagoId = __runInitializers(this, _pagoId_initializers, void 0);
        fechaPago = (__runInitializers(this, _pagoId_extraInitializers), __runInitializers(this, _fechaPago_initializers, void 0));
        aplicado = (__runInitializers(this, _fechaPago_extraInitializers), __runInitializers(this, _aplicado_initializers, void 0));
        saldoRestante = (__runInitializers(this, _aplicado_extraInitializers), __runInitializers(this, _saldoRestante_initializers, void 0));
        static fromRecord(record, timeZone) {
            return {
                pagoId: record.paymentId,
                fechaPago: toZonedIso(record.paidAt, timeZone),
                aplicado: record.allocations.map((a) => ({
                    cuotaId: a.feeId,
                    montoAplicado: a.amount.toNumber(),
                    estadoResultante: a.resultingStatus,
                })),
                saldoRestante: record.unitBalance.toNumber(),
            };
        }
        constructor() {
            __runInitializers(this, _saldoRestante_extraInitializers);
        }
    };
})();
export { PaymentResponseDto };
