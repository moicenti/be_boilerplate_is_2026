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
import { BadRequestException, Controller, Get, Patch, Post, UseInterceptors, } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Role } from '@PrismaClient';
import { Roles } from '@Auth/decorators';
let IncidenciasController = (() => {
    let _classDecorators = [Controller('incidencias')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _create_decorators;
    let _findAll_decorators;
    let _adminList_decorators;
    let _responsables_decorators;
    let _findOne_decorators;
    let _assign_decorators;
    let _resolve_decorators;
    let _confirm_decorators;
    let _reject_decorators;
    var IncidenciasController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _create_decorators = [Post(), UseInterceptors(FilesInterceptor('photos', 3, {
                    storage: diskStorage({
                        destination: './uploads',
                        filename: (req, file, cb) => {
                            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                            const ext = extname(file.originalname);
                            cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
                        },
                    }),
                    fileFilter: (req, file, cb) => {
                        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
                            return cb(new BadRequestException('Solo se permiten archivos JPG o PNG'), false);
                        }
                        cb(null, true);
                    },
                    limits: { fileSize: 5 * 1024 * 1024 },
                }))];
            _findAll_decorators = [Get()];
            _adminList_decorators = [Get('admin/list'), Roles(Role.ADMINISTRADOR)];
            _responsables_decorators = [Get('responsables'), Roles(Role.ADMINISTRADOR)];
            _findOne_decorators = [Get(':id')];
            _assign_decorators = [Patch(':id/asignar'), Roles(Role.ADMINISTRADOR)];
            _resolve_decorators = [Patch(':id/resolver'), Roles(Role.ADMINISTRADOR, Role.MANTENIMIENTO)];
            _confirm_decorators = [Patch(':id/confirmar')];
            _reject_decorators = [Patch(':id/rechazar')];
            __esDecorate(this, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: obj => "findAll" in obj, get: obj => obj.findAll }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _adminList_decorators, { kind: "method", name: "adminList", static: false, private: false, access: { has: obj => "adminList" in obj, get: obj => obj.adminList }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _responsables_decorators, { kind: "method", name: "responsables", static: false, private: false, access: { has: obj => "responsables" in obj, get: obj => obj.responsables }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: obj => "findOne" in obj, get: obj => obj.findOne }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _assign_decorators, { kind: "method", name: "assign", static: false, private: false, access: { has: obj => "assign" in obj, get: obj => obj.assign }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _resolve_decorators, { kind: "method", name: "resolve", static: false, private: false, access: { has: obj => "resolve" in obj, get: obj => obj.resolve }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _confirm_decorators, { kind: "method", name: "confirm", static: false, private: false, access: { has: obj => "confirm" in obj, get: obj => obj.confirm }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _reject_decorators, { kind: "method", name: "reject", static: false, private: false, access: { has: obj => "reject" in obj, get: obj => obj.reject }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            IncidenciasController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        incidenciasService = __runInitializers(this, _instanceExtraInitializers);
        constructor(incidenciasService) {
            this.incidenciasService = incidenciasService;
        }
        async create(user, dto, files) {
            const photoUrls = files ? files.map((f) => `/uploads/${f.filename}`) : [];
            return this.incidenciasService.create(user, dto, photoUrls);
        }
        async findAll(user) {
            return this.incidenciasService.findAll(user.id);
        }
        async adminList(filters) {
            return this.incidenciasService.findAllForAdmin(filters);
        }
        async responsables() {
            return this.incidenciasService.findMaintenanceUsers();
        }
        async findOne(id, user) {
            return this.incidenciasService.findOne(id, user.id);
        }
        async assign(id, dto, user) {
            return this.incidenciasService.assignReport(id, dto, user);
        }
        async resolve(id, dto, user) {
            return this.incidenciasService.resolveReport(id, dto, user);
        }
        async confirm(id, user) {
            return this.incidenciasService.confirmResolution(id, user.id);
        }
        async reject(id, dto, user) {
            return this.incidenciasService.rejectResolution(id, user.id, dto.comment);
        }
    };
    return IncidenciasController = _classThis;
})();
export { IncidenciasController };
