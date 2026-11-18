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
import { Controller, Get, HttpCode, HttpStatus, Post, Put, } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags, } from '@nestjs/swagger';
import { Roles } from '@Auth/decorators';
import { AssemblyPageResponseDto, AssemblyResponseDto, AssemblySummaryDto, AudienceResponseDto, } from '@Asambleas/dto';
import { Role } from '@PrismaClient';
let AsambleasController = (() => {
    let _classDecorators = [ApiTags('asambleas'), ApiBearerAuth(), Controller('asambleas')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _list_decorators;
    let _audience_decorators;
    let _findOne_decorators;
    let _create_decorators;
    let _updateDraft_decorators;
    let _publish_decorators;
    var AsambleasController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _list_decorators = [Get(), ApiOperation({
                    summary: 'Lista las asambleas',
                    description: 'Administración ve también los borradores; el resto de los roles solo las publicadas.',
                }), ApiOkResponse({ type: AssemblyPageResponseDto }), ApiBadRequestResponse({ description: 'Filtros inválidos.' })];
            _audience_decorators = [Get('audiencia'), Roles(Role.ADMINISTRADOR), ApiOperation({
                    summary: 'Cantidad de residentes que recibirán la convocatoria',
                }), ApiOkResponse({ type: AudienceResponseDto }), ApiForbiddenResponse({ description: 'Solo administración.' })];
            _findOne_decorators = [Get(':id'), ApiOperation({
                    summary: 'Detalle de una asamblea con su agenda, propuestas y estados',
                }), ApiOkResponse({ type: AssemblyResponseDto }), ApiNotFoundResponse({
                    description: 'No existe o es un borrador y no eres administración.',
                })];
            _create_decorators = [Post(), HttpCode(HttpStatus.CREATED), Roles(Role.ADMINISTRADOR), ApiOperation({ summary: 'Crea una convocatoria en borrador' }), ApiCreatedResponse({ type: AssemblyResponseDto }), ApiBadRequestResponse({
                    description: 'Datos incompletos, fecha pasada, menos de dos opciones o cierre no posterior a la apertura.',
                }), ApiForbiddenResponse({ description: 'Solo administración.' })];
            _updateDraft_decorators = [Put(':id'), Roles(Role.ADMINISTRADOR), ApiOperation({ summary: 'Reemplaza el contenido de un borrador' }), ApiOkResponse({ type: AssemblyResponseDto }), ApiBadRequestResponse({ description: 'Datos inválidos.' }), ApiNotFoundResponse({ description: 'La asamblea no existe.' }), ApiConflictResponse({ description: 'La convocatoria ya fue publicada.' }), ApiForbiddenResponse({ description: 'Solo administración.' })];
            _publish_decorators = [Post(':id/publicacion'), HttpCode(HttpStatus.OK), Roles(Role.ADMINISTRADOR), ApiOperation({
                    summary: 'Publica la convocatoria y avisa a los residentes de todas las unidades',
                }), ApiOkResponse({ type: AssemblyResponseDto }), ApiBadRequestResponse({
                    description: 'La reunión o alguna apertura ya pasó.',
                }), ApiNotFoundResponse({ description: 'La asamblea no existe.' }), ApiConflictResponse({ description: 'La convocatoria ya fue publicada.' }), ApiForbiddenResponse({ description: 'Solo administración.' })];
            __esDecorate(this, null, _list_decorators, { kind: "method", name: "list", static: false, private: false, access: { has: obj => "list" in obj, get: obj => obj.list }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _audience_decorators, { kind: "method", name: "audience", static: false, private: false, access: { has: obj => "audience" in obj, get: obj => obj.audience }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: obj => "findOne" in obj, get: obj => obj.findOne }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _updateDraft_decorators, { kind: "method", name: "updateDraft", static: false, private: false, access: { has: obj => "updateDraft" in obj, get: obj => obj.updateDraft }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _publish_decorators, { kind: "method", name: "publish", static: false, private: false, access: { has: obj => "publish" in obj, get: obj => obj.publish }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AsambleasController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        asambleasService = __runInitializers(this, _instanceExtraInitializers);
        constructor(asambleasService) {
            this.asambleasService = asambleasService;
        }
        async list(query, user) {
            const page = await this.asambleasService.list(query, user);
            const now = this.asambleasService.now();
            return {
                ...page,
                items: page.items.map((assembly) => AssemblySummaryDto.fromEntity(assembly, now)),
            };
        }
        async audience() {
            return { residents: await this.asambleasService.audience() };
        }
        async findOne(id, user) {
            const assembly = await this.asambleasService.findOne(id, user);
            return AssemblyResponseDto.fromEntity(assembly, this.asambleasService.now());
        }
        async create(dto, user) {
            const assembly = await this.asambleasService.create(dto, user);
            return AssemblyResponseDto.fromEntity(assembly, this.asambleasService.now());
        }
        async updateDraft(id, dto) {
            const assembly = await this.asambleasService.updateDraft(id, dto);
            return AssemblyResponseDto.fromEntity(assembly, this.asambleasService.now());
        }
        async publish(id, user) {
            const assembly = await this.asambleasService.publish(id, user);
            return AssemblyResponseDto.fromEntity(assembly, this.asambleasService.now());
        }
    };
    return AsambleasController = _classThis;
})();
export { AsambleasController };
