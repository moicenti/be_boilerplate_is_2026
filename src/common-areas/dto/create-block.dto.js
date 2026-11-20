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
import { IsEnum, IsISO8601, Matches } from 'class-validator';
import { CommonAreaBlockReason } from '@PrismaClient';
const ISO_WITH_OFFSET = /(Z|[+-]\d{2}:\d{2})$/;
let CreateBlockDto = (() => {
    let _inicio_decorators;
    let _inicio_initializers = [];
    let _inicio_extraInitializers = [];
    let _fin_decorators;
    let _fin_initializers = [];
    let _fin_extraInitializers = [];
    let _motivo_decorators;
    let _motivo_initializers = [];
    let _motivo_extraInitializers = [];
    return class CreateBlockDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _inicio_decorators = [ApiProperty({ example: '2026-11-14T10:00:00-06:00' }), IsISO8601({ strict: true }, { message: 'inicio debe ser una fecha ISO 8601' }), Matches(ISO_WITH_OFFSET, { message: 'inicio debe indicar la zona horaria (Z o ±HH:mm)' })];
            _fin_decorators = [ApiProperty({ example: '2026-11-14T14:00:00-06:00' }), IsISO8601({ strict: true }, { message: 'fin debe ser una fecha ISO 8601' }), Matches(ISO_WITH_OFFSET, { message: 'fin debe indicar la zona horaria (Z o ±HH:mm)' })];
            _motivo_decorators = [ApiProperty({ enum: CommonAreaBlockReason, example: CommonAreaBlockReason.MANTENIMIENTO }), IsEnum(CommonAreaBlockReason, {
                    message: 'motivo debe ser MANTENIMIENTO, RENOVACION u OTRO',
                })];
            __esDecorate(null, null, _inicio_decorators, { kind: "field", name: "inicio", static: false, private: false, access: { has: obj => "inicio" in obj, get: obj => obj.inicio, set: (obj, value) => { obj.inicio = value; } }, metadata: _metadata }, _inicio_initializers, _inicio_extraInitializers);
            __esDecorate(null, null, _fin_decorators, { kind: "field", name: "fin", static: false, private: false, access: { has: obj => "fin" in obj, get: obj => obj.fin, set: (obj, value) => { obj.fin = value; } }, metadata: _metadata }, _fin_initializers, _fin_extraInitializers);
            __esDecorate(null, null, _motivo_decorators, { kind: "field", name: "motivo", static: false, private: false, access: { has: obj => "motivo" in obj, get: obj => obj.motivo, set: (obj, value) => { obj.motivo = value; } }, metadata: _metadata }, _motivo_initializers, _motivo_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        inicio = __runInitializers(this, _inicio_initializers, void 0);
        fin = (__runInitializers(this, _inicio_extraInitializers), __runInitializers(this, _fin_initializers, void 0));
        motivo = (__runInitializers(this, _fin_extraInitializers), __runInitializers(this, _motivo_initializers, void 0));
        constructor() {
            __runInitializers(this, _motivo_extraInitializers);
        }
    };
})();
export { CreateBlockDto };
