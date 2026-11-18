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
import { IsOptional, IsUUID, Length } from 'class-validator';
import { RequiredText } from '@Common/decorators';
let CreatePackageDto = (() => {
    let _unitId_decorators;
    let _unitId_initializers = [];
    let _unitId_extraInitializers = [];
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
    return class CreatePackageDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _unitId_decorators = [ApiProperty({ format: 'uuid', description: 'Unidad destinataria.' }), IsUUID('4', { message: 'Selecciona una unidad destinataria válida.' })];
            _recipientName_decorators = [ApiProperty({ example: 'Carlos Mendoza', maxLength: 100 }), RequiredText('El nombre del destinatario', 100)];
            _carrier_decorators = [ApiProperty({ example: 'Estafeta', maxLength: 60 }), RequiredText('La empresa de mensajería', 60, 'obligatoria')];
            _trackingReference_decorators = [ApiProperty({ example: 'EST-629483715', maxLength: 100 }), RequiredText('La referencia o guía', 100, 'obligatoria')];
            _description_decorators = [ApiProperty({
                    example: '1 caja mediana de cartón, cerrada.',
                    maxLength: 200,
                }), RequiredText('La descripción del paquete', 200, 'obligatoria')];
            _notes_decorators = [ApiPropertyOptional({
                    example: 'Sin daños visibles en el empaque.',
                    maxLength: 300,
                }), IsOptional(), Transform(({ value }) => typeof value === 'string' ? value.trim() : value), Length(0, 300, {
                    message: 'Las observaciones no pueden superar los 300 caracteres.',
                })];
            __esDecorate(null, null, _unitId_decorators, { kind: "field", name: "unitId", static: false, private: false, access: { has: obj => "unitId" in obj, get: obj => obj.unitId, set: (obj, value) => { obj.unitId = value; } }, metadata: _metadata }, _unitId_initializers, _unitId_extraInitializers);
            __esDecorate(null, null, _recipientName_decorators, { kind: "field", name: "recipientName", static: false, private: false, access: { has: obj => "recipientName" in obj, get: obj => obj.recipientName, set: (obj, value) => { obj.recipientName = value; } }, metadata: _metadata }, _recipientName_initializers, _recipientName_extraInitializers);
            __esDecorate(null, null, _carrier_decorators, { kind: "field", name: "carrier", static: false, private: false, access: { has: obj => "carrier" in obj, get: obj => obj.carrier, set: (obj, value) => { obj.carrier = value; } }, metadata: _metadata }, _carrier_initializers, _carrier_extraInitializers);
            __esDecorate(null, null, _trackingReference_decorators, { kind: "field", name: "trackingReference", static: false, private: false, access: { has: obj => "trackingReference" in obj, get: obj => obj.trackingReference, set: (obj, value) => { obj.trackingReference = value; } }, metadata: _metadata }, _trackingReference_initializers, _trackingReference_extraInitializers);
            __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
            __esDecorate(null, null, _notes_decorators, { kind: "field", name: "notes", static: false, private: false, access: { has: obj => "notes" in obj, get: obj => obj.notes, set: (obj, value) => { obj.notes = value; } }, metadata: _metadata }, _notes_initializers, _notes_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        unitId = __runInitializers(this, _unitId_initializers, void 0);
        recipientName = (__runInitializers(this, _unitId_extraInitializers), __runInitializers(this, _recipientName_initializers, void 0));
        carrier = (__runInitializers(this, _recipientName_extraInitializers), __runInitializers(this, _carrier_initializers, void 0));
        trackingReference = (__runInitializers(this, _carrier_extraInitializers), __runInitializers(this, _trackingReference_initializers, void 0));
        description = (__runInitializers(this, _trackingReference_extraInitializers), __runInitializers(this, _description_initializers, void 0));
        notes = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _notes_initializers, void 0));
        constructor() {
            __runInitializers(this, _notes_extraInitializers);
        }
    };
})();
export { CreatePackageDto };
