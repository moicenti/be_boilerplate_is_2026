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
import { AssemblyModality, AssemblyType } from '@PrismaClient';
import { AssemblyStatus, assemblyStatus, topicStatus, } from '../domain/assembly-status.js';
const STATUS_VALUES = Object.values(AssemblyStatus);
let VotingOptionResponseDto = (() => {
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _text_decorators;
    let _text_initializers = [];
    let _text_extraInitializers = [];
    let _position_decorators;
    let _position_initializers = [];
    let _position_extraInitializers = [];
    return class VotingOptionResponseDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _id_decorators = [ApiProperty({ format: 'uuid' })];
            _text_decorators = [ApiProperty({ example: 'A favor' })];
            _position_decorators = [ApiProperty({ example: 0 })];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _text_decorators, { kind: "field", name: "text", static: false, private: false, access: { has: obj => "text" in obj, get: obj => obj.text, set: (obj, value) => { obj.text = value; } }, metadata: _metadata }, _text_initializers, _text_extraInitializers);
            __esDecorate(null, null, _position_decorators, { kind: "field", name: "position", static: false, private: false, access: { has: obj => "position" in obj, get: obj => obj.position, set: (obj, value) => { obj.position = value; } }, metadata: _metadata }, _position_initializers, _position_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        id = __runInitializers(this, _id_initializers, void 0);
        text = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _text_initializers, void 0));
        position = (__runInitializers(this, _text_extraInitializers), __runInitializers(this, _position_initializers, void 0));
        constructor() {
            __runInitializers(this, _position_extraInitializers);
        }
    };
})();
let VotingTopicResponseDto = (() => {
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
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
    let _position_decorators;
    let _position_initializers = [];
    let _position_extraInitializers = [];
    let _status_decorators;
    let _status_initializers = [];
    let _status_extraInitializers = [];
    let _options_decorators;
    let _options_initializers = [];
    let _options_extraInitializers = [];
    return class VotingTopicResponseDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _id_decorators = [ApiProperty({ format: 'uuid' })];
            _title_decorators = [ApiProperty()];
            _description_decorators = [ApiProperty()];
            _opensAt_decorators = [ApiProperty({ type: String, format: 'date-time' })];
            _closesAt_decorators = [ApiProperty({ type: String, format: 'date-time' })];
            _position_decorators = [ApiProperty({ example: 0 })];
            _status_decorators = [ApiProperty({ enum: STATUS_VALUES })];
            _options_decorators = [ApiProperty({ type: [VotingOptionResponseDto] })];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: obj => "title" in obj, get: obj => obj.title, set: (obj, value) => { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
            __esDecorate(null, null, _opensAt_decorators, { kind: "field", name: "opensAt", static: false, private: false, access: { has: obj => "opensAt" in obj, get: obj => obj.opensAt, set: (obj, value) => { obj.opensAt = value; } }, metadata: _metadata }, _opensAt_initializers, _opensAt_extraInitializers);
            __esDecorate(null, null, _closesAt_decorators, { kind: "field", name: "closesAt", static: false, private: false, access: { has: obj => "closesAt" in obj, get: obj => obj.closesAt, set: (obj, value) => { obj.closesAt = value; } }, metadata: _metadata }, _closesAt_initializers, _closesAt_extraInitializers);
            __esDecorate(null, null, _position_decorators, { kind: "field", name: "position", static: false, private: false, access: { has: obj => "position" in obj, get: obj => obj.position, set: (obj, value) => { obj.position = value; } }, metadata: _metadata }, _position_initializers, _position_extraInitializers);
            __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: obj => "status" in obj, get: obj => obj.status, set: (obj, value) => { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
            __esDecorate(null, null, _options_decorators, { kind: "field", name: "options", static: false, private: false, access: { has: obj => "options" in obj, get: obj => obj.options, set: (obj, value) => { obj.options = value; } }, metadata: _metadata }, _options_initializers, _options_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        id = __runInitializers(this, _id_initializers, void 0);
        title = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _title_initializers, void 0));
        description = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _description_initializers, void 0));
        opensAt = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _opensAt_initializers, void 0));
        closesAt = (__runInitializers(this, _opensAt_extraInitializers), __runInitializers(this, _closesAt_initializers, void 0));
        position = (__runInitializers(this, _closesAt_extraInitializers), __runInitializers(this, _position_initializers, void 0));
        status = (__runInitializers(this, _position_extraInitializers), __runInitializers(this, _status_initializers, void 0));
        options = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _options_initializers, void 0));
        constructor() {
            __runInitializers(this, _options_extraInitializers);
        }
    };
})();
let AgendaItemResponseDto = (() => {
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _title_decorators;
    let _title_initializers = [];
    let _title_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    let _position_decorators;
    let _position_initializers = [];
    let _position_extraInitializers = [];
    return class AgendaItemResponseDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _id_decorators = [ApiProperty({ format: 'uuid' })];
            _title_decorators = [ApiProperty()];
            _description_decorators = [ApiPropertyOptional({ type: String, nullable: true })];
            _position_decorators = [ApiProperty({ example: 0 })];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: obj => "title" in obj, get: obj => obj.title, set: (obj, value) => { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
            __esDecorate(null, null, _position_decorators, { kind: "field", name: "position", static: false, private: false, access: { has: obj => "position" in obj, get: obj => obj.position, set: (obj, value) => { obj.position = value; } }, metadata: _metadata }, _position_initializers, _position_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        id = __runInitializers(this, _id_initializers, void 0);
        title = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _title_initializers, void 0));
        description = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _description_initializers, void 0));
        position = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _position_initializers, void 0));
        constructor() {
            __runInitializers(this, _position_extraInitializers);
        }
    };
})();
let AssemblySummaryDto = (() => {
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _folio_decorators;
    let _folio_initializers = [];
    let _folio_extraInitializers = [];
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
    let _publishedAt_decorators;
    let _publishedAt_initializers = [];
    let _publishedAt_extraInitializers = [];
    let _status_decorators;
    let _status_initializers = [];
    let _status_extraInitializers = [];
    let _votingOpensAt_decorators;
    let _votingOpensAt_initializers = [];
    let _votingOpensAt_extraInitializers = [];
    let _votingClosesAt_decorators;
    let _votingClosesAt_initializers = [];
    let _votingClosesAt_extraInitializers = [];
    let _topicCount_decorators;
    let _topicCount_initializers = [];
    let _topicCount_extraInitializers = [];
    let _agendaCount_decorators;
    let _agendaCount_initializers = [];
    let _agendaCount_extraInitializers = [];
    return class AssemblySummaryDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _id_decorators = [ApiProperty({ format: 'uuid' })];
            _folio_decorators = [ApiProperty({ example: 'ASM-2026-011' })];
            _title_decorators = [ApiProperty()];
            _type_decorators = [ApiProperty({ enum: AssemblyType })];
            _modality_decorators = [ApiProperty({ enum: AssemblyModality })];
            _startsAt_decorators = [ApiProperty({ type: String, format: 'date-time' })];
            _endsAt_decorators = [ApiProperty({ type: String, format: 'date-time' })];
            _location_decorators = [ApiProperty()];
            _publishedAt_decorators = [ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })];
            _status_decorators = [ApiProperty({ enum: STATUS_VALUES })];
            _votingOpensAt_decorators = [ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })];
            _votingClosesAt_decorators = [ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })];
            _topicCount_decorators = [ApiProperty({ example: 1 })];
            _agendaCount_decorators = [ApiProperty({ example: 3 })];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _folio_decorators, { kind: "field", name: "folio", static: false, private: false, access: { has: obj => "folio" in obj, get: obj => obj.folio, set: (obj, value) => { obj.folio = value; } }, metadata: _metadata }, _folio_initializers, _folio_extraInitializers);
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: obj => "title" in obj, get: obj => obj.title, set: (obj, value) => { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: obj => "type" in obj, get: obj => obj.type, set: (obj, value) => { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
            __esDecorate(null, null, _modality_decorators, { kind: "field", name: "modality", static: false, private: false, access: { has: obj => "modality" in obj, get: obj => obj.modality, set: (obj, value) => { obj.modality = value; } }, metadata: _metadata }, _modality_initializers, _modality_extraInitializers);
            __esDecorate(null, null, _startsAt_decorators, { kind: "field", name: "startsAt", static: false, private: false, access: { has: obj => "startsAt" in obj, get: obj => obj.startsAt, set: (obj, value) => { obj.startsAt = value; } }, metadata: _metadata }, _startsAt_initializers, _startsAt_extraInitializers);
            __esDecorate(null, null, _endsAt_decorators, { kind: "field", name: "endsAt", static: false, private: false, access: { has: obj => "endsAt" in obj, get: obj => obj.endsAt, set: (obj, value) => { obj.endsAt = value; } }, metadata: _metadata }, _endsAt_initializers, _endsAt_extraInitializers);
            __esDecorate(null, null, _location_decorators, { kind: "field", name: "location", static: false, private: false, access: { has: obj => "location" in obj, get: obj => obj.location, set: (obj, value) => { obj.location = value; } }, metadata: _metadata }, _location_initializers, _location_extraInitializers);
            __esDecorate(null, null, _publishedAt_decorators, { kind: "field", name: "publishedAt", static: false, private: false, access: { has: obj => "publishedAt" in obj, get: obj => obj.publishedAt, set: (obj, value) => { obj.publishedAt = value; } }, metadata: _metadata }, _publishedAt_initializers, _publishedAt_extraInitializers);
            __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: obj => "status" in obj, get: obj => obj.status, set: (obj, value) => { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
            __esDecorate(null, null, _votingOpensAt_decorators, { kind: "field", name: "votingOpensAt", static: false, private: false, access: { has: obj => "votingOpensAt" in obj, get: obj => obj.votingOpensAt, set: (obj, value) => { obj.votingOpensAt = value; } }, metadata: _metadata }, _votingOpensAt_initializers, _votingOpensAt_extraInitializers);
            __esDecorate(null, null, _votingClosesAt_decorators, { kind: "field", name: "votingClosesAt", static: false, private: false, access: { has: obj => "votingClosesAt" in obj, get: obj => obj.votingClosesAt, set: (obj, value) => { obj.votingClosesAt = value; } }, metadata: _metadata }, _votingClosesAt_initializers, _votingClosesAt_extraInitializers);
            __esDecorate(null, null, _topicCount_decorators, { kind: "field", name: "topicCount", static: false, private: false, access: { has: obj => "topicCount" in obj, get: obj => obj.topicCount, set: (obj, value) => { obj.topicCount = value; } }, metadata: _metadata }, _topicCount_initializers, _topicCount_extraInitializers);
            __esDecorate(null, null, _agendaCount_decorators, { kind: "field", name: "agendaCount", static: false, private: false, access: { has: obj => "agendaCount" in obj, get: obj => obj.agendaCount, set: (obj, value) => { obj.agendaCount = value; } }, metadata: _metadata }, _agendaCount_initializers, _agendaCount_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        id = __runInitializers(this, _id_initializers, void 0);
        folio = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _folio_initializers, void 0));
        title = (__runInitializers(this, _folio_extraInitializers), __runInitializers(this, _title_initializers, void 0));
        type = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _type_initializers, void 0));
        modality = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _modality_initializers, void 0));
        startsAt = (__runInitializers(this, _modality_extraInitializers), __runInitializers(this, _startsAt_initializers, void 0));
        endsAt = (__runInitializers(this, _startsAt_extraInitializers), __runInitializers(this, _endsAt_initializers, void 0));
        location = (__runInitializers(this, _endsAt_extraInitializers), __runInitializers(this, _location_initializers, void 0));
        publishedAt = (__runInitializers(this, _location_extraInitializers), __runInitializers(this, _publishedAt_initializers, void 0));
        status = (__runInitializers(this, _publishedAt_extraInitializers), __runInitializers(this, _status_initializers, void 0));
        votingOpensAt = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _votingOpensAt_initializers, void 0));
        votingClosesAt = (__runInitializers(this, _votingOpensAt_extraInitializers), __runInitializers(this, _votingClosesAt_initializers, void 0));
        topicCount = (__runInitializers(this, _votingClosesAt_extraInitializers), __runInitializers(this, _topicCount_initializers, void 0));
        agendaCount = (__runInitializers(this, _topicCount_extraInitializers), __runInitializers(this, _agendaCount_initializers, void 0));
        static fromEntity(assembly, now) {
            return summaryFields(assembly, now);
        }
        constructor() {
            __runInitializers(this, _agendaCount_extraInitializers);
        }
    };
})();
export { AssemblySummaryDto };
function summaryFields(assembly, now) {
    const opens = assembly.topics.map((t) => t.opensAt.getTime());
    const closes = assembly.topics.map((t) => t.closesAt.getTime());
    return {
        id: assembly.id,
        folio: assembly.folio,
        title: assembly.title,
        type: assembly.type,
        modality: assembly.modality,
        startsAt: assembly.startsAt,
        endsAt: assembly.endsAt,
        location: assembly.location,
        publishedAt: assembly.publishedAt,
        status: assemblyStatus(assembly.topics, assembly.publishedAt !== null, now),
        votingOpensAt: opens.length ? new Date(Math.min(...opens)) : null,
        votingClosesAt: closes.length ? new Date(Math.max(...closes)) : null,
        topicCount: assembly.topics.length,
        agendaCount: assembly.agendaItems.length,
    };
}
let AssemblyResponseDto = (() => {
    let _classSuper = AssemblySummaryDto;
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    let _createdBy_decorators;
    let _createdBy_initializers = [];
    let _createdBy_extraInitializers = [];
    let _createdAt_decorators;
    let _createdAt_initializers = [];
    let _createdAt_extraInitializers = [];
    let _agenda_decorators;
    let _agenda_initializers = [];
    let _agenda_extraInitializers = [];
    let _topics_decorators;
    let _topics_initializers = [];
    let _topics_extraInitializers = [];
    return class AssemblyResponseDto extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _description_decorators = [ApiProperty()];
            _createdBy_decorators = [ApiProperty({ example: { id: 'uuid', email: 'admin@example.com' } })];
            _createdAt_decorators = [ApiProperty({ type: String, format: 'date-time' })];
            _agenda_decorators = [ApiProperty({ type: [AgendaItemResponseDto] })];
            _topics_decorators = [ApiProperty({ type: [VotingTopicResponseDto] })];
            __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
            __esDecorate(null, null, _createdBy_decorators, { kind: "field", name: "createdBy", static: false, private: false, access: { has: obj => "createdBy" in obj, get: obj => obj.createdBy, set: (obj, value) => { obj.createdBy = value; } }, metadata: _metadata }, _createdBy_initializers, _createdBy_extraInitializers);
            __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: obj => "createdAt" in obj, get: obj => obj.createdAt, set: (obj, value) => { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
            __esDecorate(null, null, _agenda_decorators, { kind: "field", name: "agenda", static: false, private: false, access: { has: obj => "agenda" in obj, get: obj => obj.agenda, set: (obj, value) => { obj.agenda = value; } }, metadata: _metadata }, _agenda_initializers, _agenda_extraInitializers);
            __esDecorate(null, null, _topics_decorators, { kind: "field", name: "topics", static: false, private: false, access: { has: obj => "topics" in obj, get: obj => obj.topics, set: (obj, value) => { obj.topics = value; } }, metadata: _metadata }, _topics_initializers, _topics_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        description = __runInitializers(this, _description_initializers, void 0);
        createdBy = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _createdBy_initializers, void 0));
        createdAt = (__runInitializers(this, _createdBy_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
        agenda = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _agenda_initializers, void 0));
        topics = (__runInitializers(this, _agenda_extraInitializers), __runInitializers(this, _topics_initializers, void 0));
        static fromEntity(assembly, now) {
            const published = assembly.publishedAt !== null;
            return {
                ...summaryFields(assembly, now),
                description: assembly.description,
                createdBy: { id: assembly.createdBy.id, email: assembly.createdBy.email },
                createdAt: assembly.createdAt,
                agenda: assembly.agendaItems.map((item) => ({
                    id: item.id,
                    title: item.title,
                    description: item.description,
                    position: item.position,
                })),
                topics: assembly.topics.map((topic) => ({
                    id: topic.id,
                    title: topic.title,
                    description: topic.description,
                    opensAt: topic.opensAt,
                    closesAt: topic.closesAt,
                    position: topic.position,
                    status: topicStatus(topic, published, now),
                    options: topic.options.map((option) => ({
                        id: option.id,
                        text: option.text,
                        position: option.position,
                    })),
                })),
            };
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _topics_extraInitializers);
        }
    };
})();
export { AssemblyResponseDto };
let AssemblyStatusCountsDto = (() => {
    let _TODAS_decorators;
    let _TODAS_initializers = [];
    let _TODAS_extraInitializers = [];
    let _BORRADOR_decorators;
    let _BORRADOR_initializers = [];
    let _BORRADOR_extraInitializers = [];
    let _PROGRAMADA_decorators;
    let _PROGRAMADA_initializers = [];
    let _PROGRAMADA_extraInitializers = [];
    let _ABIERTA_decorators;
    let _ABIERTA_initializers = [];
    let _ABIERTA_extraInitializers = [];
    let _CERRADA_decorators;
    let _CERRADA_initializers = [];
    let _CERRADA_extraInitializers = [];
    return class AssemblyStatusCountsDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _TODAS_decorators = [ApiProperty({ example: 5 })];
            _BORRADOR_decorators = [ApiProperty({ example: 1 })];
            _PROGRAMADA_decorators = [ApiProperty({ example: 1 })];
            _ABIERTA_decorators = [ApiProperty({ example: 0 })];
            _CERRADA_decorators = [ApiProperty({ example: 3 })];
            __esDecorate(null, null, _TODAS_decorators, { kind: "field", name: "TODAS", static: false, private: false, access: { has: obj => "TODAS" in obj, get: obj => obj.TODAS, set: (obj, value) => { obj.TODAS = value; } }, metadata: _metadata }, _TODAS_initializers, _TODAS_extraInitializers);
            __esDecorate(null, null, _BORRADOR_decorators, { kind: "field", name: "BORRADOR", static: false, private: false, access: { has: obj => "BORRADOR" in obj, get: obj => obj.BORRADOR, set: (obj, value) => { obj.BORRADOR = value; } }, metadata: _metadata }, _BORRADOR_initializers, _BORRADOR_extraInitializers);
            __esDecorate(null, null, _PROGRAMADA_decorators, { kind: "field", name: "PROGRAMADA", static: false, private: false, access: { has: obj => "PROGRAMADA" in obj, get: obj => obj.PROGRAMADA, set: (obj, value) => { obj.PROGRAMADA = value; } }, metadata: _metadata }, _PROGRAMADA_initializers, _PROGRAMADA_extraInitializers);
            __esDecorate(null, null, _ABIERTA_decorators, { kind: "field", name: "ABIERTA", static: false, private: false, access: { has: obj => "ABIERTA" in obj, get: obj => obj.ABIERTA, set: (obj, value) => { obj.ABIERTA = value; } }, metadata: _metadata }, _ABIERTA_initializers, _ABIERTA_extraInitializers);
            __esDecorate(null, null, _CERRADA_decorators, { kind: "field", name: "CERRADA", static: false, private: false, access: { has: obj => "CERRADA" in obj, get: obj => obj.CERRADA, set: (obj, value) => { obj.CERRADA = value; } }, metadata: _metadata }, _CERRADA_initializers, _CERRADA_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        TODAS = __runInitializers(this, _TODAS_initializers, void 0);
        BORRADOR = (__runInitializers(this, _TODAS_extraInitializers), __runInitializers(this, _BORRADOR_initializers, void 0));
        PROGRAMADA = (__runInitializers(this, _BORRADOR_extraInitializers), __runInitializers(this, _PROGRAMADA_initializers, void 0));
        ABIERTA = (__runInitializers(this, _PROGRAMADA_extraInitializers), __runInitializers(this, _ABIERTA_initializers, void 0));
        CERRADA = (__runInitializers(this, _ABIERTA_extraInitializers), __runInitializers(this, _CERRADA_initializers, void 0));
        constructor() {
            __runInitializers(this, _CERRADA_extraInitializers);
        }
    };
})();
export { AssemblyStatusCountsDto };
let AssemblyPageResponseDto = (() => {
    let _items_decorators;
    let _items_initializers = [];
    let _items_extraInitializers = [];
    let _page_decorators;
    let _page_initializers = [];
    let _page_extraInitializers = [];
    let _pageSize_decorators;
    let _pageSize_initializers = [];
    let _pageSize_extraInitializers = [];
    let _total_decorators;
    let _total_initializers = [];
    let _total_extraInitializers = [];
    let _totalPages_decorators;
    let _totalPages_initializers = [];
    let _totalPages_extraInitializers = [];
    let _counts_decorators;
    let _counts_initializers = [];
    let _counts_extraInitializers = [];
    return class AssemblyPageResponseDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _items_decorators = [ApiProperty({ type: [AssemblySummaryDto] })];
            _page_decorators = [ApiProperty({ example: 1 })];
            _pageSize_decorators = [ApiProperty({ example: 20 })];
            _total_decorators = [ApiProperty({ example: 5 })];
            _totalPages_decorators = [ApiProperty({ example: 1 })];
            _counts_decorators = [ApiProperty({
                    type: AssemblyStatusCountsDto,
                    description: 'Cantidad por estado con la búsqueda y el periodo aplicados.',
                })];
            __esDecorate(null, null, _items_decorators, { kind: "field", name: "items", static: false, private: false, access: { has: obj => "items" in obj, get: obj => obj.items, set: (obj, value) => { obj.items = value; } }, metadata: _metadata }, _items_initializers, _items_extraInitializers);
            __esDecorate(null, null, _page_decorators, { kind: "field", name: "page", static: false, private: false, access: { has: obj => "page" in obj, get: obj => obj.page, set: (obj, value) => { obj.page = value; } }, metadata: _metadata }, _page_initializers, _page_extraInitializers);
            __esDecorate(null, null, _pageSize_decorators, { kind: "field", name: "pageSize", static: false, private: false, access: { has: obj => "pageSize" in obj, get: obj => obj.pageSize, set: (obj, value) => { obj.pageSize = value; } }, metadata: _metadata }, _pageSize_initializers, _pageSize_extraInitializers);
            __esDecorate(null, null, _total_decorators, { kind: "field", name: "total", static: false, private: false, access: { has: obj => "total" in obj, get: obj => obj.total, set: (obj, value) => { obj.total = value; } }, metadata: _metadata }, _total_initializers, _total_extraInitializers);
            __esDecorate(null, null, _totalPages_decorators, { kind: "field", name: "totalPages", static: false, private: false, access: { has: obj => "totalPages" in obj, get: obj => obj.totalPages, set: (obj, value) => { obj.totalPages = value; } }, metadata: _metadata }, _totalPages_initializers, _totalPages_extraInitializers);
            __esDecorate(null, null, _counts_decorators, { kind: "field", name: "counts", static: false, private: false, access: { has: obj => "counts" in obj, get: obj => obj.counts, set: (obj, value) => { obj.counts = value; } }, metadata: _metadata }, _counts_initializers, _counts_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        items = __runInitializers(this, _items_initializers, void 0);
        page = (__runInitializers(this, _items_extraInitializers), __runInitializers(this, _page_initializers, void 0));
        pageSize = (__runInitializers(this, _page_extraInitializers), __runInitializers(this, _pageSize_initializers, void 0));
        total = (__runInitializers(this, _pageSize_extraInitializers), __runInitializers(this, _total_initializers, void 0));
        totalPages = (__runInitializers(this, _total_extraInitializers), __runInitializers(this, _totalPages_initializers, void 0));
        counts = (__runInitializers(this, _totalPages_extraInitializers), __runInitializers(this, _counts_initializers, void 0));
        constructor() {
            __runInitializers(this, _counts_extraInitializers);
        }
    };
})();
export { AssemblyPageResponseDto };
let AudienceResponseDto = (() => {
    let _residents_decorators;
    let _residents_initializers = [];
    let _residents_extraInitializers = [];
    return class AudienceResponseDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _residents_decorators = [ApiProperty({ example: 47, description: 'Residentes activos con unidad.' })];
            __esDecorate(null, null, _residents_decorators, { kind: "field", name: "residents", static: false, private: false, access: { has: obj => "residents" in obj, get: obj => obj.residents, set: (obj, value) => { obj.residents = value; } }, metadata: _metadata }, _residents_initializers, _residents_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        residents = __runInitializers(this, _residents_initializers, void 0);
        constructor() {
            __runInitializers(this, _residents_extraInitializers);
        }
    };
})();
export { AudienceResponseDto };
