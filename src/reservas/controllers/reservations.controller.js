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
import { Controller, Get, HttpStatus, ParseIntPipe, Patch, Post, UseFilters, } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse, ApiUnprocessableEntityResponse, } from '@nestjs/swagger';
import { Role } from '@PrismaClient';
import { Roles } from '@Auth/decorators';
import { ApiException } from '@Common/errors';
import { ApiExceptionFilter } from '@Common/filters';
import { ReservationResponseDto } from '../dto/index.js';
const parseId = new ParseIntPipe({
    exceptionFactory: () => new ApiException(HttpStatus.BAD_REQUEST, 'SOLICITUD_INVALIDA', 'El id de la reserva debe ser un número entero.'),
});
let ReservationsController = (() => {
    let _classDecorators = [ApiTags('reservas'), ApiBearerAuth(), ApiUnauthorizedResponse({ description: 'NO_AUTENTICADO' }), ApiForbiddenResponse({ description: 'ROL_NO_PERMITIDO / UNIDAD_NO_ASIGNADA' }), UseFilters(ApiExceptionFilter), Roles(Role.RESIDENTE), Controller('reservas')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _create_decorators;
    let _findMine_decorators;
    let _cancel_decorators;
    var ReservationsController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _create_decorators = [Post(), ApiOperation({ summary: 'Reserva un área común para la unidad del residente' }), ApiCreatedResponse({ type: ReservationResponseDto }), ApiBadRequestResponse({ description: 'SOLICITUD_INVALIDA' }), ApiNotFoundResponse({ description: 'AREA_INEXISTENTE' }), ApiConflictResponse({ description: 'RESERVA_CRUZADA' }), ApiUnprocessableEntityResponse({ description: 'FUERA_DE_HORARIO: horario, bloqueo o fecha pasada' })];
            _findMine_decorators = [Get(), ApiOperation({ summary: 'Lista las reservas de la unidad del residente' }), ApiOkResponse({ type: [ReservationResponseDto] })];
            _cancel_decorators = [Patch(':id/cancelar'), ApiOperation({ summary: 'Cancela una reserva de la unidad que aún no termina' }), ApiOkResponse({ type: ReservationResponseDto }), ApiNotFoundResponse({ description: 'RESERVA_INEXISTENTE' }), ApiForbiddenResponse({ description: 'RECURSO_AJENO' }), ApiConflictResponse({ description: 'TRANSICION_INVALIDA' })];
            __esDecorate(this, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findMine_decorators, { kind: "method", name: "findMine", static: false, private: false, access: { has: obj => "findMine" in obj, get: obj => obj.findMine }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _cancel_decorators, { kind: "method", name: "cancel", static: false, private: false, access: { has: obj => "cancel" in obj, get: obj => obj.cancel }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ReservationsController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        reservationsService = __runInitializers(this, _instanceExtraInitializers);
        timeZone;
        constructor(reservationsService, configService) {
            this.reservationsService = reservationsService;
            this.timeZone = configService.get('APP_TIMEZONE', { infer: true });
        }
        async create(dto, user) {
            const reservation = await this.reservationsService.create(dto, user);
            return ReservationResponseDto.fromEntity(reservation, this.timeZone);
        }
        async findMine(user) {
            const reservations = await this.reservationsService.findMine(user);
            return reservations.map((r) => ReservationResponseDto.fromEntity(r, this.timeZone));
        }
        async cancel(id, user) {
            const reservation = await this.reservationsService.cancel(id, user);
            return ReservationResponseDto.fromEntity(reservation, this.timeZone);
        }
    };
    return ReservationsController = _classThis;
})();
export { ReservationsController };
