var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
import { Controller, Get, Post, Put, Patch, Delete, UseInterceptors, BadRequestException, MethodNotAllowedException, HttpCode, HttpStatus, ForbiddenException, } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'node:path';
import { randomUUID } from 'node:crypto';
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
let ComunicadosController = (() => {
    let _classDecorators = [Controller('anuncios')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _obtenerMuro_decorators;
    let _obtenerDetalle_decorators;
    let _marcarComoLeido_decorators;
    let _crear_decorators;
    let _bloquearEdicion_decorators;
    var ComunicadosController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _obtenerMuro_decorators = [Get('muro')];
            _obtenerDetalle_decorators = [Get(':id')];
            _marcarComoLeido_decorators = [Post(':id/leer'), HttpCode(HttpStatus.OK)];
            _crear_decorators = [Post(), HttpCode(HttpStatus.CREATED), UseInterceptors(FilesInterceptor('archivos', 2, {
                    limits: { fileSize: MAX_FILE_SIZE, files: 2 },
                    fileFilter: (_req, file, callback) => {
                        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
                            return callback(new BadRequestException(`Tipo de archivo no permitido: ${file.mimetype}. Solo se admite PDF, JPG y PNG.`), false);
                        }
                        callback(null, true);
                    },
                    storage: diskStorage({
                        destination: './public/uploads/anuncios',
                        filename: (_req, file, cb) => {
                            const extension = extname(file.originalname);
                            cb(null, `${randomUUID()}${extension}`);
                        },
                    }),
                }))];
            _bloquearEdicion_decorators = [Put(':id'), Patch(':id'), Delete(':id')];
            __esDecorate(this, null, _obtenerMuro_decorators, { kind: "method", name: "obtenerMuro", static: false, private: false, access: { has: obj => "obtenerMuro" in obj, get: obj => obj.obtenerMuro }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _obtenerDetalle_decorators, { kind: "method", name: "obtenerDetalle", static: false, private: false, access: { has: obj => "obtenerDetalle" in obj, get: obj => obj.obtenerDetalle }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _marcarComoLeido_decorators, { kind: "method", name: "marcarComoLeido", static: false, private: false, access: { has: obj => "marcarComoLeido" in obj, get: obj => obj.marcarComoLeido }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _crear_decorators, { kind: "method", name: "crear", static: false, private: false, access: { has: obj => "crear" in obj, get: obj => obj.crear }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _bloquearEdicion_decorators, { kind: "method", name: "bloquearEdicion", static: false, private: false, access: { has: obj => "bloquearEdicion" in obj, get: obj => obj.bloquearEdicion }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ComunicadosController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        comunicadosService = __runInitializers(this, _instanceExtraInitializers);
        constructor(comunicadosService) {
            this.comunicadosService = comunicadosService;
        }
        // H20 (BE-20.1): Muro segmentado por torre/sección del residente
        async obtenerMuro(user) {
            return this.comunicadosService.obtenerMuro(user);
        }
        // H20 (Criterio 4): Consulta directa con validación 403 si es de torre/sección ajena
        async obtenerDetalle(id, user) {
            return this.comunicadosService.obtenerDetalle(id, user);
        }
        // H20 (BE-20.2): Registrar acuse de recibo
        async marcarComoLeido(id, user) {
            return this.comunicadosService.marcarComoLeido(id, user);
        }
        // H19 (BE-19.1): Publicar comunicado oficial
        async crear(user, dto, files) {
            if (user.role !== 'ADMINISTRADOR') {
                throw new ForbiddenException('Solo el administrador puede publicar comunicados.');
            }
            if (files && files.length > 2) {
                throw new BadRequestException('Se permite adjuntar un máximo de 2 archivos.');
            }
            if (files) {
                for (const f of files) {
                    if (f.size > MAX_FILE_SIZE) {
                        throw new BadRequestException(`El archivo ${f.originalname} excede el límite de 5 MB.`);
                    }
                }
            }
            return this.comunicadosService.publicarComunicado(user.id, dto, files || []);
        }
        // H19 (Criterio 4): Inmutabilidad oficial
        bloquearEdicion() {
            throw new MethodNotAllowedException('Los comunicados publicados son inmutables para preservar la integridad del historial oficial.');
        }
    };
    return ComunicadosController = _classThis;
})();
export { ComunicadosController };
