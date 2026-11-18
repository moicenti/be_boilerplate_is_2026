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
let ComunicadosRepository = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ComunicadosRepository = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ComunicadosRepository = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        constructor(prisma) {
            this.prisma = prisma;
        }
        async crearComunicado(emisorId, dto, adjuntos) {
            return this.prisma.$transaction(async (tx) => {
                return tx.comunicadoOficial.create({
                    data: {
                        titulo: dto.titulo.trim(),
                        cuerpo: dto.cuerpo.trim(),
                        categoria: dto.categoria,
                        prioridad: dto.prioridad,
                        audienciaTipo: dto.audienciaTipo,
                        audienciaTarget: dto.audienciaTarget?.trim() || null,
                        emisorId,
                        adjuntos: {
                            create: adjuntos.map((file) => ({
                                nombreOriginal: file.nombreOriginal,
                                rutaArchivo: file.rutaArchivo,
                                tipoMime: file.tipoMime,
                                tamanoBytes: file.tamanoBytes,
                            })),
                        },
                    },
                    include: {
                        adjuntos: true,
                    },
                });
            });
        }
        async obtenerUbicacionUsuario(userId, unitId) {
            if (unitId) {
                return this.prisma.unit.findUnique({
                    where: { id: unitId },
                    select: { tower: true, code: true, description: true },
                });
            }
            const usuario = await this.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    unit: {
                        select: { tower: true, code: true, description: true },
                    },
                },
            });
            return usuario?.unit ?? null;
        }
        async obtenerMuroResidente(residenteId, ubicacion) {
            const condicionesAudiencia = [
                { audienciaTipo: 'TODO_EL_CONDOMINIO' },
            ];
            if (ubicacion?.tower) {
                condicionesAudiencia.push({
                    audienciaTipo: 'POR_TORRE',
                    audienciaTarget: { equals: ubicacion.tower.trim(), mode: 'insensitive' },
                });
            }
            if (ubicacion?.description || ubicacion?.code) {
                condicionesAudiencia.push({
                    audienciaTipo: 'POR_SECCION',
                    OR: [
                        { audienciaTarget: { equals: ubicacion.description.trim(), mode: 'insensitive' } },
                        { audienciaTarget: { equals: ubicacion.code.trim(), mode: 'insensitive' } },
                    ],
                });
            }
            return this.prisma.comunicadoOficial.findMany({
                where: {
                    OR: condicionesAudiencia,
                },
                orderBy: {
                    fechaPublicacion: 'desc',
                },
                include: {
                    adjuntos: true,
                    lecturas: {
                        where: { residenteId },
                        select: { fechaLectura: true },
                    },
                },
            });
        }
        async obtenerPorId(id, residenteId) {
            return this.prisma.comunicadoOficial.findUnique({
                where: { id },
                include: {
                    adjuntos: true,
                    lecturas: {
                        where: { residenteId },
                        select: { fechaLectura: true },
                    },
                },
            });
        }
        async registrarLectura(comunicadoId, residenteId) {
            return this.prisma.lecturaComunicado.upsert({
                where: {
                    comunicadoId_residenteId: {
                        comunicadoId,
                        residenteId,
                    },
                },
                update: {},
                create: {
                    comunicadoId,
                    residenteId,
                },
            });
        }
    };
    return ComunicadosRepository = _classThis;
})();
export { ComunicadosRepository };
