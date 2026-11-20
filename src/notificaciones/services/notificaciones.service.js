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
import { BadRequestException, ForbiddenException, Injectable, NotFoundException, } from '@nestjs/common';
const ROL_ADMINISTRADOR = 'ADMINISTRADOR'; // valor del enum Role de H13
const TIPOS_DESTINATARIO = ['RESIDENTE', 'UNIDAD', 'GRUPO'];
let NotificacionesService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var NotificacionesService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            NotificacionesService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        destinatarios;
        notificaciones;
        envio;
        constructor(destinatarios, notificaciones, envio) {
            this.destinatarios = destinatarios;
            this.notificaciones = notificaciones;
            this.envio = envio;
        }
        /**
         * Convierte un aviso en una notificación por residente.
         * `emisor` es quien lo emite (lo pasa el módulo que llama, desde la sesión).
         */
        async emitir(dto, emisor) {
            this.validar(dto);
            const forzada = dto.forzada === true;
            if (forzada && emisor?.rol !== ROL_ADMINISTRADOR) {
                throw new ForbiddenException({
                    codigo: 'ROL_NO_PERMITIDO',
                    mensaje: 'Solo un administrador puede emitir notificaciones forzadas',
                });
            }
            const residentes = await this.destinatarios.resolver(dto.destinatario);
            if (residentes === null) {
                throw new NotFoundException({
                    codigo: 'DESTINATARIO_INEXISTENTE',
                    mensaje: 'El destinatario no existe',
                });
            }
            // Forzada ignora las preferencias. Sin registro de preferencia se asume activo.
            const apagados = forzada
                ? new Set()
                : await this.destinatarios.desactivados(residentes.map((r) => r.id), dto.moduloOrigen);
            const destinos = residentes
                .filter((r) => !apagados.has(r.id))
                .map((r) => ({ residenteId: r.id, unidadId: r.unidadId }));
            const loteId = await this.notificaciones.crearLote({ moduloOrigen: dto.moduloOrigen, emitidoPorId: emisor?.id ?? null }, {
                tipo: dto.tipo,
                titulo: dto.titulo?.trim() || dto.tipo,
                mensaje: dto.mensaje,
                moduloOrigen: dto.moduloOrigen,
                enlaceAccion: dto.enlaceAccion ?? null,
                forzada,
            }, destinos);
            // Primer intento inmediato. Si falla, lo retoma la tarea programada.
            for (const n of await this.notificaciones.porLote(loteId)) {
                await this.envio.procesar(n);
            }
            return {
                loteId,
                creadas: destinos.length,
                omitidas: residentes.length - destinos.length,
            };
        }
        validar(dto) {
            const invalida = (mensaje) => new BadRequestException({ codigo: 'SOLICITUD_INVALIDA', mensaje });
            const d = dto?.destinatario;
            if (!d || !d.tipo || d.id === undefined || d.id === null || d.id === '') {
                throw invalida('El destinatario es obligatorio');
            }
            if (!TIPOS_DESTINATARIO.includes(d.tipo)) {
                throw invalida('El tipo de destinatario debe ser RESIDENTE, UNIDAD o GRUPO');
            }
            if (!dto.tipo?.trim())
                throw invalida('El tipo es obligatorio');
            if (!dto.mensaje?.trim())
                throw invalida('El mensaje es obligatorio');
            if (!dto.moduloOrigen?.trim()) {
                throw invalida('El módulo de origen es obligatorio');
            }
        }
    };
    return NotificacionesService = _classThis;
})();
export { NotificacionesService };
