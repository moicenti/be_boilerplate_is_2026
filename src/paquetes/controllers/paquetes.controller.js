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
import { Controller, Get, HttpCode, HttpStatus, Patch, Post, } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnprocessableEntityResponse, } from '@nestjs/swagger';
import { Roles } from '@Auth/decorators';
import { MyPackagePageResponseDto, PackagePageResponseDto, PackageResponseDto, } from '@Paquetes/dto';
import { Role } from '@PrismaClient';
let PaquetesController = (() => {
    let _classDecorators = [ApiTags('paquetes'), ApiBearerAuth(), Controller('paquetes')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _list_decorators;
    let _listMine_decorators;
    let _findOne_decorators;
    let _register_decorators;
    let _deliver_decorators;
    var PaquetesController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _list_decorators = [Get(), Roles(Role.SEGURIDAD), ApiOperation({ summary: 'Lista los paquetes para la caseta de seguridad' }), ApiOkResponse({ type: PackagePageResponseDto }), ApiBadRequestResponse({ description: 'Filtros inválidos.' }), ApiForbiddenResponse({ description: 'Solo el personal de seguridad.' })];
            _listMine_decorators = [Get('mis-paquetes'), Roles(Role.RESIDENTE), ApiOperation({ summary: 'Historial de paquetes de la unidad del residente' }), ApiOkResponse({ type: MyPackagePageResponseDto }), ApiBadRequestResponse({ description: 'Filtros inválidos.' }), ApiForbiddenResponse({ description: 'Solo residentes.' })];
            _findOne_decorators = [Get(':id'), Roles(Role.SEGURIDAD, Role.ADMINISTRADOR, Role.RESIDENTE), ApiOperation({
                    summary: 'Detalle de un paquete',
                    description: 'Un residente solo accede a los paquetes de su unidad y ve el código de retiro mientras el paquete está pendiente.',
                }), ApiOkResponse({ type: PackageResponseDto }), ApiNotFoundResponse({
                    description: 'El paquete no existe o es de otra unidad.',
                }), ApiForbiddenResponse({ description: 'El rol no tiene acceso.' })];
            _register_decorators = [Post(), HttpCode(HttpStatus.CREATED), Roles(Role.SEGURIDAD), ApiOperation({ summary: 'Registra la llegada de un paquete a la caseta' }), ApiCreatedResponse({ type: PackageResponseDto }), ApiBadRequestResponse({ description: 'Datos incompletos o inválidos.' }), ApiNotFoundResponse({ description: 'La unidad no existe.' }), ApiForbiddenResponse({ description: 'Solo el personal de seguridad.' })];
            _deliver_decorators = [Patch(':id/entrega'), Roles(Role.SEGURIDAD), ApiOperation({
                    summary: 'Registra la entrega de un paquete con su código de retiro',
                }), ApiOkResponse({ type: PackageResponseDto }), ApiBadRequestResponse({ description: 'Datos incompletos o inválidos.' }), ApiNotFoundResponse({ description: 'El paquete no existe.' }), ApiConflictResponse({ description: 'El paquete ya fue entregado.' }), ApiUnprocessableEntityResponse({
                    description: 'El código de retiro no coincide.',
                }), ApiForbiddenResponse({ description: 'Solo el personal de seguridad.' })];
            __esDecorate(this, null, _list_decorators, { kind: "method", name: "list", static: false, private: false, access: { has: obj => "list" in obj, get: obj => obj.list }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _listMine_decorators, { kind: "method", name: "listMine", static: false, private: false, access: { has: obj => "listMine" in obj, get: obj => obj.listMine }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: obj => "findOne" in obj, get: obj => obj.findOne }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _register_decorators, { kind: "method", name: "register", static: false, private: false, access: { has: obj => "register" in obj, get: obj => obj.register }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _deliver_decorators, { kind: "method", name: "deliver", static: false, private: false, access: { has: obj => "deliver" in obj, get: obj => obj.deliver }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            PaquetesController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        paquetesService = __runInitializers(this, _instanceExtraInitializers);
        constructor(paquetesService) {
            this.paquetesService = paquetesService;
        }
        async list(query) {
            const page = await this.paquetesService.list(query);
            return {
                ...page,
                items: page.items.map((pkg) => PackageResponseDto.fromEntity(pkg)),
            };
        }
        async listMine(query, user) {
            const page = await this.paquetesService.listForResident(user, query);
            return {
                ...page,
                items: page.items.map((pkg) => PackageResponseDto.fromEntity(pkg)),
            };
        }
        async findOne(id, user) {
            const pkg = await this.paquetesService.findOne(id, user);
            return PackageResponseDto.fromEntity(pkg, {
                includePickupCode: this.paquetesService.canSeePickupCode(pkg, user),
            });
        }
        async register(dto, user) {
            const pkg = await this.paquetesService.register(dto, user);
            return PackageResponseDto.fromEntity(pkg);
        }
        async deliver(id, dto, user) {
            const pkg = await this.paquetesService.deliver(id, dto, user);
            return PackageResponseDto.fromEntity(pkg);
        }
    };
    return PaquetesController = _classThis;
})();
export { PaquetesController };
