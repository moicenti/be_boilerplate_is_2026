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
import { BadRequestException, ForbiddenException, Injectable, } from '@nestjs/common';
import { esModuloValido, MODULOS_NOTIFICACION, } from '@Notificaciones/dto';
let PreferenciasService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var PreferenciasService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            PreferenciasService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        repo;
        constructor(repo) {
            this.repo = repo;
        }
        /** Siempre devuelve los 7 módulos del catálogo; los que no tienen fila vienen activos. */
        async obtener(sesion) {
            return this.completar(await this.repo.listar(sesion.id));
        }
        /** Guarda todo o nada. Devuelve la lista completa ya actualizada. */
        async guardar(sesion, cambios) {
            // Primero la propiedad: nunca se escriben preferencias de otro residente.
            if (cambios.some((c) => c.residenteId !== undefined && c.residenteId !== sesion.id)) {
                throw new ForbiddenException({
                    codigo: 'RECURSO_AJENO',
                    mensaje: 'No se pueden modificar las preferencias de otro residente',
                });
            }
            const invalido = cambios.find((c) => !esModuloValido(c.modulo));
            if (invalido) {
                throw new BadRequestException({
                    codigo: 'MODULO_INVALIDO',
                    mensaje: `El módulo '${invalido.modulo}' no existe en el catálogo`,
                });
            }
            // Si un módulo viene repetido, vale el último.
            const porModulo = new Map();
            for (const c of cambios)
                porModulo.set(c.modulo, c.activo);
            const filas = await this.repo.guardar(sesion.id, [...porModulo].map(([modulo, activo]) => ({ modulo, activo })));
            return this.completar(filas);
        }
        completar(filas) {
            const guardadas = new Map(filas.map((f) => [f.moduloOrigen, f.activo]));
            return MODULOS_NOTIFICACION.map((modulo) => ({
                modulo,
                activo: guardadas.get(modulo) ?? true,
            }));
        }
    };
    return PreferenciasService = _classThis;
})();
export { PreferenciasService };
