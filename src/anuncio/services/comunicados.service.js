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
import { Injectable, Logger, NotFoundException, ForbiddenException, } from '@nestjs/common';
let ComunicadosService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ComunicadosService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ComunicadosService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        comunicadosRepository;
        logger = new Logger(ComunicadosService.name);
        constructor(comunicadosRepository) {
            this.comunicadosRepository = comunicadosRepository;
        }
        async publicarComunicado(emisorId, dto, archivos) {
            const adjuntosData = (archivos || []).map((file) => ({
                nombreOriginal: file.originalname,
                rutaArchivo: `/uploads/anuncios/${file.filename}`,
                tipoMime: file.mimetype,
                tamanoBytes: file.size,
            }));
            const nuevoComunicado = await this.comunicadosRepository.crearComunicado(emisorId, dto, adjuntosData);
            this.logger.log(`Evento emitido al Modulo 9 para comunicado ID ${nuevoComunicado.id} con prioridad ${dto.prioridad} y audiencia ${dto.audienciaTipo}`);
            return nuevoComunicado;
        }
        async verificarAccesoAudiencia(comunicado, user) {
            if (user.role === 'ADMINISTRADOR')
                return;
            if (comunicado.audienciaTipo === 'TODO_EL_CONDOMINIO')
                return;
            const ubicacion = await this.comunicadosRepository.obtenerUbicacionUsuario(user.id, user.unitId);
            if (comunicado.audienciaTipo === 'POR_TORRE') {
                const coincideTorre = ubicacion?.tower &&
                    comunicado.audienciaTarget &&
                    ubicacion.tower.trim().toLowerCase() === comunicado.audienciaTarget.trim().toLowerCase();
                if (!coincideTorre) {
                    throw new ForbiddenException('Este comunicado está dirigido a otra torre.');
                }
                return;
            }
            if (comunicado.audienciaTipo === 'POR_SECCION') {
                const target = comunicado.audienciaTarget?.trim().toLowerCase();
                const coincideSeccion = ubicacion &&
                    target &&
                    (ubicacion.description.trim().toLowerCase() === target ||
                        ubicacion.code.trim().toLowerCase() === target);
                if (!coincideSeccion) {
                    throw new ForbiddenException('Este comunicado está dirigido a otra sección.');
                }
            }
        }
        async obtenerMuro(user) {
            const ubicacion = await this.comunicadosRepository.obtenerUbicacionUsuario(user.id, user.unitId);
            const lista = await this.comunicadosRepository.obtenerMuroResidente(user.id, ubicacion);
            return lista.map(({ lecturas, ...comunicado }) => ({
                ...comunicado,
                leido: lecturas.length > 0,
                fechaLectura: lecturas[0]?.fechaLectura ?? null,
            }));
        }
        async obtenerDetalle(id, user) {
            const comunicado = await this.comunicadosRepository.obtenerPorId(id, user.id);
            if (!comunicado) {
                throw new NotFoundException('El comunicado solicitado no existe.');
            }
            await this.verificarAccesoAudiencia(comunicado, user);
            const { lecturas, ...datos } = comunicado;
            return {
                ...datos,
                leido: lecturas.length > 0,
                fechaLectura: lecturas[0]?.fechaLectura ?? null,
            };
        }
        async marcarComoLeido(id, user) {
            const comunicado = await this.comunicadosRepository.obtenerPorId(id, user.id);
            if (!comunicado) {
                throw new NotFoundException('El comunicado solicitado no existe.');
            }
            await this.verificarAccesoAudiencia(comunicado, user);
            const lectura = await this.comunicadosRepository.registrarLectura(id, user.id);
            return {
                comunicadoId: id,
                leido: true,
                fechaLectura: lectura.fechaLectura,
            };
        }
    };
    return ComunicadosService = _classThis;
})();
export { ComunicadosService };
