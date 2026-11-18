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
import { Injectable } from '@nestjs/common';
const CAMPOS_ITEM = {
    id: true,
    titulo: true,
    mensaje: true,
    moduloOrigen: true,
    fechaCreacion: true,
    leida: true,
    enlaceAccion: true,
};
/** Acceso a datos del centro de notificaciones. Todas las consultas filtran por residente. */
let CentroNotificacionesRepository = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var CentroNotificacionesRepository = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CentroNotificacionesRepository = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        constructor(prisma) {
            this.prisma = prisma;
        }
        /** De la más reciente a la más antigua. `id` desempata para que la paginación sea estable. */
        async listar(residenteId, skip, take) {
            const [total, items] = await this.prisma.$transaction([
                this.prisma.notificacion.count({ where: { residenteId } }),
                this.prisma.notificacion.findMany({
                    where: { residenteId },
                    orderBy: [{ fechaCreacion: 'desc' }, { id: 'desc' }],
                    skip,
                    take,
                    select: CAMPOS_ITEM,
                }),
            ]);
            return { total, items };
        }
        contarNoLeidas(residenteId) {
            return this.prisma.notificacion.count({
                where: { residenteId, leida: false },
            });
        }
        /** Solo lo necesario para decidir si existe, de quién es y si hay algo que cambiar. */
        buscarPropiedad(id) {
            return this.prisma.notificacion.findUnique({
                where: { id },
                select: { id: true, residenteId: true, leida: true, fechaLectura: true },
            });
        }
        /** Marcar guarda la hora actual; desmarcar la deja en nulo. */
        actualizarLeida(id, leida) {
            return this.prisma.notificacion.update({
                where: { id },
                data: { leida, fechaLectura: leida ? new Date() : null },
                select: { id: true, leida: true, fechaLectura: true },
            });
        }
    };
    return CentroNotificacionesRepository = _classThis;
})();
export { CentroNotificacionesRepository };
