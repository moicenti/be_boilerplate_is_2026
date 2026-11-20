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
import { IsEnum, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { CategoriaComunicado, PrioridadComunicado, AudienciaTipo } from '@PrismaClient';
let CrearComunicadoDto = (() => {
    let _titulo_decorators;
    let _titulo_initializers = [];
    let _titulo_extraInitializers = [];
    let _cuerpo_decorators;
    let _cuerpo_initializers = [];
    let _cuerpo_extraInitializers = [];
    let _categoria_decorators;
    let _categoria_initializers = [];
    let _categoria_extraInitializers = [];
    let _prioridad_decorators;
    let _prioridad_initializers = [];
    let _prioridad_extraInitializers = [];
    let _audienciaTipo_decorators;
    let _audienciaTipo_initializers = [];
    let _audienciaTipo_extraInitializers = [];
    let _audienciaTarget_decorators;
    let _audienciaTarget_initializers = [];
    let _audienciaTarget_extraInitializers = [];
    return class CrearComunicadoDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _titulo_decorators = [IsString({ message: 'El título debe ser un texto' }), IsNotEmpty({ message: 'El título es obligatorio' }), Length(10, 120, { message: 'El título debe contener entre 10 y 120 caracteres' })];
            _cuerpo_decorators = [IsString({ message: 'El cuerpo debe ser un texto' }), IsNotEmpty({ message: 'El cuerpo del comunicado es obligatorio' }), Length(30, 2000, { message: 'El cuerpo debe contener entre 30 y 2000 caracteres' })];
            _categoria_decorators = [IsEnum(CategoriaComunicado, {
                    message: 'La categoría debe ser MANTENIMIENTO, SEGURIDAD o ADMINISTRATIVO',
                })];
            _prioridad_decorators = [IsEnum(PrioridadComunicado, {
                    message: 'La prioridad debe ser INFORMATIVO, IMPORTANTE o URGENTE',
                })];
            _audienciaTipo_decorators = [IsEnum(AudienciaTipo, {
                    message: 'La audiencia debe ser TODO_EL_CONDOMINIO, POR_TORRE o POR_SECCION',
                })];
            _audienciaTarget_decorators = [IsOptional(), IsString()];
            __esDecorate(null, null, _titulo_decorators, { kind: "field", name: "titulo", static: false, private: false, access: { has: obj => "titulo" in obj, get: obj => obj.titulo, set: (obj, value) => { obj.titulo = value; } }, metadata: _metadata }, _titulo_initializers, _titulo_extraInitializers);
            __esDecorate(null, null, _cuerpo_decorators, { kind: "field", name: "cuerpo", static: false, private: false, access: { has: obj => "cuerpo" in obj, get: obj => obj.cuerpo, set: (obj, value) => { obj.cuerpo = value; } }, metadata: _metadata }, _cuerpo_initializers, _cuerpo_extraInitializers);
            __esDecorate(null, null, _categoria_decorators, { kind: "field", name: "categoria", static: false, private: false, access: { has: obj => "categoria" in obj, get: obj => obj.categoria, set: (obj, value) => { obj.categoria = value; } }, metadata: _metadata }, _categoria_initializers, _categoria_extraInitializers);
            __esDecorate(null, null, _prioridad_decorators, { kind: "field", name: "prioridad", static: false, private: false, access: { has: obj => "prioridad" in obj, get: obj => obj.prioridad, set: (obj, value) => { obj.prioridad = value; } }, metadata: _metadata }, _prioridad_initializers, _prioridad_extraInitializers);
            __esDecorate(null, null, _audienciaTipo_decorators, { kind: "field", name: "audienciaTipo", static: false, private: false, access: { has: obj => "audienciaTipo" in obj, get: obj => obj.audienciaTipo, set: (obj, value) => { obj.audienciaTipo = value; } }, metadata: _metadata }, _audienciaTipo_initializers, _audienciaTipo_extraInitializers);
            __esDecorate(null, null, _audienciaTarget_decorators, { kind: "field", name: "audienciaTarget", static: false, private: false, access: { has: obj => "audienciaTarget" in obj, get: obj => obj.audienciaTarget, set: (obj, value) => { obj.audienciaTarget = value; } }, metadata: _metadata }, _audienciaTarget_initializers, _audienciaTarget_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        titulo = __runInitializers(this, _titulo_initializers, void 0);
        cuerpo = (__runInitializers(this, _titulo_extraInitializers), __runInitializers(this, _cuerpo_initializers, void 0));
        categoria = (__runInitializers(this, _cuerpo_extraInitializers), __runInitializers(this, _categoria_initializers, void 0));
        prioridad = (__runInitializers(this, _categoria_extraInitializers), __runInitializers(this, _prioridad_initializers, void 0));
        audienciaTipo = (__runInitializers(this, _prioridad_extraInitializers), __runInitializers(this, _audienciaTipo_initializers, void 0));
        audienciaTarget = (__runInitializers(this, _audienciaTipo_extraInitializers), __runInitializers(this, _audienciaTarget_initializers, void 0));
        constructor() {
            __runInitializers(this, _audienciaTarget_extraInitializers);
        }
    };
})();
export { CrearComunicadoDto };
