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
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min, MinLength, } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
let CreatePreautorizacionDto = (() => {
    let _nombreVisitante_decorators;
    let _nombreVisitante_initializers = [];
    let _nombreVisitante_extraInitializers = [];
    let _documento_decorators;
    let _documento_initializers = [];
    let _documento_extraInitializers = [];
    let _inicio_decorators;
    let _inicio_initializers = [];
    let _inicio_extraInitializers = [];
    let _fin_decorators;
    let _fin_initializers = [];
    let _fin_extraInitializers = [];
    let _acompanantes_decorators;
    let _acompanantes_initializers = [];
    let _acompanantes_extraInitializers = [];
    let _motivo_decorators;
    let _motivo_initializers = [];
    let _motivo_extraInitializers = [];
    return class CreatePreautorizacionDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _nombreVisitante_decorators = [ApiProperty({ example: 'Juan Pérez' }), IsString(), IsNotEmpty({ message: 'El nombre del visitante es obligatorio' }), MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' }), MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })];
            _documento_decorators = [ApiProperty({ example: '12345678' }), IsString(), IsNotEmpty({ message: 'El documento es obligatorio' }), MaxLength(20)];
            _inicio_decorators = [ApiProperty({ example: '2026-11-15T10:00:00.000Z' }), IsDateString({}, { message: 'La fecha de inicio debe ser válida' })];
            _fin_decorators = [ApiProperty({ example: '2026-11-15T18:00:00.000Z' }), IsDateString({}, { message: 'La fecha de fin debe ser válida' })];
            _acompanantes_decorators = [ApiProperty({ example: 2, minimum: 0, maximum: 5 }), IsInt({ message: 'Los acompañantes deben ser un número entero' }), Min(0, { message: 'Los acompañantes no pueden ser negativos' }), Max(5, { message: 'No puedes autorizar más de 5 acompañantes' })];
            _motivo_decorators = [ApiProperty({ required: false, example: 'Entrega de paquetería' }), IsOptional(), IsString(), MaxLength(200)];
            __esDecorate(null, null, _nombreVisitante_decorators, { kind: "field", name: "nombreVisitante", static: false, private: false, access: { has: obj => "nombreVisitante" in obj, get: obj => obj.nombreVisitante, set: (obj, value) => { obj.nombreVisitante = value; } }, metadata: _metadata }, _nombreVisitante_initializers, _nombreVisitante_extraInitializers);
            __esDecorate(null, null, _documento_decorators, { kind: "field", name: "documento", static: false, private: false, access: { has: obj => "documento" in obj, get: obj => obj.documento, set: (obj, value) => { obj.documento = value; } }, metadata: _metadata }, _documento_initializers, _documento_extraInitializers);
            __esDecorate(null, null, _inicio_decorators, { kind: "field", name: "inicio", static: false, private: false, access: { has: obj => "inicio" in obj, get: obj => obj.inicio, set: (obj, value) => { obj.inicio = value; } }, metadata: _metadata }, _inicio_initializers, _inicio_extraInitializers);
            __esDecorate(null, null, _fin_decorators, { kind: "field", name: "fin", static: false, private: false, access: { has: obj => "fin" in obj, get: obj => obj.fin, set: (obj, value) => { obj.fin = value; } }, metadata: _metadata }, _fin_initializers, _fin_extraInitializers);
            __esDecorate(null, null, _acompanantes_decorators, { kind: "field", name: "acompanantes", static: false, private: false, access: { has: obj => "acompanantes" in obj, get: obj => obj.acompanantes, set: (obj, value) => { obj.acompanantes = value; } }, metadata: _metadata }, _acompanantes_initializers, _acompanantes_extraInitializers);
            __esDecorate(null, null, _motivo_decorators, { kind: "field", name: "motivo", static: false, private: false, access: { has: obj => "motivo" in obj, get: obj => obj.motivo, set: (obj, value) => { obj.motivo = value; } }, metadata: _metadata }, _motivo_initializers, _motivo_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        nombreVisitante = __runInitializers(this, _nombreVisitante_initializers, void 0);
        documento = (__runInitializers(this, _nombreVisitante_extraInitializers), __runInitializers(this, _documento_initializers, void 0));
        inicio = (__runInitializers(this, _documento_extraInitializers), __runInitializers(this, _inicio_initializers, void 0));
        fin = (__runInitializers(this, _inicio_extraInitializers), __runInitializers(this, _fin_initializers, void 0));
        acompanantes = (__runInitializers(this, _fin_extraInitializers), __runInitializers(this, _acompanantes_initializers, void 0));
        motivo = (__runInitializers(this, _acompanantes_extraInitializers), __runInitializers(this, _motivo_initializers, void 0));
        constructor() {
            __runInitializers(this, _motivo_extraInitializers);
        }
    };
})();
export { CreatePreautorizacionDto };
