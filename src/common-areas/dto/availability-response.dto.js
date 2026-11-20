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
import { UnavailabilityReason } from '../constants.js';
let AreaAvailabilityDto = (() => {
    let _areaId_decorators;
    let _areaId_initializers = [];
    let _areaId_extraInitializers = [];
    let _nombre_decorators;
    let _nombre_initializers = [];
    let _nombre_extraInitializers = [];
    let _capacidad_decorators;
    let _capacidad_initializers = [];
    let _capacidad_extraInitializers = [];
    let _disponible_decorators;
    let _disponible_initializers = [];
    let _disponible_extraInitializers = [];
    let _motivo_decorators;
    let _motivo_initializers = [];
    let _motivo_extraInitializers = [];
    return class AreaAvailabilityDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _areaId_decorators = [ApiProperty({ example: 2 })];
            _nombre_decorators = [ApiProperty({ example: 'Salón social' })];
            _capacidad_decorators = [ApiProperty({ example: 40 })];
            _disponible_decorators = [ApiProperty({ example: false })];
            _motivo_decorators = [ApiProperty({
                    enum: Object.values(UnavailabilityReason),
                    nullable: true,
                    example: UnavailabilityReason.RESERVADA,
                    description: 'null cuando el área está disponible',
                })];
            __esDecorate(null, null, _areaId_decorators, { kind: "field", name: "areaId", static: false, private: false, access: { has: obj => "areaId" in obj, get: obj => obj.areaId, set: (obj, value) => { obj.areaId = value; } }, metadata: _metadata }, _areaId_initializers, _areaId_extraInitializers);
            __esDecorate(null, null, _nombre_decorators, { kind: "field", name: "nombre", static: false, private: false, access: { has: obj => "nombre" in obj, get: obj => obj.nombre, set: (obj, value) => { obj.nombre = value; } }, metadata: _metadata }, _nombre_initializers, _nombre_extraInitializers);
            __esDecorate(null, null, _capacidad_decorators, { kind: "field", name: "capacidad", static: false, private: false, access: { has: obj => "capacidad" in obj, get: obj => obj.capacidad, set: (obj, value) => { obj.capacidad = value; } }, metadata: _metadata }, _capacidad_initializers, _capacidad_extraInitializers);
            __esDecorate(null, null, _disponible_decorators, { kind: "field", name: "disponible", static: false, private: false, access: { has: obj => "disponible" in obj, get: obj => obj.disponible, set: (obj, value) => { obj.disponible = value; } }, metadata: _metadata }, _disponible_initializers, _disponible_extraInitializers);
            __esDecorate(null, null, _motivo_decorators, { kind: "field", name: "motivo", static: false, private: false, access: { has: obj => "motivo" in obj, get: obj => obj.motivo, set: (obj, value) => { obj.motivo = value; } }, metadata: _metadata }, _motivo_initializers, _motivo_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        areaId = __runInitializers(this, _areaId_initializers, void 0);
        nombre = (__runInitializers(this, _areaId_extraInitializers), __runInitializers(this, _nombre_initializers, void 0));
        capacidad = (__runInitializers(this, _nombre_extraInitializers), __runInitializers(this, _capacidad_initializers, void 0));
        disponible = (__runInitializers(this, _capacidad_extraInitializers), __runInitializers(this, _disponible_initializers, void 0));
        motivo = (__runInitializers(this, _disponible_extraInitializers), __runInitializers(this, _motivo_initializers, void 0));
        constructor() {
            __runInitializers(this, _motivo_extraInitializers);
        }
    };
})();
export { AreaAvailabilityDto };
let AvailabilityResponseDto = (() => {
    let _fecha_decorators;
    let _fecha_initializers = [];
    let _fecha_extraInitializers = [];
    let _hora_decorators;
    let _hora_initializers = [];
    let _hora_extraInitializers = [];
    let _areas_decorators;
    let _areas_initializers = [];
    let _areas_extraInitializers = [];
    return class AvailabilityResponseDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _fecha_decorators = [ApiProperty({ example: '2026-11-14' })];
            _hora_decorators = [ApiProperty({ example: '18:00' })];
            _areas_decorators = [ApiProperty({ type: [AreaAvailabilityDto] })];
            __esDecorate(null, null, _fecha_decorators, { kind: "field", name: "fecha", static: false, private: false, access: { has: obj => "fecha" in obj, get: obj => obj.fecha, set: (obj, value) => { obj.fecha = value; } }, metadata: _metadata }, _fecha_initializers, _fecha_extraInitializers);
            __esDecorate(null, null, _hora_decorators, { kind: "field", name: "hora", static: false, private: false, access: { has: obj => "hora" in obj, get: obj => obj.hora, set: (obj, value) => { obj.hora = value; } }, metadata: _metadata }, _hora_initializers, _hora_extraInitializers);
            __esDecorate(null, null, _areas_decorators, { kind: "field", name: "areas", static: false, private: false, access: { has: obj => "areas" in obj, get: obj => obj.areas, set: (obj, value) => { obj.areas = value; } }, metadata: _metadata }, _areas_initializers, _areas_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        fecha = __runInitializers(this, _fecha_initializers, void 0);
        hora = (__runInitializers(this, _fecha_extraInitializers), __runInitializers(this, _hora_initializers, void 0));
        areas = (__runInitializers(this, _hora_extraInitializers), __runInitializers(this, _areas_initializers, void 0));
        static from(fecha, hora, results) {
            return {
                fecha,
                hora,
                areas: results.map(({ area, reason }) => ({
                    areaId: area.id,
                    nombre: area.name,
                    capacidad: area.capacity,
                    disponible: reason === null,
                    motivo: reason,
                })),
            };
        }
        constructor() {
            __runInitializers(this, _areas_extraInitializers);
        }
    };
})();
export { AvailabilityResponseDto };
