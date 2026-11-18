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
import { Controller, Get, HttpStatus, ParseIntPipe, Patch, Post, Put, UseFilters, } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse, ApiUnprocessableEntityResponse, } from '@nestjs/swagger';
import { Role } from '@PrismaClient';
import { Roles } from '@Auth/decorators';
import { ApiException } from '@Common/errors';
import { ApiExceptionFilter } from '@Common/filters';
import { FeeRuleChangeResponseDto, FeeRuleResponseDto, FeeRuleStatusResponseDto, } from '../dto/index.js';
const parseId = new ParseIntPipe({
    exceptionFactory: () => new ApiException(HttpStatus.BAD_REQUEST, 'SOLICITUD_INVALIDA', 'El id de la regla debe ser un número entero.'),
});
let FeeRulesController = (() => {
    let _classDecorators = [ApiTags('reglas-cuota'), ApiBearerAuth(), ApiUnauthorizedResponse({ description: 'NO_AUTENTICADO' }), ApiForbiddenResponse({ description: 'ROL_NO_PERMITIDO' }), UseFilters(ApiExceptionFilter), Roles(Role.ADMINISTRADOR), Controller('reglas-cuota')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _create_decorators;
    let _findAll_decorators;
    let _findOne_decorators;
    let _update_decorators;
    let _changeStatus_decorators;
    let _findChanges_decorators;
    var FeeRulesController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _create_decorators = [Post(), ApiOperation({ summary: 'Crea una regla de cuota (ACTIVA por defecto)' }), ApiCreatedResponse({ type: FeeRuleResponseDto }), ApiBadRequestResponse({ description: 'SOLICITUD_INVALIDA' }), ApiConflictResponse({ description: 'REGLA_DUPLICADA' }), ApiUnprocessableEntityResponse({ description: 'REGLA_INCOMPLETA' })];
            _findAll_decorators = [Get(), ApiOperation({ summary: 'Lista las reglas de cuota' }), ApiOkResponse({ type: [FeeRuleResponseDto] })];
            _findOne_decorators = [Get(':id'), ApiOperation({ summary: 'Consulta una regla de cuota' }), ApiOkResponse({ type: FeeRuleResponseDto }), ApiNotFoundResponse({ description: 'REGLA_INEXISTENTE' })];
            _update_decorators = [Put(':id'), ApiOperation({
                    summary: 'Reemplaza la configuración de la regla; las cuotas ya generadas no cambian',
                }), ApiOkResponse({ type: FeeRuleResponseDto }), ApiBadRequestResponse({ description: 'SOLICITUD_INVALIDA' }), ApiNotFoundResponse({ description: 'REGLA_INEXISTENTE' }), ApiConflictResponse({ description: 'REGLA_DUPLICADA' }), ApiUnprocessableEntityResponse({
                    description: 'REGLA_INCOMPLETA (regla ACTIVA)',
                })];
            _changeStatus_decorators = [Patch(':id/estado'), ApiOperation({ summary: 'Activa, pausa o desactiva una regla' }), ApiOkResponse({ type: FeeRuleStatusResponseDto }), ApiNotFoundResponse({ description: 'REGLA_INEXISTENTE' }), ApiConflictResponse({ description: 'TRANSICION_INVALIDA / REGLA_DUPLICADA' }), ApiUnprocessableEntityResponse({ description: 'REGLA_INCOMPLETA' })];
            _findChanges_decorators = [Get(':id/historial'), ApiOperation({
                    summary: 'Historial de auditoría de la regla (creación, ediciones y estados)',
                }), ApiOkResponse({ type: [FeeRuleChangeResponseDto] }), ApiNotFoundResponse({ description: 'REGLA_INEXISTENTE' })];
            __esDecorate(this, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: obj => "findAll" in obj, get: obj => obj.findAll }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: obj => "findOne" in obj, get: obj => obj.findOne }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: obj => "update" in obj, get: obj => obj.update }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _changeStatus_decorators, { kind: "method", name: "changeStatus", static: false, private: false, access: { has: obj => "changeStatus" in obj, get: obj => obj.changeStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findChanges_decorators, { kind: "method", name: "findChanges", static: false, private: false, access: { has: obj => "findChanges" in obj, get: obj => obj.findChanges }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            FeeRulesController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        rulesService = __runInitializers(this, _instanceExtraInitializers);
        timeZone;
        constructor(rulesService, configService) {
            this.rulesService = rulesService;
            this.timeZone = configService.get('APP_TIMEZONE', { infer: true });
        }
        async create(dto, user) {
            return this.toResponse(await this.rulesService.create(dto, user));
        }
        async findAll(query) {
            const views = await this.rulesService.findAll(query.estado);
            return views.map((view) => this.toResponse(view));
        }
        async findOne(id) {
            return this.toResponse(await this.rulesService.findOne(id));
        }
        async update(id, dto, user) {
            return this.toResponse(await this.rulesService.update(id, dto, user));
        }
        async changeStatus(id, dto, user) {
            const rule = await this.rulesService.changeStatus(id, dto.estado, user);
            return { id: rule.id, estado: rule.status };
        }
        async findChanges(id) {
            const changes = await this.rulesService.findChanges(id);
            return changes.map((change) => FeeRuleChangeResponseDto.fromEntity(change, this.timeZone));
        }
        toResponse({ rule, applicableUnits, }) {
            return FeeRuleResponseDto.fromEntity(rule, applicableUnits, this.timeZone);
        }
    };
    return FeeRulesController = _classThis;
})();
export { FeeRulesController };
