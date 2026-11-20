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
import { ArrayMaxSize, ArrayMinSize, IsArray, IsDate, IsEnum, IsOptional, Length, ValidateNested, } from 'class-validator';
import { RequiredText } from '@Common/decorators';
import { AssemblyModality, AssemblyType } from '@PrismaClient';
import { VotingTopicDto } from './voting-topic.dto.js';
export const MAX_TOPICS = 10;
export const MAX_AGENDA_ITEMS = 20;
let AgendaItemDto = (() => {
    let _title_decorators;
    let _title_initializers = [];
    let _title_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    return class AgendaItemDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _title_decorators = [ApiProperty({ example: 'Estado actual del jardín' }), RequiredText('El título del punto de agenda', 150)];
            _description_decorators = [ApiPropertyOptional({ example: 'Revisar las zonas con riego irregular.' }), IsOptional(), Transform(({ value }) => typeof value === 'string' ? value.trim() : value), Length(0, 500, {
                    message: 'La descripción del punto de agenda no puede superar los 500 caracteres.',
                })];
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: obj => "title" in obj, get: obj => obj.title, set: (obj, value) => { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        title = __runInitializers(this, _title_initializers, void 0);
        description = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _description_initializers, void 0));
        constructor() {
            __runInitializers(this, _description_extraInitializers);
        }
    };
})();
export { AgendaItemDto };
let CreateAssemblyDto = (() => {
    let _title_decorators;
    let _title_initializers = [];
    let _title_extraInitializers = [];
    let _type_decorators;
    let _type_initializers = [];
    let _type_extraInitializers = [];
    let _modality_decorators;
    let _modality_initializers = [];
    let _modality_extraInitializers = [];
    let _startsAt_decorators;
    let _startsAt_initializers = [];
    let _startsAt_extraInitializers = [];
    let _endsAt_decorators;
    let _endsAt_initializers = [];
    let _endsAt_extraInitializers = [];
    let _location_decorators;
    let _location_initializers = [];
    let _location_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    let _agenda_decorators;
    let _agenda_initializers = [];
    let _agenda_extraInitializers = [];
    let _topics_decorators;
    let _topics_initializers = [];
    let _topics_extraInitializers = [];
    return class CreateAssemblyDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _title_decorators = [ApiProperty({ example: 'Mejora del jardín central' }), RequiredText('El título', 150)];
            _type_decorators = [ApiProperty({ enum: AssemblyType }), IsEnum(AssemblyType, { message: 'Selecciona el tipo de asamblea.' })];
            _modality_decorators = [ApiProperty({ enum: AssemblyModality }), IsEnum(AssemblyModality, { message: 'Selecciona la modalidad.' })];
            _startsAt_decorators = [ApiProperty({
                    type: String,
                    format: 'date-time',
                    example: '2026-11-18T19:00:00-06:00',
                }), Type(() => Date), IsDate({ message: 'La fecha y hora de inicio no son válidas.' })];
            _endsAt_decorators = [ApiProperty({
                    type: String,
                    format: 'date-time',
                    example: '2026-11-18T20:30:00-06:00',
                }), Type(() => Date), IsDate({ message: 'La hora de fin no es válida.' })];
            _location_decorators = [ApiProperty({ example: 'Salón de eventos · Casa club · Los Olivos' }), RequiredText('El lugar', 150)];
            _description_decorators = [ApiProperty({
                    example: 'Convocamos a residentes a revisar la renovación del riego.',
                }), RequiredText('La descripción de la convocatoria', 2000, 'obligatoria')];
            _agenda_decorators = [ApiProperty({ type: [AgendaItemDto] }), IsArray({ message: 'La agenda debe ser una lista.' }), ArrayMaxSize(MAX_AGENDA_ITEMS, {
                    message: `La agenda admite como máximo ${MAX_AGENDA_ITEMS} puntos.`,
                }), ValidateNested({ each: true }), Type(() => AgendaItemDto)];
            _topics_decorators = [ApiProperty({ type: [VotingTopicDto] }), IsArray({ message: 'Las propuestas deben ser una lista.' }), ArrayMinSize(1, {
                    message: 'La convocatoria necesita al menos una propuesta a votar.',
                }), ArrayMaxSize(MAX_TOPICS, {
                    message: `La convocatoria admite como máximo ${MAX_TOPICS} propuestas.`,
                }), ValidateNested({ each: true }), Type(() => VotingTopicDto)];
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: obj => "title" in obj, get: obj => obj.title, set: (obj, value) => { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: obj => "type" in obj, get: obj => obj.type, set: (obj, value) => { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
            __esDecorate(null, null, _modality_decorators, { kind: "field", name: "modality", static: false, private: false, access: { has: obj => "modality" in obj, get: obj => obj.modality, set: (obj, value) => { obj.modality = value; } }, metadata: _metadata }, _modality_initializers, _modality_extraInitializers);
            __esDecorate(null, null, _startsAt_decorators, { kind: "field", name: "startsAt", static: false, private: false, access: { has: obj => "startsAt" in obj, get: obj => obj.startsAt, set: (obj, value) => { obj.startsAt = value; } }, metadata: _metadata }, _startsAt_initializers, _startsAt_extraInitializers);
            __esDecorate(null, null, _endsAt_decorators, { kind: "field", name: "endsAt", static: false, private: false, access: { has: obj => "endsAt" in obj, get: obj => obj.endsAt, set: (obj, value) => { obj.endsAt = value; } }, metadata: _metadata }, _endsAt_initializers, _endsAt_extraInitializers);
            __esDecorate(null, null, _location_decorators, { kind: "field", name: "location", static: false, private: false, access: { has: obj => "location" in obj, get: obj => obj.location, set: (obj, value) => { obj.location = value; } }, metadata: _metadata }, _location_initializers, _location_extraInitializers);
            __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
            __esDecorate(null, null, _agenda_decorators, { kind: "field", name: "agenda", static: false, private: false, access: { has: obj => "agenda" in obj, get: obj => obj.agenda, set: (obj, value) => { obj.agenda = value; } }, metadata: _metadata }, _agenda_initializers, _agenda_extraInitializers);
            __esDecorate(null, null, _topics_decorators, { kind: "field", name: "topics", static: false, private: false, access: { has: obj => "topics" in obj, get: obj => obj.topics, set: (obj, value) => { obj.topics = value; } }, metadata: _metadata }, _topics_initializers, _topics_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        title = __runInitializers(this, _title_initializers, void 0);
        type = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _type_initializers, void 0));
        modality = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _modality_initializers, void 0));
        startsAt = (__runInitializers(this, _modality_extraInitializers), __runInitializers(this, _startsAt_initializers, void 0));
        endsAt = (__runInitializers(this, _startsAt_extraInitializers), __runInitializers(this, _endsAt_initializers, void 0));
        location = (__runInitializers(this, _endsAt_extraInitializers), __runInitializers(this, _location_initializers, void 0));
        description = (__runInitializers(this, _location_extraInitializers), __runInitializers(this, _description_initializers, void 0));
        agenda = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _agenda_initializers, void 0));
        topics = (__runInitializers(this, _agenda_extraInitializers), __runInitializers(this, _topics_initializers, void 0));
        constructor() {
            __runInitializers(this, _topics_extraInitializers);
        }
    };
})();
export { CreateAssemblyDto };
