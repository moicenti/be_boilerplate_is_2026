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
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested, } from 'class-validator';
import { ScheduleDto } from './schedule.dto.js';
const trim = ({ value }) => (typeof value === 'string' ? value.trim() : value);
let SaveCommonAreaDto = (() => {
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
    let _horarios_decorators;
    let _horarios_initializers = [];
    let _horarios_extraInitializers = [];
    return class SaveCommonAreaDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _nombre_decorators = [ApiProperty({ example: 'Salón social', maxLength: 100 }), Transform(trim), IsString({ message: 'nombre debe ser texto' }), IsNotEmpty({ message: 'nombre es obligatorio' }), MaxLength(100, { message: 'nombre no puede exceder los 100 caracteres' })];
            _capacidad_decorators = [ApiProperty({ example: 40, description: 'Debe ser mayor a 0' }), IsInt({ message: 'capacidad debe ser un número entero' })];
            _ubicacion_decorators = [ApiProperty({ example: 'Torre A, nivel 1', maxLength: 150 }), Transform(trim), IsString({ message: 'ubicacion debe ser texto' }), IsNotEmpty({ message: 'ubicacion es obligatoria' }), MaxLength(150, { message: 'ubicacion no puede exceder los 150 caracteres' })];
            _duracionBloque_decorators = [ApiProperty({
                    example: 2,
                    description: 'Horas por bloque de reserva. Mayor a 0 y no más largo que ningún horario del área',
                }), IsInt({ message: 'duracionBloque debe ser un número entero de horas' })];
            _condicionesUso_decorators = [ApiPropertyOptional({
                    example: 'No se permite música después de las 21:00.',
                    maxLength: 1000,
                    nullable: true,
                }), Transform(({ value }) => {
                    const trimmed = trim({ value });
                    return trimmed === '' ? null : trimmed;
                }), IsOptional(), IsString({ message: 'condicionesUso debe ser texto' }), MaxLength(1000, { message: 'condicionesUso no puede exceder los 1000 caracteres' })];
            _horarios_decorators = [ApiProperty({ type: [ScheduleDto] }), IsArray({ message: 'horarios debe ser una lista' }), ArrayMinSize(1, { message: 'Debe indicarse al menos un horario' }), ArrayMaxSize(7, { message: 'No puede haber más de 7 horarios (uno por día)' }), ValidateNested({ each: true }), Type(() => ScheduleDto)];
            __esDecorate(null, null, _nombre_decorators, { kind: "field", name: "nombre", static: false, private: false, access: { has: obj => "nombre" in obj, get: obj => obj.nombre, set: (obj, value) => { obj.nombre = value; } }, metadata: _metadata }, _nombre_initializers, _nombre_extraInitializers);
            __esDecorate(null, null, _capacidad_decorators, { kind: "field", name: "capacidad", static: false, private: false, access: { has: obj => "capacidad" in obj, get: obj => obj.capacidad, set: (obj, value) => { obj.capacidad = value; } }, metadata: _metadata }, _capacidad_initializers, _capacidad_extraInitializers);
            __esDecorate(null, null, _ubicacion_decorators, { kind: "field", name: "ubicacion", static: false, private: false, access: { has: obj => "ubicacion" in obj, get: obj => obj.ubicacion, set: (obj, value) => { obj.ubicacion = value; } }, metadata: _metadata }, _ubicacion_initializers, _ubicacion_extraInitializers);
            __esDecorate(null, null, _duracionBloque_decorators, { kind: "field", name: "duracionBloque", static: false, private: false, access: { has: obj => "duracionBloque" in obj, get: obj => obj.duracionBloque, set: (obj, value) => { obj.duracionBloque = value; } }, metadata: _metadata }, _duracionBloque_initializers, _duracionBloque_extraInitializers);
            __esDecorate(null, null, _condicionesUso_decorators, { kind: "field", name: "condicionesUso", static: false, private: false, access: { has: obj => "condicionesUso" in obj, get: obj => obj.condicionesUso, set: (obj, value) => { obj.condicionesUso = value; } }, metadata: _metadata }, _condicionesUso_initializers, _condicionesUso_extraInitializers);
            __esDecorate(null, null, _horarios_decorators, { kind: "field", name: "horarios", static: false, private: false, access: { has: obj => "horarios" in obj, get: obj => obj.horarios, set: (obj, value) => { obj.horarios = value; } }, metadata: _metadata }, _horarios_initializers, _horarios_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        nombre = __runInitializers(this, _nombre_initializers, void 0);
        capacidad = (__runInitializers(this, _nombre_extraInitializers), __runInitializers(this, _capacidad_initializers, void 0));
        ubicacion = (__runInitializers(this, _capacidad_extraInitializers), __runInitializers(this, _ubicacion_initializers, void 0));
        duracionBloque = (__runInitializers(this, _ubicacion_extraInitializers), __runInitializers(this, _duracionBloque_initializers, void 0));
        condicionesUso = (__runInitializers(this, _duracionBloque_extraInitializers), __runInitializers(this, _condicionesUso_initializers, void 0));
        horarios = (__runInitializers(this, _condicionesUso_extraInitializers), __runInitializers(this, _horarios_initializers, void 0));
        constructor() {
            __runInitializers(this, _horarios_extraInitializers);
        }
    };
})();
export { SaveCommonAreaDto };
