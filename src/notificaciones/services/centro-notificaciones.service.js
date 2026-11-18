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
import { ForbiddenException, Injectable, NotFoundException, } from '@nestjs/common';
export const TAMANO_MAXIMO_PAGINA = 20;
const PAGINA_MAXIMA = 100_000;
/** Convierte lo que llegue a un entero dentro de [min, max]; si no es número usa `defecto`. */
function acotar(valor, defecto, min, max) {
    const n = Number(valor);
    if (valor === undefined || valor === null || !Number.isInteger(n)) {
        return defecto;
    }
    return Math.min(max, Math.max(min, n));
}
let CentroNotificacionesService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var CentroNotificacionesService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CentroNotificacionesService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        repo;
        constructor(repo) {
            this.repo = repo;
        }
        async listar(sesion, query) {
            const page = acotar(query.page, 1, 1, PAGINA_MAXIMA);
            const size = acotar(query.size, TAMANO_MAXIMO_PAGINA, 1, TAMANO_MAXIMO_PAGINA);
            const { total, items } = await this.repo.listar(sesion.id, (page - 1) * size, size);
            return { total, page, size, items };
        }
        async contarNoLeidas(sesion) {
            return { count: await this.repo.contarNoLeidas(sesion.id) };
        }
        /** Marcar o desmarcar. Repetir el mismo estado no cambia nada (no pisa la fecha original). */
        async cambiarLeida(sesion, id, leida) {
            const notificacion = await this.repo.buscarPropiedad(id);
            if (!notificacion) {
                throw new NotFoundException({
                    codigo: 'NOTIFICACION_INEXISTENTE',
                    mensaje: 'La notificación no existe',
                });
            }
            if (notificacion.residenteId !== sesion.id) {
                throw new ForbiddenException({
                    codigo: 'RECURSO_AJENO',
                    mensaje: 'La notificación no pertenece al usuario',
                });
            }
            if (notificacion.leida === leida) {
                return {
                    id: notificacion.id,
                    leida: notificacion.leida,
                    fechaLectura: notificacion.fechaLectura,
                };
            }
            return this.repo.actualizarLeida(id, leida);
        }
    };
    return CentroNotificacionesService = _classThis;
})();
export { CentroNotificacionesService };
