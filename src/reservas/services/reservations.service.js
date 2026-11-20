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
import { HttpStatus, Injectable } from '@nestjs/common';
import { ReservationStatus } from '@PrismaClient';
import { ApiException } from '@Common/errors';
import { formatTime, timeToSeconds, toZonedParts } from '@CommonAreas/utils';
import { ReservationOverlapError } from '../errors/index.js';
const DAY_NAMES = ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'];
let ReservationsService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ReservationsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ReservationsService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        reservationRepository;
        commonAreasService;
        timeZone;
        constructor(reservationRepository, commonAreasService, configService) {
            this.reservationRepository = reservationRepository;
            this.commonAreasService = commonAreasService;
            this.timeZone = configService.get('APP_TIMEZONE', { infer: true });
        }
        async create(dto, user) {
            const startsAt = new Date(dto.inicio);
            const endsAt = new Date(dto.fin);
            if (endsAt <= startsAt) {
                throw new ApiException(HttpStatus.BAD_REQUEST, 'SOLICITUD_INVALIDA', 'El fin de la reserva debe ser posterior al inicio.');
            }
            const unitId = this.unitOf(user);
            const area = await this.commonAreasService.findOne(dto.areaId);
            if (startsAt <= new Date()) {
                throw this.notAllowed('No se puede reservar en una fecha u hora pasada.');
            }
            const start = toZonedParts(startsAt, this.timeZone);
            const end = toZonedParts(endsAt, this.timeZone);
            if (start.date !== end.date) {
                throw this.notAllowed('La reserva debe empezar y terminar el mismo día.');
            }
            const schedule = area.schedules.find((s) => s.dayOfWeek === start.dayOfWeek);
            if (!schedule) {
                throw this.notAllowed(`El área no abre los ${DAY_NAMES[start.dayOfWeek]}.`);
            }
            if (start.secondsOfDay < timeToSeconds(schedule.opensAt) ||
                end.secondsOfDay > timeToSeconds(schedule.closesAt)) {
                throw this.notAllowed(`La reserva debe quedar dentro del horario del área los ${DAY_NAMES[start.dayOfWeek]} ` +
                    `(${formatTime(schedule.opensAt)} a ${formatTime(schedule.closesAt)}, hora local).`);
            }
            if (await this.reservationRepository.hasOverlappingBlock(area.id, startsAt, endsAt)) {
                throw this.notAllowed('El área está bloqueada en ese horario.');
            }
            // Sin verificación previa de cruces: la restricción de exclusión decide, también ante
            // dos requests simultáneos.
            try {
                return await this.reservationRepository.create({
                    areaId: area.id,
                    residentId: user.id,
                    unitId,
                    startsAt,
                    endsAt,
                });
            }
            catch (error) {
                if (error instanceof ReservationOverlapError) {
                    throw new ApiException(HttpStatus.CONFLICT, 'RESERVA_CRUZADA', 'El espacio ya está reservado en ese horario.');
                }
                throw error;
            }
        }
        findMine(user) {
            return this.reservationRepository.findAllByUnit(this.unitOf(user));
        }
        async cancel(reservationId, user) {
            const unitId = this.unitOf(user);
            const reservation = await this.reservationRepository.findById(reservationId);
            if (!reservation) {
                throw new ApiException(HttpStatus.NOT_FOUND, 'RESERVA_INEXISTENTE', 'La reserva no existe.');
            }
            if (reservation.unitId !== unitId) {
                throw new ApiException(HttpStatus.FORBIDDEN, 'RECURSO_AJENO', 'Solo puedes cancelar reservas de tu unidad.');
            }
            const now = new Date();
            if (reservation.status === ReservationStatus.CANCELADA) {
                throw this.invalidTransition('La reserva ya está cancelada.');
            }
            if (reservation.endsAt <= now) {
                throw this.invalidTransition('La reserva ya terminó; se conserva en el historial.');
            }
            const cancelled = await this.reservationRepository.cancel(reservationId, now);
            if (!cancelled)
                throw this.invalidTransition('Esta reserva ya no se puede cancelar.');
            return cancelled;
        }
        // La unidad sale de la sesión, nunca del request.
        unitOf(user) {
            if (!user.unitId) {
                throw new ApiException(HttpStatus.FORBIDDEN, 'UNIDAD_NO_ASIGNADA', 'Tu cuenta no tiene una unidad registrada; contacta a la administración.');
            }
            return user.unitId;
        }
        notAllowed(mensaje) {
            return new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, 'FUERA_DE_HORARIO', mensaje);
        }
        invalidTransition(mensaje) {
            return new ApiException(HttpStatus.CONFLICT, 'TRANSICION_INVALIDA', mensaje);
        }
    };
    return ReservationsService = _classThis;
})();
export { ReservationsService };
