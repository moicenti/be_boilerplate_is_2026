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
import { Transform } from 'class-transformer';
import { ArrayMaxSize, ArrayNotEmpty, ArrayUnique, IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Matches, Max, MaxLength, Min, } from 'class-validator';
/** Tope de decimal(12,2). */
const MAX_AMOUNT = 9_999_999_999.99;
const trim = ({ value }) => typeof value === 'string' ? value.trim() : value;
let CreatePaymentDto = (() => {
    let _unidadId_decorators;
    let _unidadId_initializers = [];
    let _unidadId_extraInitializers = [];
    let _cuotaIds_decorators;
    let _cuotaIds_initializers = [];
    let _cuotaIds_extraInitializers = [];
    let _monto_decorators;
    let _monto_initializers = [];
    let _monto_extraInitializers = [];
    let _referencia_decorators;
    let _referencia_initializers = [];
    let _referencia_extraInitializers = [];
    let _tarjetaUltimos4_decorators;
    let _tarjetaUltimos4_initializers = [];
    let _tarjetaUltimos4_extraInitializers = [];
    return class CreatePaymentDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _unidadId_decorators = [ApiProperty({ format: 'uuid', description: 'Unidad del residente autenticado' }), IsUUID('all', { message: 'unidadId debe ser un UUID' })];
            _cuotaIds_decorators = [ApiProperty({ type: [Number], example: [301, 302], description: 'Cuotas a pagar' }), IsArray({ message: 'cuotaIds debe ser una lista' }), ArrayNotEmpty({ message: 'cuotaIds debe incluir al menos una cuota' }), ArrayMaxSize(100, { message: 'cuotaIds admite hasta 100 cuotas' }), ArrayUnique({ message: 'cuotaIds no puede repetir cuotas' }), IsInt({ each: true, message: 'cada cuotaId debe ser un número entero' }), Min(1, { each: true, message: 'cada cuotaId debe ser un entero positivo' })];
            _monto_decorators = [ApiProperty({
                    example: 150.0,
                    description: 'Se aplica por fecha de vencimiento ascendente; no puede superar lo adeudado.',
                }), IsNumber({ maxDecimalPlaces: 2 }, { message: 'monto debe ser un número con hasta 2 decimales' }), IsPositive({ message: 'monto debe ser mayor a 0' }), Max(MAX_AMOUNT, { message: 'monto es demasiado grande' })];
            _referencia_decorators = [ApiPropertyOptional({
                    example: 'TARJ-2026',
                    maxLength: 64,
                    description: 'Referencia del medio de pago. Única: repetirla responde 409 (evita doble cobro).',
                }), IsOptional(), Transform(trim), IsString({ message: 'referencia debe ser texto' }), IsNotEmpty({ message: 'referencia no puede estar vacía' }), MaxLength(64, { message: 'referencia no puede exceder los 64 caracteres' })];
            _tarjetaUltimos4_decorators = [ApiPropertyOptional({
                    example: '2026',
                    description: 'Últimos 4 dígitos de la tarjeta de prueba. Si se envía, la pasarela simulada espera 5 s ' +
                        'y rechaza la que termina en 2000 (402 PAGO_RECHAZADO). Nunca se envía el número completo.',
                }), IsOptional(), Matches(/^\d{4}$/, { message: 'tarjetaUltimos4 debe tener exactamente 4 dígitos' })];
            __esDecorate(null, null, _unidadId_decorators, { kind: "field", name: "unidadId", static: false, private: false, access: { has: obj => "unidadId" in obj, get: obj => obj.unidadId, set: (obj, value) => { obj.unidadId = value; } }, metadata: _metadata }, _unidadId_initializers, _unidadId_extraInitializers);
            __esDecorate(null, null, _cuotaIds_decorators, { kind: "field", name: "cuotaIds", static: false, private: false, access: { has: obj => "cuotaIds" in obj, get: obj => obj.cuotaIds, set: (obj, value) => { obj.cuotaIds = value; } }, metadata: _metadata }, _cuotaIds_initializers, _cuotaIds_extraInitializers);
            __esDecorate(null, null, _monto_decorators, { kind: "field", name: "monto", static: false, private: false, access: { has: obj => "monto" in obj, get: obj => obj.monto, set: (obj, value) => { obj.monto = value; } }, metadata: _metadata }, _monto_initializers, _monto_extraInitializers);
            __esDecorate(null, null, _referencia_decorators, { kind: "field", name: "referencia", static: false, private: false, access: { has: obj => "referencia" in obj, get: obj => obj.referencia, set: (obj, value) => { obj.referencia = value; } }, metadata: _metadata }, _referencia_initializers, _referencia_extraInitializers);
            __esDecorate(null, null, _tarjetaUltimos4_decorators, { kind: "field", name: "tarjetaUltimos4", static: false, private: false, access: { has: obj => "tarjetaUltimos4" in obj, get: obj => obj.tarjetaUltimos4, set: (obj, value) => { obj.tarjetaUltimos4 = value; } }, metadata: _metadata }, _tarjetaUltimos4_initializers, _tarjetaUltimos4_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        unidadId = __runInitializers(this, _unidadId_initializers, void 0);
        cuotaIds = (__runInitializers(this, _unidadId_extraInitializers), __runInitializers(this, _cuotaIds_initializers, void 0));
        monto = (__runInitializers(this, _cuotaIds_extraInitializers), __runInitializers(this, _monto_initializers, void 0));
        referencia = (__runInitializers(this, _monto_extraInitializers), __runInitializers(this, _referencia_initializers, void 0));
        tarjetaUltimos4 = (__runInitializers(this, _referencia_extraInitializers), __runInitializers(this, _tarjetaUltimos4_initializers, void 0));
        constructor() {
            __runInitializers(this, _tarjetaUltimos4_extraInitializers);
        }
    };
})();
export { CreatePaymentDto };
