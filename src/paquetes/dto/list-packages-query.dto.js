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
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min, } from 'class-validator';
import { PackageStatus } from '@PrismaClient';
const trimToUndefined = ({ value }) => {
    if (typeof value !== 'string')
        return value;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
};
let ListPackagesQueryDto = (() => {
    let _estado_decorators;
    let _estado_initializers = [];
    let _estado_extraInitializers = [];
    let _unidad_decorators;
    let _unidad_initializers = [];
    let _unidad_extraInitializers = [];
    let _folio_decorators;
    let _folio_initializers = [];
    let _folio_extraInitializers = [];
    let _empresa_decorators;
    let _empresa_initializers = [];
    let _empresa_extraInitializers = [];
    let _q_decorators;
    let _q_initializers = [];
    let _q_extraInitializers = [];
    let _page_decorators;
    let _page_initializers = [];
    let _page_extraInitializers = [];
    return class ListPackagesQueryDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _estado_decorators = [ApiPropertyOptional({
                    enum: PackageStatus,
                    default: PackageStatus.PENDIENTE_RETIRO,
                }), IsOptional(), IsEnum(PackageStatus, { message: 'El estado no es válido.' })];
            _unidad_decorators = [ApiPropertyOptional({
                    example: 'A-304',
                    description: 'Código exacto de la unidad.',
                }), Transform(trimToUndefined), IsOptional(), IsString(), MaxLength(20)];
            _folio_decorators = [ApiPropertyOptional({ example: 'PAQ-2026-0187' }), Transform(trimToUndefined), IsOptional(), IsString(), MaxLength(30)];
            _empresa_decorators = [ApiPropertyOptional({ example: 'DHL' }), Transform(trimToUndefined), IsOptional(), IsString(), MaxLength(60)];
            _q_decorators = [ApiPropertyOptional({
                    example: 'Ana',
                    description: 'Busca por folio, nombre del destinatario o unidad.',
                }), Transform(trimToUndefined), IsOptional(), IsString(), MaxLength(100)];
            _page_decorators = [ApiPropertyOptional({ default: 1, minimum: 1 }), IsOptional(), Type(() => Number), IsInt({ message: 'La página debe ser un número entero.' }), Min(1, { message: 'La página debe ser 1 o mayor.' })];
            __esDecorate(null, null, _estado_decorators, { kind: "field", name: "estado", static: false, private: false, access: { has: obj => "estado" in obj, get: obj => obj.estado, set: (obj, value) => { obj.estado = value; } }, metadata: _metadata }, _estado_initializers, _estado_extraInitializers);
            __esDecorate(null, null, _unidad_decorators, { kind: "field", name: "unidad", static: false, private: false, access: { has: obj => "unidad" in obj, get: obj => obj.unidad, set: (obj, value) => { obj.unidad = value; } }, metadata: _metadata }, _unidad_initializers, _unidad_extraInitializers);
            __esDecorate(null, null, _folio_decorators, { kind: "field", name: "folio", static: false, private: false, access: { has: obj => "folio" in obj, get: obj => obj.folio, set: (obj, value) => { obj.folio = value; } }, metadata: _metadata }, _folio_initializers, _folio_extraInitializers);
            __esDecorate(null, null, _empresa_decorators, { kind: "field", name: "empresa", static: false, private: false, access: { has: obj => "empresa" in obj, get: obj => obj.empresa, set: (obj, value) => { obj.empresa = value; } }, metadata: _metadata }, _empresa_initializers, _empresa_extraInitializers);
            __esDecorate(null, null, _q_decorators, { kind: "field", name: "q", static: false, private: false, access: { has: obj => "q" in obj, get: obj => obj.q, set: (obj, value) => { obj.q = value; } }, metadata: _metadata }, _q_initializers, _q_extraInitializers);
            __esDecorate(null, null, _page_decorators, { kind: "field", name: "page", static: false, private: false, access: { has: obj => "page" in obj, get: obj => obj.page, set: (obj, value) => { obj.page = value; } }, metadata: _metadata }, _page_initializers, _page_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        estado = __runInitializers(this, _estado_initializers, PackageStatus.PENDIENTE_RETIRO);
        unidad = (__runInitializers(this, _estado_extraInitializers), __runInitializers(this, _unidad_initializers, void 0));
        folio = (__runInitializers(this, _unidad_extraInitializers), __runInitializers(this, _folio_initializers, void 0));
        empresa = (__runInitializers(this, _folio_extraInitializers), __runInitializers(this, _empresa_initializers, void 0));
        q = (__runInitializers(this, _empresa_extraInitializers), __runInitializers(this, _q_initializers, void 0));
        page = (__runInitializers(this, _q_extraInitializers), __runInitializers(this, _page_initializers, 1));
        constructor() {
            __runInitializers(this, _page_extraInitializers);
        }
    };
})();
export { ListPackagesQueryDto };
