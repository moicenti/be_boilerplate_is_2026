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
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { esFechaValida, hoyEnElSalvador, primerDiaDelMes, } from './filtros-resumen.js';
import { FuenteNoDisponibleError, } from './indicadores/index.js';
const NO_DISPONIBLE = { estado: 'no_disponible' };
const filtrosInvalidos = (mensaje) => new BadRequestException({ codigo: 'FILTROS_INVALIDOS', mensaje });
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
        secciones;
        morosidad;
        ocupacion;
        incidencias;
        participacion;
        logger = new Logger(ResumenService.name);
        constructor(secciones, morosidad, ocupacion, incidencias, participacion) {
            this.secciones = secciones;
            this.morosidad = morosidad;
            this.ocupacion = ocupacion;
            this.incidencias = incidencias;
            this.participacion = participacion;
        }
        /** Los 4 indicadores en paralelo. Si uno falla, solo ese sale como no_disponible. */
        async obtener(query) {
            const filtros = await this.validarFiltros(query);
            const [morosidad, ocupacion, incidencias, participacion] = await Promise.all([
                this.aislar('morosidad', () => this.morosidad.calcular(filtros)),
                this.aislar('ocupacion', () => this.ocupacion.calcular(filtros)),
                this.aislar('incidencias', () => this.incidencias.calcular(filtros)),
                this.aislar('participacion', () => this.participacion.calcular(filtros)),
            ]);
            return { morosidad, ocupacion, incidencias, participacion };
        }
        /**
         * Sin fechas usa el mes en curso: desde = día 1, hasta = hoy (hora de El Salvador).
         * Esos valores por defecto no vienen en el diseño; hay que confirmarlos con el equipo.
         */
        async validarFiltros(query) {
            const hoy = hoyEnElSalvador();
            const desde = this.fecha('desde', query.desde, primerDiaDelMes(hoy));
            const hasta = this.fecha('hasta', query.hasta, hoy);
            if (desde > hasta) {
                throw filtrosInvalidos("La fecha 'desde' no puede ser mayor que 'hasta'");
            }
            const seccion = this.seccion(query.seccion);
            if (seccion !== undefined && !(await this.secciones.existe(seccion))) {
                throw filtrosInvalidos(`La sección '${seccion}' no existe`);
            }
            return seccion === undefined ? { desde, hasta } : { desde, hasta, seccion };
        }
        fecha(nombre, valor, porDefecto) {
            if (valor === undefined)
                return porDefecto;
            if (typeof valor !== 'string' || !esFechaValida(valor)) {
                throw filtrosInvalidos(`'${nombre}' debe ser una fecha válida con formato AAAA-MM-DD`);
            }
            return valor;
        }
        seccion(valor) {
            if (valor === undefined)
                return undefined;
            if (typeof valor !== 'string' || valor.trim() === '') {
                throw filtrosInvalidos("'seccion' no puede estar vacía");
            }
            return valor.trim();
        }
        /** try/catch propio de cada indicador: el error se registra y no llega al cliente. */
        async aislar(nombre, calcular) {
            try {
                return await calcular();
            }
            catch (error) {
                if (error instanceof FuenteNoDisponibleError) {
                    this.logger.warn(error.message);
                }
                else {
                    this.logger.error(`Falló el indicador '${nombre}': ${error instanceof Error ? error.message : String(error)}`);
                }
                return NO_DISPONIBLE;
            }
        }
    };
    return ResumenService = _classThis;
})();
export { ResumenService };
