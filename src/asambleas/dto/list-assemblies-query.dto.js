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
import { IsIn, IsInt, IsOptional, IsString, Matches, MaxLength, Min, } from 'class-validator';
import { AssemblyStatus } from '../domain/assembly-status.js';
const trimToUndefined = ({ value }) => {
    if (typeof value !== 'string')
        return value;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
};
const DATE = /^\d{4}-\d{2}-\d{2}$/;
let ListAssembliesQueryDto = (() => {
    let _q_decorators;
    let _q_initializers = [];
    let _q_extraInitializers = [];
    let _estado_decorators;
    let _estado_initializers = [];
    let _estado_extraInitializers = [];
    let _desde_decorators;
    let _desde_initializers = [];
    let _desde_extraInitializers = [];
    let _hasta_decorators;
    let _hasta_initializers = [];
    let _hasta_extraInitializers = [];
    let _page_decorators;
    let _page_initializers = [];
    let _page_extraInitializers = [];
    return class ListAssembliesQueryDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _q_decorators = [ApiPropertyOptional({ description: 'Busca por título o folio.' }), Transform(trimToUndefined), IsOptional(), IsString(), MaxLength(100)];
            _estado_decorators = [ApiPropertyOptional({ enum: Object.values(AssemblyStatus) }), Transform(trimToUndefined), IsOptional(), IsIn(Object.values(AssemblyStatus), { message: 'El estado no es válido.' })];
            _desde_decorators = [ApiPropertyOptional({
                    example: '2026-10-01',
                    description: 'Reuniones desde este día.',
                }), Transform(trimToUndefined), IsOptional(), Matches(DATE, {
                    message: 'La fecha "desde" debe tener el formato AAAA-MM-DD.',
                })];
            _hasta_decorators = [ApiPropertyOptional({
                    example: '2026-11-30',
                    description: 'Reuniones hasta este día.',
                }), Transform(trimToUndefined), IsOptional(), Matches(DATE, {
                    message: 'La fecha "hasta" debe tener el formato AAAA-MM-DD.',
                })];
            _page_decorators = [ApiPropertyOptional({ default: 1, minimum: 1 }), IsOptional(), Type(() => Number), IsInt({ message: 'La página debe ser un número entero.' }), Min(1, { message: 'La página debe ser 1 o mayor.' })];
            __esDecorate(null, null, _q_decorators, { kind: "field", name: "q", static: false, private: false, access: { has: obj => "q" in obj, get: obj => obj.q, set: (obj, value) => { obj.q = value; } }, metadata: _metadata }, _q_initializers, _q_extraInitializers);
            __esDecorate(null, null, _estado_decorators, { kind: "field", name: "estado", static: false, private: false, access: { has: obj => "estado" in obj, get: obj => obj.estado, set: (obj, value) => { obj.estado = value; } }, metadata: _metadata }, _estado_initializers, _estado_extraInitializers);
            __esDecorate(null, null, _desde_decorators, { kind: "field", name: "desde", static: false, private: false, access: { has: obj => "desde" in obj, get: obj => obj.desde, set: (obj, value) => { obj.desde = value; } }, metadata: _metadata }, _desde_initializers, _desde_extraInitializers);
            __esDecorate(null, null, _hasta_decorators, { kind: "field", name: "hasta", static: false, private: false, access: { has: obj => "hasta" in obj, get: obj => obj.hasta, set: (obj, value) => { obj.hasta = value; } }, metadata: _metadata }, _hasta_initializers, _hasta_extraInitializers);
            __esDecorate(null, null, _page_decorators, { kind: "field", name: "page", static: false, private: false, access: { has: obj => "page" in obj, get: obj => obj.page, set: (obj, value) => { obj.page = value; } }, metadata: _metadata }, _page_initializers, _page_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        q = __runInitializers(this, _q_initializers, void 0);
        estado = (__runInitializers(this, _q_extraInitializers), __runInitializers(this, _estado_initializers, void 0));
        desde = (__runInitializers(this, _estado_extraInitializers), __runInitializers(this, _desde_initializers, void 0));
        hasta = (__runInitializers(this, _desde_extraInitializers), __runInitializers(this, _hasta_initializers, void 0));
        page = (__runInitializers(this, _hasta_extraInitializers), __runInitializers(this, _page_initializers, 1));
        constructor() {
            __runInitializers(this, _page_extraInitializers);
        }
    };
})();
export { ListAssembliesQueryDto };
