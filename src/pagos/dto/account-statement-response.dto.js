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
let StatementFeeDto = (() => {
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _periodo_decorators;
    let _periodo_initializers = [];
    let _periodo_extraInitializers = [];
    let _concepto_decorators;
    let _concepto_initializers = [];
    let _concepto_extraInitializers = [];
    let _monto_decorators;
    let _monto_initializers = [];
    let _monto_extraInitializers = [];
    let _fechaVencimiento_decorators;
    let _fechaVencimiento_initializers = [];
    let _fechaVencimiento_extraInitializers = [];
    let _estado_decorators;
    let _estado_initializers = [];
    let _estado_extraInitializers = [];
    let _saldo_decorators;
    let _saldo_initializers = [];
    let _saldo_extraInitializers = [];
    return class StatementFeeDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _id_decorators = [ApiProperty({ example: 301 })];
            _periodo_decorators = [ApiProperty({ example: '2026-11' })];
            _concepto_decorators = [ApiProperty({ example: 'Mantenimiento' })];
            _monto_decorators = [ApiProperty({ example: 100.0 })];
            _fechaVencimiento_decorators = [ApiProperty({ example: '2026-11-10' })];
            _estado_decorators = [ApiProperty({ enum: FeeStatus, example: FeeStatus.PENDIENTE })];
            _saldo_decorators = [ApiProperty({ example: 100.0, description: 'Monto menos la suma de sus pagos' })];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _periodo_decorators, { kind: "field", name: "periodo", static: false, private: false, access: { has: obj => "periodo" in obj, get: obj => obj.periodo, set: (obj, value) => { obj.periodo = value; } }, metadata: _metadata }, _periodo_initializers, _periodo_extraInitializers);
            __esDecorate(null, null, _concepto_decorators, { kind: "field", name: "concepto", static: false, private: false, access: { has: obj => "concepto" in obj, get: obj => obj.concepto, set: (obj, value) => { obj.concepto = value; } }, metadata: _metadata }, _concepto_initializers, _concepto_extraInitializers);
            __esDecorate(null, null, _monto_decorators, { kind: "field", name: "monto", static: false, private: false, access: { has: obj => "monto" in obj, get: obj => obj.monto, set: (obj, value) => { obj.monto = value; } }, metadata: _metadata }, _monto_initializers, _monto_extraInitializers);
            __esDecorate(null, null, _fechaVencimiento_decorators, { kind: "field", name: "fechaVencimiento", static: false, private: false, access: { has: obj => "fechaVencimiento" in obj, get: obj => obj.fechaVencimiento, set: (obj, value) => { obj.fechaVencimiento = value; } }, metadata: _metadata }, _fechaVencimiento_initializers, _fechaVencimiento_extraInitializers);
            __esDecorate(null, null, _estado_decorators, { kind: "field", name: "estado", static: false, private: false, access: { has: obj => "estado" in obj, get: obj => obj.estado, set: (obj, value) => { obj.estado = value; } }, metadata: _metadata }, _estado_initializers, _estado_extraInitializers);
            __esDecorate(null, null, _saldo_decorators, { kind: "field", name: "saldo", static: false, private: false, access: { has: obj => "saldo" in obj, get: obj => obj.saldo, set: (obj, value) => { obj.saldo = value; } }, metadata: _metadata }, _saldo_initializers, _saldo_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        id = __runInitializers(this, _id_initializers, void 0);
        periodo = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _periodo_initializers, void 0));
        concepto = (__runInitializers(this, _periodo_extraInitializers), __runInitializers(this, _concepto_initializers, void 0));
        monto = (__runInitializers(this, _concepto_extraInitializers), __runInitializers(this, _monto_initializers, void 0));
        fechaVencimiento = (__runInitializers(this, _monto_extraInitializers), __runInitializers(this, _fechaVencimiento_initializers, void 0));
        estado = (__runInitializers(this, _fechaVencimiento_extraInitializers), __runInitializers(this, _estado_initializers, void 0));
        saldo = (__runInitializers(this, _estado_extraInitializers), __runInitializers(this, _saldo_initializers, void 0));
        constructor() {
            __runInitializers(this, _saldo_extraInitializers);
        }
    };
})();
export { StatementFeeDto };
let StatementPaymentDto = (() => {
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _pagoId_decorators;
    let _pagoId_initializers = [];
    let _pagoId_extraInitializers = [];
    let _cuotaId_decorators;
    let _cuotaId_initializers = [];
    let _cuotaId_extraInitializers = [];
    let _monto_decorators;
    let _monto_initializers = [];
    let _monto_extraInitializers = [];
    let _fechaPago_decorators;
    let _fechaPago_initializers = [];
    let _fechaPago_extraInitializers = [];
    return class StatementPaymentDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _id_decorators = [ApiProperty({ example: 55, description: 'Id de lo aplicado a la cuota' })];
            _pagoId_decorators = [ApiProperty({ example: 78, description: 'Pago al que pertenece; uno puede cubrir varias cuotas' })];
            _cuotaId_decorators = [ApiProperty({ example: 300 })];
            _monto_decorators = [ApiProperty({ example: 50.0 })];
            _fechaPago_decorators = [ApiProperty({ example: '2026-10-08T10:35:00-06:00', description: 'Hora local del condominio' })];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _pagoId_decorators, { kind: "field", name: "pagoId", static: false, private: false, access: { has: obj => "pagoId" in obj, get: obj => obj.pagoId, set: (obj, value) => { obj.pagoId = value; } }, metadata: _metadata }, _pagoId_initializers, _pagoId_extraInitializers);
            __esDecorate(null, null, _cuotaId_decorators, { kind: "field", name: "cuotaId", static: false, private: false, access: { has: obj => "cuotaId" in obj, get: obj => obj.cuotaId, set: (obj, value) => { obj.cuotaId = value; } }, metadata: _metadata }, _cuotaId_initializers, _cuotaId_extraInitializers);
            __esDecorate(null, null, _monto_decorators, { kind: "field", name: "monto", static: false, private: false, access: { has: obj => "monto" in obj, get: obj => obj.monto, set: (obj, value) => { obj.monto = value; } }, metadata: _metadata }, _monto_initializers, _monto_extraInitializers);
            __esDecorate(null, null, _fechaPago_decorators, { kind: "field", name: "fechaPago", static: false, private: false, access: { has: obj => "fechaPago" in obj, get: obj => obj.fechaPago, set: (obj, value) => { obj.fechaPago = value; } }, metadata: _metadata }, _fechaPago_initializers, _fechaPago_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        id = __runInitializers(this, _id_initializers, void 0);
        pagoId = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _pagoId_initializers, void 0));
        cuotaId = (__runInitializers(this, _pagoId_extraInitializers), __runInitializers(this, _cuotaId_initializers, void 0));
        monto = (__runInitializers(this, _cuotaId_extraInitializers), __runInitializers(this, _monto_initializers, void 0));
        fechaPago = (__runInitializers(this, _monto_extraInitializers), __runInitializers(this, _fechaPago_initializers, void 0));
        constructor() {
            __runInitializers(this, _fechaPago_extraInitializers);
        }
    };
})();
export { StatementPaymentDto };
let AccountStatementResponseDto = (() => {
    let _unidadId_decorators;
    let _unidadId_initializers = [];
    let _unidadId_extraInitializers = [];
    let _saldoTotal_decorators;
    let _saldoTotal_initializers = [];
    let _saldoTotal_extraInitializers = [];
    let _cuotas_decorators;
    let _cuotas_initializers = [];
    let _cuotas_extraInitializers = [];
    let _pagos_decorators;
    let _pagos_initializers = [];
    let _pagos_extraInitializers = [];
    return class AccountStatementResponseDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _unidadId_decorators = [ApiProperty({ format: 'uuid' })];
            _saldoTotal_decorators = [ApiProperty({ example: 150.0, description: 'Suma de los saldos de las cuotas no anuladas' })];
            _cuotas_decorators = [ApiProperty({ type: [StatementFeeDto], description: 'Por fecha de vencimiento descendente' })];
            _pagos_decorators = [ApiProperty({ type: [StatementPaymentDto], description: 'Del más reciente al más antiguo' })];
            __esDecorate(null, null, _unidadId_decorators, { kind: "field", name: "unidadId", static: false, private: false, access: { has: obj => "unidadId" in obj, get: obj => obj.unidadId, set: (obj, value) => { obj.unidadId = value; } }, metadata: _metadata }, _unidadId_initializers, _unidadId_extraInitializers);
            __esDecorate(null, null, _saldoTotal_decorators, { kind: "field", name: "saldoTotal", static: false, private: false, access: { has: obj => "saldoTotal" in obj, get: obj => obj.saldoTotal, set: (obj, value) => { obj.saldoTotal = value; } }, metadata: _metadata }, _saldoTotal_initializers, _saldoTotal_extraInitializers);
            __esDecorate(null, null, _cuotas_decorators, { kind: "field", name: "cuotas", static: false, private: false, access: { has: obj => "cuotas" in obj, get: obj => obj.cuotas, set: (obj, value) => { obj.cuotas = value; } }, metadata: _metadata }, _cuotas_initializers, _cuotas_extraInitializers);
            __esDecorate(null, null, _pagos_decorators, { kind: "field", name: "pagos", static: false, private: false, access: { has: obj => "pagos" in obj, get: obj => obj.pagos, set: (obj, value) => { obj.pagos = value; } }, metadata: _metadata }, _pagos_initializers, _pagos_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        unidadId = __runInitializers(this, _unidadId_initializers, void 0);
        saldoTotal = (__runInitializers(this, _unidadId_extraInitializers), __runInitializers(this, _saldoTotal_initializers, void 0));
        cuotas = (__runInitializers(this, _saldoTotal_extraInitializers), __runInitializers(this, _cuotas_initializers, void 0));
        pagos = (__runInitializers(this, _cuotas_extraInitializers), __runInitializers(this, _pagos_initializers, void 0));
        static fromStatement(statement, timeZone) {
            return {
                unidadId: statement.unitId,
                saldoTotal: statement.total.toNumber(),
                cuotas: statement.fees.map((fee) => ({
                    id: fee.id,
                    periodo: fee.period,
                    concepto: fee.concept,
                    monto: fee.amount.toNumber(),
                    // Columna DATE: llega como medianoche UTC.
                    fechaVencimiento: fee.dueDate.toISOString().slice(0, 10),
                    estado: fee.status,
                    saldo: fee.balance.toNumber(),
                })),
                pagos: statement.payments.map((line) => ({
                    id: line.id,
                    pagoId: line.paymentId,
                    cuotaId: line.feeId,
                    monto: line.amount.toNumber(),
                    fechaPago: toZonedIso(line.paidAt, timeZone),
                })),
            };
        }
        constructor() {
            __runInitializers(this, _pagos_extraInitializers);
        }
    };
})();
export { AccountStatementResponseDto };
