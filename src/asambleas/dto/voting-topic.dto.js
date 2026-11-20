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
import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsDate, IsString, Length, } from 'class-validator';
import { RequiredText } from '@Common/decorators';
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 10;
let VotingTopicDto = (() => {
    let _title_decorators;
    let _title_initializers = [];
    let _title_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    let _opensAt_decorators;
    let _opensAt_initializers = [];
    let _opensAt_extraInitializers = [];
    let _closesAt_decorators;
    let _closesAt_initializers = [];
    let _closesAt_extraInitializers = [];
    let _options_decorators;
    let _options_initializers = [];
    let _options_extraInitializers = [];
    return class VotingTopicDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _title_decorators = [ApiProperty({ example: 'Renovar el sistema de riego del jardín central' }), RequiredText('El título de la propuesta', 150)];
            _description_decorators = [ApiProperty({
                    example: 'Sustituir los aspersores dañados e instalar un programador.',
                }), RequiredText('La descripción de la propuesta', 1000, 'obligatoria')];
            _opensAt_decorators = [ApiProperty({
                    type: String,
                    format: 'date-time',
                    example: '2026-11-18T20:30:00-06:00',
                }), Type(() => Date), IsDate({ message: 'La apertura de la votación no es una fecha válida.' })];
            _closesAt_decorators = [ApiProperty({
                    type: String,
                    format: 'date-time',
                    example: '2026-11-21T20:00:00-06:00',
                }), Type(() => Date), IsDate({ message: 'El cierre de la votación no es una fecha válida.' })];
            _options_decorators = [ApiProperty({
                    type: [String],
                    example: ['A favor', 'En contra', 'Abstención'],
                }), IsArray({ message: 'Las opciones deben ser una lista.' }), ArrayMinSize(MIN_OPTIONS, {
                    message: `Cada propuesta necesita al menos ${MIN_OPTIONS} opciones.`,
                }), ArrayMaxSize(MAX_OPTIONS, {
                    message: `Cada propuesta admite como máximo ${MAX_OPTIONS} opciones.`,
                }), Transform(({ value }) => Array.isArray(value)
                    ? value.map((v) => (typeof v === 'string' ? v.trim() : v))
                    : value), IsString({ each: true, message: 'Cada opción debe ser texto.' }), Length(1, 80, {
                    each: true,
                    message: 'Cada opción debe tener entre 1 y 80 caracteres.',
                })];
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: obj => "title" in obj, get: obj => obj.title, set: (obj, value) => { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
            __esDecorate(null, null, _opensAt_decorators, { kind: "field", name: "opensAt", static: false, private: false, access: { has: obj => "opensAt" in obj, get: obj => obj.opensAt, set: (obj, value) => { obj.opensAt = value; } }, metadata: _metadata }, _opensAt_initializers, _opensAt_extraInitializers);
            __esDecorate(null, null, _closesAt_decorators, { kind: "field", name: "closesAt", static: false, private: false, access: { has: obj => "closesAt" in obj, get: obj => obj.closesAt, set: (obj, value) => { obj.closesAt = value; } }, metadata: _metadata }, _closesAt_initializers, _closesAt_extraInitializers);
            __esDecorate(null, null, _options_decorators, { kind: "field", name: "options", static: false, private: false, access: { has: obj => "options" in obj, get: obj => obj.options, set: (obj, value) => { obj.options = value; } }, metadata: _metadata }, _options_initializers, _options_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        title = __runInitializers(this, _title_initializers, void 0);
        description = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _description_initializers, void 0));
        opensAt = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _opensAt_initializers, void 0));
        closesAt = (__runInitializers(this, _opensAt_extraInitializers), __runInitializers(this, _closesAt_initializers, void 0));
        options = (__runInitializers(this, _closesAt_extraInitializers), __runInitializers(this, _options_initializers, void 0));
        constructor() {
            __runInitializers(this, _options_extraInitializers);
        }
    };
})();
export { VotingTopicDto };
