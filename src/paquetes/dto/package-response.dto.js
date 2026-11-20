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
import { PackageStatus } from '@PrismaClient';
let PackageUnitDto = (() => {
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _code_decorators;
    let _code_initializers = [];
    let _code_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    return class PackageUnitDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _id_decorators = [ApiProperty({ format: 'uuid' })];
            _code_decorators = [ApiProperty({ example: 'A-304' })];
            _description_decorators = [ApiProperty({ example: 'Torre A, departamento 304' })];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _code_decorators, { kind: "field", name: "code", static: false, private: false, access: { has: obj => "code" in obj, get: obj => obj.code, set: (obj, value) => { obj.code = value; } }, metadata: _metadata }, _code_initializers, _code_extraInitializers);
            __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        id = __runInitializers(this, _id_initializers, void 0);
        code = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _code_initializers, void 0));
        description = (__runInitializers(this, _code_extraInitializers), __runInitializers(this, _description_initializers, void 0));
        constructor() {
            __runInitializers(this, _description_extraInitializers);
        }
    };
})();
let PackageStaffDto = (() => {
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _email_decorators;
    let _email_initializers = [];
    let _email_extraInitializers = [];
    return class PackageStaffDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _id_decorators = [ApiProperty({ format: 'uuid' })];
            _email_decorators = [ApiProperty({ example: 'ricardo.soto@example.com' })];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: obj => "email" in obj, get: obj => obj.email, set: (obj, value) => { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        id = __runInitializers(this, _id_initializers, void 0);
        email = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _email_initializers, void 0));
        constructor() {
            __runInitializers(this, _email_extraInitializers);
        }
    };
})();
let PackageResponseDto = (() => {
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _folio_decorators;
    let _folio_initializers = [];
    let _folio_extraInitializers = [];
    let _status_decorators;
    let _status_initializers = [];
    let _status_extraInitializers = [];
    let _unit_decorators;
    let _unit_initializers = [];
    let _unit_extraInitializers = [];
    let _recipientName_decorators;
    let _recipientName_initializers = [];
    let _recipientName_extraInitializers = [];
    let _carrier_decorators;
    let _carrier_initializers = [];
    let _carrier_extraInitializers = [];
    let _trackingReference_decorators;
    let _trackingReference_initializers = [];
    let _trackingReference_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    let _notes_decorators;
    let _notes_initializers = [];
    let _notes_extraInitializers = [];
    let _receivedAt_decorators;
    let _receivedAt_initializers = [];
    let _receivedAt_extraInitializers = [];
    let _receivedBy_decorators;
    let _receivedBy_initializers = [];
    let _receivedBy_extraInitializers = [];
    let _deliveredTo_decorators;
    let _deliveredTo_initializers = [];
    let _deliveredTo_extraInitializers = [];
    let _deliveredAt_decorators;
    let _deliveredAt_initializers = [];
    let _deliveredAt_extraInitializers = [];
    let _deliveredBy_decorators;
    let _deliveredBy_initializers = [];
    let _deliveredBy_extraInitializers = [];
    let _pickupCode_decorators;
    let _pickupCode_initializers = [];
    let _pickupCode_extraInitializers = [];
    return class PackageResponseDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _id_decorators = [ApiProperty({ format: 'uuid' })];
            _folio_decorators = [ApiProperty({ example: 'PAQ-2026-0187' })];
            _status_decorators = [ApiProperty({ enum: PackageStatus })];
            _unit_decorators = [ApiProperty({ type: PackageUnitDto })];
            _recipientName_decorators = [ApiProperty()];
            _carrier_decorators = [ApiProperty()];
            _trackingReference_decorators = [ApiProperty()];
            _description_decorators = [ApiProperty()];
            _notes_decorators = [ApiPropertyOptional({ type: String, nullable: true })];
            _receivedAt_decorators = [ApiProperty({ type: String, format: 'date-time' })];
            _receivedBy_decorators = [ApiProperty({ type: PackageStaffDto })];
            _deliveredTo_decorators = [ApiPropertyOptional({ type: String, nullable: true })];
            _deliveredAt_decorators = [ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })];
            _deliveredBy_decorators = [ApiPropertyOptional({ type: PackageStaffDto, nullable: true })];
            _pickupCode_decorators = [ApiPropertyOptional({
                    example: '482913',
                    description: 'Solo para residentes de la unidad y mientras el paquete está pendiente.',
                })];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _folio_decorators, { kind: "field", name: "folio", static: false, private: false, access: { has: obj => "folio" in obj, get: obj => obj.folio, set: (obj, value) => { obj.folio = value; } }, metadata: _metadata }, _folio_initializers, _folio_extraInitializers);
            __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: obj => "status" in obj, get: obj => obj.status, set: (obj, value) => { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
            __esDecorate(null, null, _unit_decorators, { kind: "field", name: "unit", static: false, private: false, access: { has: obj => "unit" in obj, get: obj => obj.unit, set: (obj, value) => { obj.unit = value; } }, metadata: _metadata }, _unit_initializers, _unit_extraInitializers);
            __esDecorate(null, null, _recipientName_decorators, { kind: "field", name: "recipientName", static: false, private: false, access: { has: obj => "recipientName" in obj, get: obj => obj.recipientName, set: (obj, value) => { obj.recipientName = value; } }, metadata: _metadata }, _recipientName_initializers, _recipientName_extraInitializers);
            __esDecorate(null, null, _carrier_decorators, { kind: "field", name: "carrier", static: false, private: false, access: { has: obj => "carrier" in obj, get: obj => obj.carrier, set: (obj, value) => { obj.carrier = value; } }, metadata: _metadata }, _carrier_initializers, _carrier_extraInitializers);
            __esDecorate(null, null, _trackingReference_decorators, { kind: "field", name: "trackingReference", static: false, private: false, access: { has: obj => "trackingReference" in obj, get: obj => obj.trackingReference, set: (obj, value) => { obj.trackingReference = value; } }, metadata: _metadata }, _trackingReference_initializers, _trackingReference_extraInitializers);
            __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
            __esDecorate(null, null, _notes_decorators, { kind: "field", name: "notes", static: false, private: false, access: { has: obj => "notes" in obj, get: obj => obj.notes, set: (obj, value) => { obj.notes = value; } }, metadata: _metadata }, _notes_initializers, _notes_extraInitializers);
            __esDecorate(null, null, _receivedAt_decorators, { kind: "field", name: "receivedAt", static: false, private: false, access: { has: obj => "receivedAt" in obj, get: obj => obj.receivedAt, set: (obj, value) => { obj.receivedAt = value; } }, metadata: _metadata }, _receivedAt_initializers, _receivedAt_extraInitializers);
            __esDecorate(null, null, _receivedBy_decorators, { kind: "field", name: "receivedBy", static: false, private: false, access: { has: obj => "receivedBy" in obj, get: obj => obj.receivedBy, set: (obj, value) => { obj.receivedBy = value; } }, metadata: _metadata }, _receivedBy_initializers, _receivedBy_extraInitializers);
            __esDecorate(null, null, _deliveredTo_decorators, { kind: "field", name: "deliveredTo", static: false, private: false, access: { has: obj => "deliveredTo" in obj, get: obj => obj.deliveredTo, set: (obj, value) => { obj.deliveredTo = value; } }, metadata: _metadata }, _deliveredTo_initializers, _deliveredTo_extraInitializers);
            __esDecorate(null, null, _deliveredAt_decorators, { kind: "field", name: "deliveredAt", static: false, private: false, access: { has: obj => "deliveredAt" in obj, get: obj => obj.deliveredAt, set: (obj, value) => { obj.deliveredAt = value; } }, metadata: _metadata }, _deliveredAt_initializers, _deliveredAt_extraInitializers);
            __esDecorate(null, null, _deliveredBy_decorators, { kind: "field", name: "deliveredBy", static: false, private: false, access: { has: obj => "deliveredBy" in obj, get: obj => obj.deliveredBy, set: (obj, value) => { obj.deliveredBy = value; } }, metadata: _metadata }, _deliveredBy_initializers, _deliveredBy_extraInitializers);
            __esDecorate(null, null, _pickupCode_decorators, { kind: "field", name: "pickupCode", static: false, private: false, access: { has: obj => "pickupCode" in obj, get: obj => obj.pickupCode, set: (obj, value) => { obj.pickupCode = value; } }, metadata: _metadata }, _pickupCode_initializers, _pickupCode_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        id = __runInitializers(this, _id_initializers, void 0);
        folio = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _folio_initializers, void 0));
        status = (__runInitializers(this, _folio_extraInitializers), __runInitializers(this, _status_initializers, void 0));
        unit = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _unit_initializers, void 0));
        recipientName = (__runInitializers(this, _unit_extraInitializers), __runInitializers(this, _recipientName_initializers, void 0));
        carrier = (__runInitializers(this, _recipientName_extraInitializers), __runInitializers(this, _carrier_initializers, void 0));
        trackingReference = (__runInitializers(this, _carrier_extraInitializers), __runInitializers(this, _trackingReference_initializers, void 0));
        description = (__runInitializers(this, _trackingReference_extraInitializers), __runInitializers(this, _description_initializers, void 0));
        notes = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _notes_initializers, void 0));
        receivedAt = (__runInitializers(this, _notes_extraInitializers), __runInitializers(this, _receivedAt_initializers, void 0));
        receivedBy = (__runInitializers(this, _receivedAt_extraInitializers), __runInitializers(this, _receivedBy_initializers, void 0));
        deliveredTo = (__runInitializers(this, _receivedBy_extraInitializers), __runInitializers(this, _deliveredTo_initializers, void 0));
        deliveredAt = (__runInitializers(this, _deliveredTo_extraInitializers), __runInitializers(this, _deliveredAt_initializers, void 0));
        deliveredBy = (__runInitializers(this, _deliveredAt_extraInitializers), __runInitializers(this, _deliveredBy_initializers, void 0));
        pickupCode = (__runInitializers(this, _deliveredBy_extraInitializers), __runInitializers(this, _pickupCode_initializers, void 0));
        static fromEntity(pkg, options = {}) {
            return {
                ...(options.includePickupCode ? { pickupCode: pkg.pickupCode } : {}),
                id: pkg.id,
                folio: pkg.folio,
                status: pkg.status,
                unit: {
                    id: pkg.unit.id,
                    code: pkg.unit.code,
                    description: pkg.unit.description,
                },
                recipientName: pkg.recipientName,
                carrier: pkg.carrier,
                trackingReference: pkg.trackingReference,
                description: pkg.description,
                notes: pkg.notes,
                receivedAt: pkg.receivedAt,
                receivedBy: { id: pkg.receivedBy.id, email: pkg.receivedBy.email },
                deliveredTo: pkg.deliveredTo,
                deliveredAt: pkg.deliveredAt,
                deliveredBy: pkg.deliveredBy
                    ? { id: pkg.deliveredBy.id, email: pkg.deliveredBy.email }
                    : null,
            };
        }
        constructor() {
            __runInitializers(this, _pickupCode_extraInitializers);
        }
    };
})();
export { PackageResponseDto };
