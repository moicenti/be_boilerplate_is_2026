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
import { Controller, Delete, Get, HttpCode, HttpStatus, ParseIntPipe, Post, Put, UseFilters, } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiForbiddenResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse, ApiUnprocessableEntityResponse, } from '@nestjs/swagger';
import { Role } from '@PrismaClient';
import { Roles } from '@Auth/decorators';
import { ApiException } from '@Common/errors';
import { ApiExceptionFilter } from '@Common/filters';
import { AvailabilityResponseDto, CommonAreaResponseDto, } from '../dto/index.js';
const ParseAreaIdPipe = new ParseIntPipe({
    exceptionFactory: () => new ApiException(HttpStatus.BAD_REQUEST, 'SOLICITUD_INVALIDA', 'El id del área debe ser un número entero.'),
});
let CommonAreasController = (() => {
    let _classDecorators = [ApiTags('areas'), ApiBearerAuth(), ApiUnauthorizedResponse({ description: 'NO_AUTENTICADO: sin sesión o token vencido.' }), UseFilters(ApiExceptionFilter), Controller('areas')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _findAll_decorators;
    let _checkAvailability_decorators;
    let _findOne_decorators;
    let _create_decorators;
    let _update_decorators;
    let _remove_decorators;
    var CommonAreasController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _findAll_decorators = [Get(), ApiOperation({ summary: 'Lista las áreas comunes activas' }), ApiOkResponse({ type: [CommonAreaResponseDto] })];
            _checkAvailability_decorators = [Get('disponibilidad'), ApiOperation({
                    summary: 'Consulta qué áreas están disponibles en una fecha y hora',
                    description: 'Fecha y hora en hora local del condominio. Cuentan el horario semanal, los bloqueos ' +
                        'y las reservas CONFIRMADAS. Duración por defecto: 60 minutos.',
                }), ApiOkResponse({ type: AvailabilityResponseDto }), ApiBadRequestResponse({ description: 'SOLICITUD_INVALIDA: formato inválido o fecha pasada' }), ApiNotFoundResponse({ description: 'AREA_INEXISTENTE: areaId no existe' })];
            _findOne_decorators = [Get(':id'), ApiOperation({ summary: 'Consulta un área común activa' }), ApiOkResponse({ type: CommonAreaResponseDto }), ApiNotFoundResponse({ description: 'AREA_INEXISTENTE' })];
            _create_decorators = [Post(), Roles(Role.ADMINISTRADOR), ApiOperation({ summary: 'Crea un área común con sus horarios' }), ApiCreatedResponse({ type: CommonAreaResponseDto }), ApiBadRequestResponse({ description: 'SOLICITUD_INVALIDA' }), ApiForbiddenResponse({ description: 'ROL_NO_PERMITIDO' }), ApiConflictResponse({ description: 'AREA_DUPLICADA: nombre repetido' }), ApiUnprocessableEntityResponse({ description: 'DATOS_INVALIDOS' })];
            _update_decorators = [Put(':id'), Roles(Role.ADMINISTRADOR), ApiOperation({ summary: 'Reemplaza los datos y horarios de un área' }), ApiOkResponse({ type: CommonAreaResponseDto }), ApiBadRequestResponse({ description: 'SOLICITUD_INVALIDA' }), ApiForbiddenResponse({ description: 'ROL_NO_PERMITIDO' }), ApiNotFoundResponse({ description: 'AREA_INEXISTENTE' }), ApiConflictResponse({ description: 'AREA_DUPLICADA: nombre repetido' }), ApiUnprocessableEntityResponse({ description: 'DATOS_INVALIDOS' })];
            _remove_decorators = [Delete(':id'), Roles(Role.ADMINISTRADOR), HttpCode(HttpStatus.NO_CONTENT), ApiOperation({ summary: 'Elimina (lógicamente) un área común' }), ApiNoContentResponse({ description: 'Área eliminada' }), ApiForbiddenResponse({ description: 'ROL_NO_PERMITIDO' }), ApiNotFoundResponse({ description: 'AREA_INEXISTENTE' }), ApiConflictResponse({
                    description: 'AREA_DUPLICADA: el área tiene reservas pendientes o confirmadas por realizarse',
                })];
            __esDecorate(this, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: obj => "findAll" in obj, get: obj => obj.findAll }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _checkAvailability_decorators, { kind: "method", name: "checkAvailability", static: false, private: false, access: { has: obj => "checkAvailability" in obj, get: obj => obj.checkAvailability }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: obj => "findOne" in obj, get: obj => obj.findOne }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: obj => "update" in obj, get: obj => obj.update }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _remove_decorators, { kind: "method", name: "remove", static: false, private: false, access: { has: obj => "remove" in obj, get: obj => obj.remove }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CommonAreasController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        commonAreasService = __runInitializers(this, _instanceExtraInitializers);
        availabilityService;
        constructor(commonAreasService, availabilityService) {
            this.commonAreasService = commonAreasService;
            this.availabilityService = availabilityService;
        }
        async findAll() {
            const areas = await this.commonAreasService.findAll();
            return areas.map((area) => CommonAreaResponseDto.fromEntity(area));
        }
        // Tiene que declararse antes de GET :id; si no, "disponibilidad" se toma como un id.
        async checkAvailability(query) {
            const results = await this.availabilityService.check(query);
            return AvailabilityResponseDto.from(query.fecha, query.hora, results);
        }
        async findOne(id) {
            const area = await this.commonAreasService.findOne(id);
            return CommonAreaResponseDto.fromEntity(area);
        }
        async create(dto) {
            const area = await this.commonAreasService.create(dto);
            return CommonAreaResponseDto.fromEntity(area, { includeStatus: true });
        }
        async update(id, dto, user) {
            const area = await this.commonAreasService.update(id, dto, user);
            return CommonAreaResponseDto.fromEntity(area, { includeStatus: true });
        }
        async remove(id, user) {
            await this.commonAreasService.remove(id, user);
        }
    };
    return CommonAreasController = _classThis;
})();
export { CommonAreasController };
