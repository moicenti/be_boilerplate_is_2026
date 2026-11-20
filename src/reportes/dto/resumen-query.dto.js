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
import { IsOptional } from 'class-validator';
/**
 * GET /reportes/resumen?desde=2026-11-01&hasta=2026-11-30&seccion=3
 *
 * Los valores llegan sin validar a propósito: el servicio los revisa y responde
 * 400 FILTROS_INVALIDOS con { codigo, mensaje }, que es el formato del diseño.
 */
let ResumenQueryDto = (() => {
    let _desde_decorators;
    let _desde_initializers = [];
    let _desde_extraInitializers = [];
    let _hasta_decorators;
    let _hasta_initializers = [];
    let _hasta_extraInitializers = [];
    let _seccion_decorators;
    let _seccion_initializers = [];
    let _seccion_extraInitializers = [];
    return class ResumenQueryDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _desde_decorators = [IsOptional()];
            _hasta_decorators = [IsOptional()];
            _seccion_decorators = [IsOptional()];
            __esDecorate(null, null, _desde_decorators, { kind: "field", name: "desde", static: false, private: false, access: { has: obj => "desde" in obj, get: obj => obj.desde, set: (obj, value) => { obj.desde = value; } }, metadata: _metadata }, _desde_initializers, _desde_extraInitializers);
            __esDecorate(null, null, _hasta_decorators, { kind: "field", name: "hasta", static: false, private: false, access: { has: obj => "hasta" in obj, get: obj => obj.hasta, set: (obj, value) => { obj.hasta = value; } }, metadata: _metadata }, _hasta_initializers, _hasta_extraInitializers);
            __esDecorate(null, null, _seccion_decorators, { kind: "field", name: "seccion", static: false, private: false, access: { has: obj => "seccion" in obj, get: obj => obj.seccion, set: (obj, value) => { obj.seccion = value; } }, metadata: _metadata }, _seccion_initializers, _seccion_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        desde = __runInitializers(this, _desde_initializers, void 0);
        hasta = (__runInitializers(this, _desde_extraInitializers), __runInitializers(this, _hasta_initializers, void 0));
        seccion = (__runInitializers(this, _hasta_extraInitializers), __runInitializers(this, _seccion_initializers, void 0));
        constructor() {
            __runInitializers(this, _seccion_extraInitializers);
        }
    };
})();
export { ResumenQueryDto };
