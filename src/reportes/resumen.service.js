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
import { Injectable, Logger } from '@nestjs/common';
let ResumenService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ResumenService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ResumenService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        logger = new Logger(ResumenService.name);
        constructor(prisma) {
            this.prisma = prisma;
        }
        async obtenerResumen(filtros) {
            const [morosidad, ocupacion, incidencias, participacion] = await Promise.allSettled([
                this.calcularMorosidad(filtros),
                this.calcularOcupacion(filtros),
                this.calcularIncidencias(filtros),
                this.calcularParticipacion(filtros),
            ]);
            return {
                morosidad: morosidad.status === 'fulfilled'
                    ? morosidad.value
                    : { estado: 'no_disponible' },
                ocupacion: ocupacion.status === 'fulfilled'
                    ? ocupacion.value
                    : { estado: 'no_disponible' },
                incidencias: incidencias.status === 'fulfilled'
                    ? incidencias.value
                    : { estado: 'no_disponible' },
                participacion: participacion.status === 'fulfilled'
                    ? participacion.value
                    : { estado: 'no_disponible' },
            };
        }
        async calcularMorosidad(_filtros) {
            // El modelo 'Cuota' no existe en tu schema.prisma actual.
            // H26 exige: si falla o no existe, devolver "no_disponible" sin romper los demás.
            this.logger.warn('Indicador Morosidad: no_disponible (modelo Cuota no implementado aún)');
            return { estado: 'no_disponible' };
        }
        async calcularOcupacion(filtros) {
            try {
                const reservas = await this.prisma.reservation.findMany({
                    where: {
                        status: 'CONFIRMADA',
                        startsAt: { gte: new Date(filtros.desde) },
                        endsAt: { lte: new Date(filtros.hasta) },
                    },
                    select: { startsAt: true, endsAt: true },
                });
                let horasReservadas = 0;
                reservas.forEach((r) => {
                    horasReservadas +=
                        (r.endsAt.getTime() - r.startsAt.getTime()) / (1000 * 60 * 60);
                });
                const horasDisponibles = 100; // Simplificación para H26
                const porcentaje = horasDisponibles > 0 ? (horasReservadas / horasDisponibles) * 100 : 0;
                return { porcentaje: parseFloat(porcentaje.toFixed(2)) };
            }
            catch (error) {
                this.logger.error('Error calculando ocupación', error);
                return { estado: 'no_disponible' };
            }
        }
        async calcularIncidencias(filtros) {
            try {
                const cantidad = await this.prisma.report.count({
                    where: {
                        status: { in: ['Abierto', 'En proceso', 'ABIERTO', 'EN_PROCESO'] },
                        createdAt: {
                            gte: new Date(filtros.desde),
                            lte: new Date(filtros.hasta),
                        },
                    },
                });
                return { cantidad };
            }
            catch (error) {
                this.logger.error('Error calculando incidencias', error);
                return { estado: 'no_disponible' };
            }
        }
        async calcularParticipacion(_filtros) {
            // El modelo de Votaciones no existe en tu schema.prisma actual.
            this.logger.warn('Indicador Participación: no_disponible (modelo Votación no implementado aún)');
            return { estado: 'no_disponible' };
        }
    };
    return ResumenService = _classThis;
})();
export { ResumenService };
