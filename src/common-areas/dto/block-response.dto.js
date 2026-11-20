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
import { CommonAreaBlockReason } from '@PrismaClient';
let BlockResponseDto = (() => {
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _areaId_decorators;
    let _areaId_initializers = [];
    let _areaId_extraInitializers = [];
    let _inicio_decorators;
    let _inicio_initializers = [];
    let _inicio_extraInitializers = [];
    let _fin_decorators;
    let _fin_initializers = [];
    let _fin_extraInitializers = [];
    let _motivo_decorators;
    let _motivo_initializers = [];
    let _motivo_extraInitializers = [];
    let _creadoEn_decorators;
    let _creadoEn_initializers = [];
    let _creadoEn_extraInitializers = [];
    return class BlockResponseDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _id_decorators = [ApiProperty({ example: 1 })];
            _areaId_decorators = [ApiProperty({ example: 2 })];
            _inicio_decorators = [ApiProperty({ type: String, format: 'date-time' })];
            _fin_decorators = [ApiProperty({ type: String, format: 'date-time' })];
            _motivo_decorators = [ApiProperty({ enum: CommonAreaBlockReason })];
            _creadoEn_decorators = [ApiProperty({ type: String, format: 'date-time' })];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _areaId_decorators, { kind: "field", name: "areaId", static: false, private: false, access: { has: obj => "areaId" in obj, get: obj => obj.areaId, set: (obj, value) => { obj.areaId = value; } }, metadata: _metadata }, _areaId_initializers, _areaId_extraInitializers);
            __esDecorate(null, null, _inicio_decorators, { kind: "field", name: "inicio", static: false, private: false, access: { has: obj => "inicio" in obj, get: obj => obj.inicio, set: (obj, value) => { obj.inicio = value; } }, metadata: _metadata }, _inicio_initializers, _inicio_extraInitializers);
            __esDecorate(null, null, _fin_decorators, { kind: "field", name: "fin", static: false, private: false, access: { has: obj => "fin" in obj, get: obj => obj.fin, set: (obj, value) => { obj.fin = value; } }, metadata: _metadata }, _fin_initializers, _fin_extraInitializers);
            __esDecorate(null, null, _motivo_decorators, { kind: "field", name: "motivo", static: false, private: false, access: { has: obj => "motivo" in obj, get: obj => obj.motivo, set: (obj, value) => { obj.motivo = value; } }, metadata: _metadata }, _motivo_initializers, _motivo_extraInitializers);
            __esDecorate(null, null, _creadoEn_decorators, { kind: "field", name: "creadoEn", static: false, private: false, access: { has: obj => "creadoEn" in obj, get: obj => obj.creadoEn, set: (obj, value) => { obj.creadoEn = value; } }, metadata: _metadata }, _creadoEn_initializers, _creadoEn_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        id = __runInitializers(this, _id_initializers, void 0);
        areaId = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _areaId_initializers, void 0));
        inicio = (__runInitializers(this, _areaId_extraInitializers), __runInitializers(this, _inicio_initializers, void 0));
        fin = (__runInitializers(this, _inicio_extraInitializers), __runInitializers(this, _fin_initializers, void 0));
        motivo = (__runInitializers(this, _fin_extraInitializers), __runInitializers(this, _motivo_initializers, void 0));
        creadoEn = (__runInitializers(this, _motivo_extraInitializers), __runInitializers(this, _creadoEn_initializers, void 0));
        static fromEntity(block) {
            return {
                id: block.id,
                areaId: block.areaId,
                inicio: block.startsAt,
                fin: block.endsAt,
                motivo: block.reason,
                creadoEn: block.createdAt,
            };
        }
        constructor() {
            __runInitializers(this, _creadoEn_extraInitializers);
        }
    };
})();
export { BlockResponseDto };
