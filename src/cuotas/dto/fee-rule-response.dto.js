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
import { FeeAmountType, FeeRuleScope, FeeRuleStatus, InactiveUnitPolicy, UnitType, } from '@PrismaClient';
import { toZonedIso } from '@CommonAreas/utils';
let TypeAmountResponseDto = (() => {
    let _tipo_decorators;
    let _tipo_initializers = [];
    let _tipo_extraInitializers = [];
    let _monto_decorators;
    let _monto_initializers = [];
    let _monto_extraInitializers = [];
    return class TypeAmountResponseDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _tipo_decorators = [ApiProperty({ enum: UnitType })];
            _monto_decorators = [ApiProperty({ example: 100.0 })];
            __esDecorate(null, null, _tipo_decorators, { kind: "field", name: "tipo", static: false, private: false, access: { has: obj => "tipo" in obj, get: obj => obj.tipo, set: (obj, value) => { obj.tipo = value; } }, metadata: _metadata }, _tipo_initializers, _tipo_extraInitializers);
            __esDecorate(null, null, _monto_decorators, { kind: "field", name: "monto", static: false, private: false, access: { has: obj => "monto" in obj, get: obj => obj.monto, set: (obj, value) => { obj.monto = value; } }, metadata: _metadata }, _monto_initializers, _monto_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        tipo = __runInitializers(this, _tipo_initializers, void 0);
        monto = (__runInitializers(this, _tipo_extraInitializers), __runInitializers(this, _monto_initializers, void 0));
        constructor() {
            __runInitializers(this, _monto_extraInitializers);
        }
    };
})();
let FeeRuleResponseDto = (() => {
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _estado_decorators;
    let _estado_initializers = [];
    let _estado_extraInitializers = [];
    let _concepto_decorators;
    let _concepto_initializers = [];
    let _concepto_extraInitializers = [];
    let _tipoMonto_decorators;
    let _tipoMonto_initializers = [];
    let _tipoMonto_extraInitializers = [];
    let _monto_decorators;
    let _monto_initializers = [];
    let _monto_extraInitializers = [];
    let _montosPorTipo_decorators;
    let _montosPorTipo_initializers = [];
    let _montosPorTipo_extraInitializers = [];
    let _diaGeneracion_decorators;
    let _diaGeneracion_initializers = [];
    let _diaGeneracion_extraInitializers = [];
    let _diaVencimiento_decorators;
    let _diaVencimiento_initializers = [];
    let _diaVencimiento_extraInitializers = [];
    let _alcance_decorators;
    let _alcance_initializers = [];
    let _alcance_extraInitializers = [];
    let _alcanceValor_decorators;
    let _alcanceValor_initializers = [];
    let _alcanceValor_extraInitializers = [];
    let _unidadIds_decorators;
    let _unidadIds_initializers = [];
    let _unidadIds_extraInitializers = [];
    let _politicaInactivas_decorators;
    let _politicaInactivas_initializers = [];
    let _politicaInactivas_extraInitializers = [];
    let _unidadesAplicables_decorators;
    let _unidadesAplicables_initializers = [];
    let _unidadesAplicables_extraInitializers = [];
    let _creadoEn_decorators;
    let _creadoEn_initializers = [];
    let _creadoEn_extraInitializers = [];
    let _actualizadoEn_decorators;
    let _actualizadoEn_initializers = [];
    let _actualizadoEn_extraInitializers = [];
    return class FeeRuleResponseDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _id_decorators = [ApiProperty({ example: 4 })];
            _estado_decorators = [ApiProperty({ enum: FeeRuleStatus })];
            _concepto_decorators = [ApiProperty({ example: 'Mantenimiento' })];
            _tipoMonto_decorators = [ApiProperty({ enum: FeeAmountType })];
            _monto_decorators = [ApiProperty({ example: 100.0, nullable: true, type: Number })];
            _montosPorTipo_decorators = [ApiProperty({ type: [TypeAmountResponseDto] })];
            _diaGeneracion_decorators = [ApiProperty({ example: 1 })];
            _diaVencimiento_decorators = [ApiProperty({ example: 10 })];
            _alcance_decorators = [ApiProperty({ enum: FeeRuleScope })];
            _alcanceValor_decorators = [ApiProperty({ example: null, nullable: true, type: String })];
            _unidadIds_decorators = [ApiProperty({ type: [String], format: 'uuid' })];
            _politicaInactivas_decorators = [ApiProperty({ enum: InactiveUnitPolicy })];
            _unidadesAplicables_decorators = [ApiProperty({
                    example: 48,
                    description: 'Unidades que abarca hoy el alcance',
                })];
            _creadoEn_decorators = [ApiProperty({ example: '2026-11-05T09:00:00-06:00' })];
            _actualizadoEn_decorators = [ApiProperty({ example: '2026-11-05T09:00:00-06:00' })];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _estado_decorators, { kind: "field", name: "estado", static: false, private: false, access: { has: obj => "estado" in obj, get: obj => obj.estado, set: (obj, value) => { obj.estado = value; } }, metadata: _metadata }, _estado_initializers, _estado_extraInitializers);
            __esDecorate(null, null, _concepto_decorators, { kind: "field", name: "concepto", static: false, private: false, access: { has: obj => "concepto" in obj, get: obj => obj.concepto, set: (obj, value) => { obj.concepto = value; } }, metadata: _metadata }, _concepto_initializers, _concepto_extraInitializers);
            __esDecorate(null, null, _tipoMonto_decorators, { kind: "field", name: "tipoMonto", static: false, private: false, access: { has: obj => "tipoMonto" in obj, get: obj => obj.tipoMonto, set: (obj, value) => { obj.tipoMonto = value; } }, metadata: _metadata }, _tipoMonto_initializers, _tipoMonto_extraInitializers);
            __esDecorate(null, null, _monto_decorators, { kind: "field", name: "monto", static: false, private: false, access: { has: obj => "monto" in obj, get: obj => obj.monto, set: (obj, value) => { obj.monto = value; } }, metadata: _metadata }, _monto_initializers, _monto_extraInitializers);
            __esDecorate(null, null, _montosPorTipo_decorators, { kind: "field", name: "montosPorTipo", static: false, private: false, access: { has: obj => "montosPorTipo" in obj, get: obj => obj.montosPorTipo, set: (obj, value) => { obj.montosPorTipo = value; } }, metadata: _metadata }, _montosPorTipo_initializers, _montosPorTipo_extraInitializers);
            __esDecorate(null, null, _diaGeneracion_decorators, { kind: "field", name: "diaGeneracion", static: false, private: false, access: { has: obj => "diaGeneracion" in obj, get: obj => obj.diaGeneracion, set: (obj, value) => { obj.diaGeneracion = value; } }, metadata: _metadata }, _diaGeneracion_initializers, _diaGeneracion_extraInitializers);
            __esDecorate(null, null, _diaVencimiento_decorators, { kind: "field", name: "diaVencimiento", static: false, private: false, access: { has: obj => "diaVencimiento" in obj, get: obj => obj.diaVencimiento, set: (obj, value) => { obj.diaVencimiento = value; } }, metadata: _metadata }, _diaVencimiento_initializers, _diaVencimiento_extraInitializers);
            __esDecorate(null, null, _alcance_decorators, { kind: "field", name: "alcance", static: false, private: false, access: { has: obj => "alcance" in obj, get: obj => obj.alcance, set: (obj, value) => { obj.alcance = value; } }, metadata: _metadata }, _alcance_initializers, _alcance_extraInitializers);
            __esDecorate(null, null, _alcanceValor_decorators, { kind: "field", name: "alcanceValor", static: false, private: false, access: { has: obj => "alcanceValor" in obj, get: obj => obj.alcanceValor, set: (obj, value) => { obj.alcanceValor = value; } }, metadata: _metadata }, _alcanceValor_initializers, _alcanceValor_extraInitializers);
            __esDecorate(null, null, _unidadIds_decorators, { kind: "field", name: "unidadIds", static: false, private: false, access: { has: obj => "unidadIds" in obj, get: obj => obj.unidadIds, set: (obj, value) => { obj.unidadIds = value; } }, metadata: _metadata }, _unidadIds_initializers, _unidadIds_extraInitializers);
            __esDecorate(null, null, _politicaInactivas_decorators, { kind: "field", name: "politicaInactivas", static: false, private: false, access: { has: obj => "politicaInactivas" in obj, get: obj => obj.politicaInactivas, set: (obj, value) => { obj.politicaInactivas = value; } }, metadata: _metadata }, _politicaInactivas_initializers, _politicaInactivas_extraInitializers);
            __esDecorate(null, null, _unidadesAplicables_decorators, { kind: "field", name: "unidadesAplicables", static: false, private: false, access: { has: obj => "unidadesAplicables" in obj, get: obj => obj.unidadesAplicables, set: (obj, value) => { obj.unidadesAplicables = value; } }, metadata: _metadata }, _unidadesAplicables_initializers, _unidadesAplicables_extraInitializers);
            __esDecorate(null, null, _creadoEn_decorators, { kind: "field", name: "creadoEn", static: false, private: false, access: { has: obj => "creadoEn" in obj, get: obj => obj.creadoEn, set: (obj, value) => { obj.creadoEn = value; } }, metadata: _metadata }, _creadoEn_initializers, _creadoEn_extraInitializers);
            __esDecorate(null, null, _actualizadoEn_decorators, { kind: "field", name: "actualizadoEn", static: false, private: false, access: { has: obj => "actualizadoEn" in obj, get: obj => obj.actualizadoEn, set: (obj, value) => { obj.actualizadoEn = value; } }, metadata: _metadata }, _actualizadoEn_initializers, _actualizadoEn_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        id = __runInitializers(this, _id_initializers, void 0);
        estado = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _estado_initializers, void 0));
        concepto = (__runInitializers(this, _estado_extraInitializers), __runInitializers(this, _concepto_initializers, void 0));
        tipoMonto = (__runInitializers(this, _concepto_extraInitializers), __runInitializers(this, _tipoMonto_initializers, void 0));
        monto = (__runInitializers(this, _tipoMonto_extraInitializers), __runInitializers(this, _monto_initializers, void 0));
        montosPorTipo = (__runInitializers(this, _monto_extraInitializers), __runInitializers(this, _montosPorTipo_initializers, void 0));
        diaGeneracion = (__runInitializers(this, _montosPorTipo_extraInitializers), __runInitializers(this, _diaGeneracion_initializers, void 0));
        diaVencimiento = (__runInitializers(this, _diaGeneracion_extraInitializers), __runInitializers(this, _diaVencimiento_initializers, void 0));
        alcance = (__runInitializers(this, _diaVencimiento_extraInitializers), __runInitializers(this, _alcance_initializers, void 0));
        alcanceValor = (__runInitializers(this, _alcance_extraInitializers), __runInitializers(this, _alcanceValor_initializers, void 0));
        unidadIds = (__runInitializers(this, _alcanceValor_extraInitializers), __runInitializers(this, _unidadIds_initializers, void 0));
        politicaInactivas = (__runInitializers(this, _unidadIds_extraInitializers), __runInitializers(this, _politicaInactivas_initializers, void 0));
        unidadesAplicables = (__runInitializers(this, _politicaInactivas_extraInitializers), __runInitializers(this, _unidadesAplicables_initializers, void 0));
        creadoEn = (__runInitializers(this, _unidadesAplicables_extraInitializers), __runInitializers(this, _creadoEn_initializers, void 0));
        actualizadoEn = (__runInitializers(this, _creadoEn_extraInitializers), __runInitializers(this, _actualizadoEn_initializers, void 0));
        static fromEntity(rule, applicableUnits, timeZone) {
            return {
                id: rule.id,
                estado: rule.status,
                concepto: rule.concept,
                tipoMonto: rule.amountType,
                monto: rule.amount === null ? null : rule.amount.toNumber(),
                montosPorTipo: rule.typeAmounts.map((t) => ({
                    tipo: t.unitType,
                    monto: t.amount.toNumber(),
                })),
                diaGeneracion: rule.generationDay,
                diaVencimiento: rule.dueDay,
                alcance: rule.scope,
                alcanceValor: rule.scopeValue,
                unidadIds: rule.units.map((u) => u.unitId),
                politicaInactivas: rule.inactivePolicy,
                unidadesAplicables: applicableUnits,
                creadoEn: toZonedIso(rule.createdAt, timeZone),
                actualizadoEn: toZonedIso(rule.updatedAt, timeZone),
            };
        }
        constructor() {
            __runInitializers(this, _actualizadoEn_extraInitializers);
        }
    };
})();
export { FeeRuleResponseDto };
let FeeRuleStatusResponseDto = (() => {
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _estado_decorators;
    let _estado_initializers = [];
    let _estado_extraInitializers = [];
    return class FeeRuleStatusResponseDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _id_decorators = [ApiProperty({ example: 4 })];
            _estado_decorators = [ApiProperty({ enum: FeeRuleStatus, example: FeeRuleStatus.PAUSADA })];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _estado_decorators, { kind: "field", name: "estado", static: false, private: false, access: { has: obj => "estado" in obj, get: obj => obj.estado, set: (obj, value) => { obj.estado = value; } }, metadata: _metadata }, _estado_initializers, _estado_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        id = __runInitializers(this, _id_initializers, void 0);
        estado = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _estado_initializers, void 0));
        constructor() {
            __runInitializers(this, _estado_extraInitializers);
        }
    };
})();
export { FeeRuleStatusResponseDto };
