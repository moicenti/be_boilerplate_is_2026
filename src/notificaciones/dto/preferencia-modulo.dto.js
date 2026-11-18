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
import { IsBoolean, IsOptional, IsString } from 'class-validator';
/**
 * Un elemento del cuerpo de PUT /notificaciones/preferencias.
 * El residente sale siempre de la sesión. `residenteId` se acepta solo para poder
 * rechazar con 403 RECURSO_AJENO a quien intente escribir las preferencias de otro.
 */
let PreferenciaModuloDto = (() => {
    let _modulo_decorators;
    let _modulo_initializers = [];
    let _modulo_extraInitializers = [];
    let _activo_decorators;
    let _activo_initializers = [];
    let _activo_extraInitializers = [];
    let _residenteId_decorators;
    let _residenteId_initializers = [];
    let _residenteId_extraInitializers = [];
    return class PreferenciaModuloDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _modulo_decorators = [IsString()];
            _activo_decorators = [IsBoolean()];
            _residenteId_decorators = [IsOptional(), IsString()];
            __esDecorate(null, null, _modulo_decorators, { kind: "field", name: "modulo", static: false, private: false, access: { has: obj => "modulo" in obj, get: obj => obj.modulo, set: (obj, value) => { obj.modulo = value; } }, metadata: _metadata }, _modulo_initializers, _modulo_extraInitializers);
            __esDecorate(null, null, _activo_decorators, { kind: "field", name: "activo", static: false, private: false, access: { has: obj => "activo" in obj, get: obj => obj.activo, set: (obj, value) => { obj.activo = value; } }, metadata: _metadata }, _activo_initializers, _activo_extraInitializers);
            __esDecorate(null, null, _residenteId_decorators, { kind: "field", name: "residenteId", static: false, private: false, access: { has: obj => "residenteId" in obj, get: obj => obj.residenteId, set: (obj, value) => { obj.residenteId = value; } }, metadata: _metadata }, _residenteId_initializers, _residenteId_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        modulo = __runInitializers(this, _modulo_initializers, void 0);
        activo = (__runInitializers(this, _modulo_extraInitializers), __runInitializers(this, _activo_initializers, void 0));
        residenteId = (__runInitializers(this, _activo_extraInitializers), __runInitializers(this, _residenteId_initializers, void 0));
        constructor() {
            __runInitializers(this, _residenteId_extraInitializers);
        }
    };
})();
export { PreferenciaModuloDto };
