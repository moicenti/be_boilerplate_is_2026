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
import { FeeRuleAction } from '@PrismaClient';
import { toZonedIso } from '@CommonAreas/utils';
let FeeRuleChangeResponseDto = (() => {
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _accion_decorators;
    let _accion_initializers = [];
    let _accion_extraInitializers = [];
    let _valorAnterior_decorators;
    let _valorAnterior_initializers = [];
    let _valorAnterior_extraInitializers = [];
    let _valorNuevo_decorators;
    let _valorNuevo_initializers = [];
    let _valorNuevo_extraInitializers = [];
    let _usuario_decorators;
    let _usuario_initializers = [];
    let _usuario_extraInitializers = [];
    let _fecha_decorators;
    let _fecha_initializers = [];
    let _fecha_extraInitializers = [];
    return class FeeRuleChangeResponseDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _id_decorators = [ApiProperty({ example: 1 })];
            _accion_decorators = [ApiProperty({ enum: FeeRuleAction })];
            _valorAnterior_decorators = [ApiProperty({ nullable: true, type: Object })];
            _valorNuevo_decorators = [ApiProperty({ type: Object })];
            _usuario_decorators = [ApiProperty({ example: 'admin@example.com', nullable: true, type: String })];
            _fecha_decorators = [ApiProperty({ example: '2026-11-05T09:00:00-06:00' })];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _accion_decorators, { kind: "field", name: "accion", static: false, private: false, access: { has: obj => "accion" in obj, get: obj => obj.accion, set: (obj, value) => { obj.accion = value; } }, metadata: _metadata }, _accion_initializers, _accion_extraInitializers);
            __esDecorate(null, null, _valorAnterior_decorators, { kind: "field", name: "valorAnterior", static: false, private: false, access: { has: obj => "valorAnterior" in obj, get: obj => obj.valorAnterior, set: (obj, value) => { obj.valorAnterior = value; } }, metadata: _metadata }, _valorAnterior_initializers, _valorAnterior_extraInitializers);
            __esDecorate(null, null, _valorNuevo_decorators, { kind: "field", name: "valorNuevo", static: false, private: false, access: { has: obj => "valorNuevo" in obj, get: obj => obj.valorNuevo, set: (obj, value) => { obj.valorNuevo = value; } }, metadata: _metadata }, _valorNuevo_initializers, _valorNuevo_extraInitializers);
            __esDecorate(null, null, _usuario_decorators, { kind: "field", name: "usuario", static: false, private: false, access: { has: obj => "usuario" in obj, get: obj => obj.usuario, set: (obj, value) => { obj.usuario = value; } }, metadata: _metadata }, _usuario_initializers, _usuario_extraInitializers);
            __esDecorate(null, null, _fecha_decorators, { kind: "field", name: "fecha", static: false, private: false, access: { has: obj => "fecha" in obj, get: obj => obj.fecha, set: (obj, value) => { obj.fecha = value; } }, metadata: _metadata }, _fecha_initializers, _fecha_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        id = __runInitializers(this, _id_initializers, void 0);
        accion = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _accion_initializers, void 0));
        valorAnterior = (__runInitializers(this, _accion_extraInitializers), __runInitializers(this, _valorAnterior_initializers, void 0));
        valorNuevo = (__runInitializers(this, _valorAnterior_extraInitializers), __runInitializers(this, _valorNuevo_initializers, void 0));
        usuario = (__runInitializers(this, _valorNuevo_extraInitializers), __runInitializers(this, _usuario_initializers, void 0));
        fecha = (__runInitializers(this, _usuario_extraInitializers), __runInitializers(this, _fecha_initializers, void 0));
        static fromEntity(change, timeZone) {
            return {
                id: change.id,
                accion: change.action,
                valorAnterior: change.previousValue,
                valorNuevo: change.newValue,
                usuario: change.changedBy?.email ?? null,
                fecha: toZonedIso(change.changedAt, timeZone),
            };
        }
        constructor() {
            __runInitializers(this, _fecha_extraInitializers);
        }
    };
})();
export { FeeRuleChangeResponseDto };
