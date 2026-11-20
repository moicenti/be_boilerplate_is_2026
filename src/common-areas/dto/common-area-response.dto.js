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
import { ScheduleDto } from './schedule.dto.js';
import { formatTime } from '../utils/time.js';
let CommonAreaResponseDto = (() => {
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _nombre_decorators;
    let _nombre_initializers = [];
    let _nombre_extraInitializers = [];
    let _capacidad_decorators;
    let _capacidad_initializers = [];
    let _capacidad_extraInitializers = [];
    let _ubicacion_decorators;
    let _ubicacion_initializers = [];
    let _ubicacion_extraInitializers = [];
    let _duracionBloque_decorators;
    let _duracionBloque_initializers = [];
    let _duracionBloque_extraInitializers = [];
    let _condicionesUso_decorators;
    let _condicionesUso_initializers = [];
    let _condicionesUso_extraInitializers = [];
    let _estado_decorators;
    let _estado_initializers = [];
    let _estado_extraInitializers = [];
    let _horarios_decorators;
    let _horarios_initializers = [];
    let _horarios_extraInitializers = [];
    return class CommonAreaResponseDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _id_decorators = [ApiProperty({ example: 2 })];
            _nombre_decorators = [ApiProperty({ example: 'Salón social' })];
            _capacidad_decorators = [ApiProperty({ example: 40 })];
            _ubicacion_decorators = [ApiProperty({ example: 'Torre A, nivel 1' })];
            _duracionBloque_decorators = [ApiProperty({ example: 2, description: 'Horas por bloque de reserva' })];
            _condicionesUso_decorators = [ApiProperty({ example: 'No se permite música después de las 21:00.', nullable: true, type: String })];
            _estado_decorators = [ApiPropertyOptional({ enum: ['ACTIVA', 'ELIMINADA'] })];
            _horarios_decorators = [ApiProperty({ type: [ScheduleDto] })];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _nombre_decorators, { kind: "field", name: "nombre", static: false, private: false, access: { has: obj => "nombre" in obj, get: obj => obj.nombre, set: (obj, value) => { obj.nombre = value; } }, metadata: _metadata }, _nombre_initializers, _nombre_extraInitializers);
            __esDecorate(null, null, _capacidad_decorators, { kind: "field", name: "capacidad", static: false, private: false, access: { has: obj => "capacidad" in obj, get: obj => obj.capacidad, set: (obj, value) => { obj.capacidad = value; } }, metadata: _metadata }, _capacidad_initializers, _capacidad_extraInitializers);
            __esDecorate(null, null, _ubicacion_decorators, { kind: "field", name: "ubicacion", static: false, private: false, access: { has: obj => "ubicacion" in obj, get: obj => obj.ubicacion, set: (obj, value) => { obj.ubicacion = value; } }, metadata: _metadata }, _ubicacion_initializers, _ubicacion_extraInitializers);
            __esDecorate(null, null, _duracionBloque_decorators, { kind: "field", name: "duracionBloque", static: false, private: false, access: { has: obj => "duracionBloque" in obj, get: obj => obj.duracionBloque, set: (obj, value) => { obj.duracionBloque = value; } }, metadata: _metadata }, _duracionBloque_initializers, _duracionBloque_extraInitializers);
            __esDecorate(null, null, _condicionesUso_decorators, { kind: "field", name: "condicionesUso", static: false, private: false, access: { has: obj => "condicionesUso" in obj, get: obj => obj.condicionesUso, set: (obj, value) => { obj.condicionesUso = value; } }, metadata: _metadata }, _condicionesUso_initializers, _condicionesUso_extraInitializers);
            __esDecorate(null, null, _estado_decorators, { kind: "field", name: "estado", static: false, private: false, access: { has: obj => "estado" in obj, get: obj => obj.estado, set: (obj, value) => { obj.estado = value; } }, metadata: _metadata }, _estado_initializers, _estado_extraInitializers);
            __esDecorate(null, null, _horarios_decorators, { kind: "field", name: "horarios", static: false, private: false, access: { has: obj => "horarios" in obj, get: obj => obj.horarios, set: (obj, value) => { obj.horarios = value; } }, metadata: _metadata }, _horarios_initializers, _horarios_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        id = __runInitializers(this, _id_initializers, void 0);
        nombre = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _nombre_initializers, void 0));
        capacidad = (__runInitializers(this, _nombre_extraInitializers), __runInitializers(this, _capacidad_initializers, void 0));
        ubicacion = (__runInitializers(this, _capacidad_extraInitializers), __runInitializers(this, _ubicacion_initializers, void 0));
        duracionBloque = (__runInitializers(this, _ubicacion_extraInitializers), __runInitializers(this, _duracionBloque_initializers, void 0));
        condicionesUso = (__runInitializers(this, _duracionBloque_extraInitializers), __runInitializers(this, _condicionesUso_initializers, void 0));
        estado = (__runInitializers(this, _condicionesUso_extraInitializers), __runInitializers(this, _estado_initializers, void 0));
        horarios = (__runInitializers(this, _estado_extraInitializers), __runInitializers(this, _horarios_initializers, void 0));
        static fromEntity(area, { includeStatus = false } = {}) {
            return {
                id: area.id,
                nombre: area.name,
                capacidad: area.capacity,
                ubicacion: area.location,
                duracionBloque: area.blockDurationHours,
                condicionesUso: area.usageConditions,
                ...(includeStatus ? { estado: area.status } : {}),
                horarios: area.schedules.map((schedule) => ({
                    diaSemana: schedule.dayOfWeek,
                    horaApertura: formatTime(schedule.opensAt),
                    horaCierre: formatTime(schedule.closesAt),
                })),
            };
        }
        constructor() {
            __runInitializers(this, _horarios_extraInitializers);
        }
    };
})();
export { CommonAreaResponseDto };
