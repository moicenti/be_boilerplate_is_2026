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
import { IsISO8601, IsInt, IsOptional, Matches, Max, Min } from 'class-validator';
import { TIME_PATTERN } from './schedule.dto.js';
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
/** Los query params llegan como texto; uno vacío (`areaId=`) equivale a no enviarlo. */
const toOptionalNumber = ({ value }) => value === undefined || value === '' ? undefined : Number(value);
let AvailabilityQueryDto = (() => {
    let _fecha_decorators;
    let _fecha_initializers = [];
    let _fecha_extraInitializers = [];
    let _hora_decorators;
    let _hora_initializers = [];
    let _hora_extraInitializers = [];
    let _duracionMin_decorators;
    let _duracionMin_initializers = [];
    let _duracionMin_extraInitializers = [];
    let _areaId_decorators;
    let _areaId_initializers = [];
    let _areaId_extraInitializers = [];
    return class AvailabilityQueryDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _fecha_decorators = [ApiProperty({ example: '2026-11-14', description: 'Fecha local del condominio (AAAA-MM-DD)' }), Matches(DATE_PATTERN, { message: 'fecha debe tener el formato AAAA-MM-DD' }), IsISO8601({ strict: true }, { message: 'fecha debe ser una fecha válida' })];
            _hora_decorators = [ApiProperty({ example: '18:00', description: 'Hora local de inicio (HH:mm)' }), Matches(TIME_PATTERN, { message: 'hora debe tener el formato HH:mm' })];
            _duracionMin_decorators = [ApiPropertyOptional({ example: 60, default: 60, minimum: 1, maximum: 1440 }), IsOptional(), Transform(toOptionalNumber), IsInt({ message: 'duracionMin debe ser un número entero de minutos' }), Min(1, { message: 'duracionMin debe ser de al menos 1 minuto' }), Max(1440, { message: 'duracionMin no puede superar 1440 minutos (un día)' })];
            _areaId_decorators = [ApiPropertyOptional({ example: 2, description: 'Limita la consulta a una sola área' }), IsOptional(), Transform(toOptionalNumber), IsInt({ message: 'areaId debe ser un número entero' }), Min(1, { message: 'areaId debe ser un número entero positivo' })];
            __esDecorate(null, null, _fecha_decorators, { kind: "field", name: "fecha", static: false, private: false, access: { has: obj => "fecha" in obj, get: obj => obj.fecha, set: (obj, value) => { obj.fecha = value; } }, metadata: _metadata }, _fecha_initializers, _fecha_extraInitializers);
            __esDecorate(null, null, _hora_decorators, { kind: "field", name: "hora", static: false, private: false, access: { has: obj => "hora" in obj, get: obj => obj.hora, set: (obj, value) => { obj.hora = value; } }, metadata: _metadata }, _hora_initializers, _hora_extraInitializers);
            __esDecorate(null, null, _duracionMin_decorators, { kind: "field", name: "duracionMin", static: false, private: false, access: { has: obj => "duracionMin" in obj, get: obj => obj.duracionMin, set: (obj, value) => { obj.duracionMin = value; } }, metadata: _metadata }, _duracionMin_initializers, _duracionMin_extraInitializers);
            __esDecorate(null, null, _areaId_decorators, { kind: "field", name: "areaId", static: false, private: false, access: { has: obj => "areaId" in obj, get: obj => obj.areaId, set: (obj, value) => { obj.areaId = value; } }, metadata: _metadata }, _areaId_initializers, _areaId_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        fecha = __runInitializers(this, _fecha_initializers, void 0);
        hora = (__runInitializers(this, _fecha_extraInitializers), __runInitializers(this, _hora_initializers, void 0));
        duracionMin = (__runInitializers(this, _hora_extraInitializers), __runInitializers(this, _duracionMin_initializers, void 0));
        areaId = (__runInitializers(this, _duracionMin_extraInitializers), __runInitializers(this, _areaId_initializers, void 0));
        constructor() {
            __runInitializers(this, _areaId_extraInitializers);
        }
    };
})();
export { AvailabilityQueryDto };
