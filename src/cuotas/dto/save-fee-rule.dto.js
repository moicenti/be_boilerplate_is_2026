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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsEnum, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Max, MaxLength, Min, ValidateNested, } from 'class-validator';
import { FeeAmountType, FeeRuleScope, FeeRuleStatus, InactiveUnitPolicy, UnitType, } from '@PrismaClient';
const MAX_AMOUNT = 9_999_999_999.99;
// Recorta y colapsa espacios: "  Cuota   de mantenimiento " → "Cuota de mantenimiento".
const normalizeText = ({ value }) => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;
let TypeAmountDto = (() => {
    let _tipo_decorators;
    let _tipo_initializers = [];
    let _tipo_extraInitializers = [];
    let _monto_decorators;
    let _monto_initializers = [];
    let _monto_extraInitializers = [];
    return class TypeAmountDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _tipo_decorators = [ApiProperty({ enum: UnitType, example: UnitType.DEPARTAMENTO }), IsEnum(UnitType, { message: 'tipo debe ser DEPARTAMENTO, CASA o LOCAL' })];
            _monto_decorators = [ApiProperty({ example: 100.0 }), IsNumber({ maxDecimalPlaces: 2 }, { message: 'monto debe ser un número con hasta 2 decimales' }), IsPositive({ message: 'monto debe ser mayor a 0' }), Max(MAX_AMOUNT, { message: 'monto es demasiado grande' })];
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
export { TypeAmountDto };
let SaveFeeRuleDto = (() => {
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
    return class SaveFeeRuleDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _concepto_decorators = [ApiProperty({ example: 'Mantenimiento', maxLength: 100 }), Transform(normalizeText), IsString({ message: 'concepto debe ser texto' }), IsNotEmpty({ message: 'concepto es obligatorio' }), MaxLength(100, { message: 'concepto no puede exceder los 100 caracteres' })];
            _tipoMonto_decorators = [ApiProperty({ enum: FeeAmountType, example: FeeAmountType.FIJO }), IsEnum(FeeAmountType, {
                    message: 'tipoMonto debe ser FIJO o POR_TIPO_UNIDAD',
                })];
            _monto_decorators = [ApiPropertyOptional({
                    example: 100.0,
                    nullable: true,
                    description: 'Monto por unidad (tipoMonto FIJO). Sin él la regla no se puede activar.',
                }), IsOptional(), IsNumber({ maxDecimalPlaces: 2 }, { message: 'monto debe ser un número con hasta 2 decimales' }), IsPositive({ message: 'monto debe ser mayor a 0' }), Max(MAX_AMOUNT, { message: 'monto es demasiado grande' })];
            _montosPorTipo_decorators = [ApiPropertyOptional({
                    type: [TypeAmountDto],
                    description: 'Monto de cada tipo de unidad (tipoMonto POR_TIPO_UNIDAD).',
                }), IsOptional(), IsArray({ message: 'montosPorTipo debe ser una lista' }), ArrayMaxSize(Object.keys(UnitType).length, {
                    message: 'montosPorTipo tiene tipos de más',
                }), ValidateNested({ each: true }), Type(() => TypeAmountDto)];
            _diaGeneracion_decorators = [ApiProperty({ example: 1, minimum: 1, maximum: 28 }), IsInt({ message: 'diaGeneracion debe ser un número entero' }), Min(1, { message: 'diaGeneracion debe estar entre 1 y 28' }), Max(28, { message: 'diaGeneracion debe estar entre 1 y 28' })];
            _diaVencimiento_decorators = [ApiProperty({
                    example: 10,
                    minimum: 1,
                    maximum: 28,
                    description: 'Mayor o igual a diaGeneracion',
                }), IsInt({ message: 'diaVencimiento debe ser un número entero' }), Min(1, { message: 'diaVencimiento debe estar entre 1 y 28' }), Max(28, { message: 'diaVencimiento debe estar entre 1 y 28' })];
            _alcance_decorators = [ApiProperty({ enum: FeeRuleScope, example: FeeRuleScope.TODAS }), IsEnum(FeeRuleScope, {
                    message: 'alcance debe ser TODAS, TIPO, TORRE o SELECCION',
                })];
            _alcanceValor_decorators = [ApiPropertyOptional({
                    example: 'Torre A',
                    nullable: true,
                    description: 'Obligatorio con alcance TORRE (nombre de la torre) o TIPO (tipo de unidad).',
                }), IsOptional(), Transform(normalizeText), IsString({ message: 'alcanceValor debe ser texto' }), IsNotEmpty({ message: 'alcanceValor no puede estar vacío' }), MaxLength(50, { message: 'alcanceValor no puede exceder los 50 caracteres' })];
            _unidadIds_decorators = [ApiPropertyOptional({
                    type: [String],
                    format: 'uuid',
                    example: [],
                    description: 'Unidades de la regla; solo con alcance SELECCION.',
                }), IsOptional(), IsArray({ message: 'unidadIds debe ser una lista' }), ArrayMaxSize(5000, { message: 'unidadIds tiene demasiados elementos' }), IsUUID('all', {
                    each: true,
                    message: 'cada elemento de unidadIds debe ser un UUID',
                })];
            _politicaInactivas_decorators = [ApiPropertyOptional({
                    enum: InactiveUnitPolicy,
                    default: InactiveUnitPolicy.OMITIR,
                }), IsOptional(), IsEnum(InactiveUnitPolicy, {
                    message: 'politicaInactivas debe ser GENERAR, OMITIR o REVISAR',
                })];
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
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        concepto = __runInitializers(this, _concepto_initializers, void 0);
        tipoMonto = (__runInitializers(this, _concepto_extraInitializers), __runInitializers(this, _tipoMonto_initializers, void 0));
        monto = (__runInitializers(this, _tipoMonto_extraInitializers), __runInitializers(this, _monto_initializers, void 0));
        montosPorTipo = (__runInitializers(this, _monto_extraInitializers), __runInitializers(this, _montosPorTipo_initializers, void 0));
        diaGeneracion = (__runInitializers(this, _montosPorTipo_extraInitializers), __runInitializers(this, _diaGeneracion_initializers, void 0));
        diaVencimiento = (__runInitializers(this, _diaGeneracion_extraInitializers), __runInitializers(this, _diaVencimiento_initializers, void 0));
        alcance = (__runInitializers(this, _diaVencimiento_extraInitializers), __runInitializers(this, _alcance_initializers, void 0));
        alcanceValor = (__runInitializers(this, _alcance_extraInitializers), __runInitializers(this, _alcanceValor_initializers, void 0));
        unidadIds = (__runInitializers(this, _alcanceValor_extraInitializers), __runInitializers(this, _unidadIds_initializers, void 0));
        politicaInactivas = (__runInitializers(this, _unidadIds_extraInitializers), __runInitializers(this, _politicaInactivas_initializers, void 0));
        constructor() {
            __runInitializers(this, _politicaInactivas_extraInitializers);
        }
    };
})();
export { SaveFeeRuleDto };
let CreateFeeRuleDto = (() => {
    let _classSuper = SaveFeeRuleDto;
    let _estado_decorators;
    let _estado_initializers = [];
    let _estado_extraInitializers = [];
    return class CreateFeeRuleDto extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _estado_decorators = [ApiPropertyOptional({
                    enum: FeeRuleStatus,
                    default: FeeRuleStatus.ACTIVA,
                    description: 'Estado inicial. INACTIVA permite guardar una regla incompleta como borrador.',
                }), IsOptional(), IsIn(Object.values(FeeRuleStatus), {
                    message: 'estado debe ser ACTIVA, PAUSADA o INACTIVA',
                })];
            __esDecorate(null, null, _estado_decorators, { kind: "field", name: "estado", static: false, private: false, access: { has: obj => "estado" in obj, get: obj => obj.estado, set: (obj, value) => { obj.estado = value; } }, metadata: _metadata }, _estado_initializers, _estado_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        estado = __runInitializers(this, _estado_initializers, void 0);
        constructor() {
            super(...arguments);
            __runInitializers(this, _estado_extraInitializers);
        }
    };
})();
export { CreateFeeRuleDto };
