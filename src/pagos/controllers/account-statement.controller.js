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
import { Controller, Get, HttpStatus, ParseUUIDPipe, UseFilters } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse, } from '@nestjs/swagger';
import { Role } from '@PrismaClient';
import { Roles } from '@Auth/decorators';
import { ApiException } from '@Common/errors';
import { ApiExceptionFilter } from '@Common/filters';
import { AccountStatementResponseDto } from '../dto/index.js';
const ParseUnitIdPipe = new ParseUUIDPipe({
    exceptionFactory: () => new ApiException(HttpStatus.BAD_REQUEST, 'SOLICITUD_INVALIDA', 'El id de la unidad debe ser un UUID.'),
});
let AccountStatementController = (() => {
    let _classDecorators = [ApiTags('pagos'), ApiBearerAuth(), ApiUnauthorizedResponse({ description: 'NO_AUTENTICADO' }), UseFilters(ApiExceptionFilter), Controller('unidades')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getAccountStatement_decorators;
    var AccountStatementController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _getAccountStatement_decorators = [Get(':unidadId/estado-de-cuenta'), Roles(Role.RESIDENTE, Role.ADMINISTRADOR), ApiOperation({
                    summary: 'Estado de cuenta de una unidad: saldo, cuotas y pagos',
                    description: 'El residente solo puede consultar su unidad; el administrador, cualquiera. ' +
                        'Los saldos se calculan en cada consulta. Una unidad sin cuotas devuelve listas vacías.',
                }), ApiOkResponse({ type: AccountStatementResponseDto }), ApiBadRequestResponse({ description: 'SOLICITUD_INVALIDA: el id no es un UUID' }), ApiForbiddenResponse({ description: 'ROL_NO_PERMITIDO / RECURSO_AJENO: la unidad no es suya' }), ApiNotFoundResponse({ description: 'UNIDAD_INEXISTENTE' })];
            __esDecorate(this, null, _getAccountStatement_decorators, { kind: "method", name: "getAccountStatement", static: false, private: false, access: { has: obj => "getAccountStatement" in obj, get: obj => obj.getAccountStatement }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AccountStatementController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        paymentsService = __runInitializers(this, _instanceExtraInitializers);
        timeZone;
        constructor(paymentsService, configService) {
            this.paymentsService = paymentsService;
            this.timeZone = configService.get('APP_TIMEZONE', { infer: true });
        }
        async getAccountStatement(unitId, user) {
            const statement = await this.paymentsService.getAccountStatement(unitId, user);
            return AccountStatementResponseDto.fromStatement(statement, this.timeZone);
        }
    };
    return AccountStatementController = _classThis;
})();
export { AccountStatementController };
