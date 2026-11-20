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
import { ApiException } from '@Common/errors';
import { DEFAULT_AVAILABILITY_DURATION_MIN, OCCUPYING_RESERVATION_STATUSES, UnavailabilityReason, } from '../constants.js';
import { dayOfWeekOf, parseTime, timeToSeconds, toZonedParts, zonedDateTimeToInstant, } from '../utils/time.js';
/**
 * Disponibilidad de las áreas comunes en un intervalo (H4). Solo lectura.
 *
 * Por cada área ACTIVA, en este orden: ¿el intervalo cae dentro de su horario del día?
 * (si no, FUERA_DE_HORARIO) → ¿cruza un bloqueo? (BLOQUEADA) → ¿cruza una reserva
 * CONFIRMADA? (RESERVADA) → disponible.
 */
let CommonAreaAvailabilityService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var CommonAreaAvailabilityService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CommonAreaAvailabilityService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        availabilityRepository;
        commonAreasService;
        timeZone;
        constructor(availabilityRepository, commonAreasService, configService) {
            this.availabilityRepository = availabilityRepository;
            this.commonAreasService = commonAreasService;
            this.timeZone = configService.get('APP_TIMEZONE', { infer: true });
        }
        async check(query) {
            const { fecha, hora, areaId } = query;
            const durationMin = query.duracionMin ?? DEFAULT_AVAILABILITY_DURATION_MIN;
            // "YYYY-MM-DD" se compara bien como texto.
            if (fecha < toZonedParts(new Date(), this.timeZone).date) {
                throw new ApiException(HttpStatus.BAD_REQUEST, 'SOLICITUD_INVALIDA', 'No se puede consultar la disponibilidad de una fecha pasada.');
            }
            const areas = areaId !== undefined
                ? [await this.commonAreasService.findOne(areaId)]
                : await this.commonAreasService.findAll();
            // El horario se compara en hora local; bloqueos y reservas, como instantes.
            const dayOfWeek = dayOfWeekOf(fecha);
            const startSeconds = timeToSeconds(parseTime(hora));
            const endSeconds = startSeconds + durationMin * 60;
            const startsAt = zonedDateTimeToInstant(fecha, hora, this.timeZone);
            const endsAt = new Date(startsAt.getTime() + durationMin * 60_000);
            const openAreaIds = areas
                .filter((area) => this.isWithinSchedule(area, dayOfWeek, startSeconds, endSeconds))
                .map((area) => area.id);
            const [blocked, reserved] = openAreaIds.length === 0
                ? [new Set(), new Set()]
                : await Promise.all([
                    this.availabilityRepository.findAreaIdsWithOverlappingBlocks(openAreaIds, startsAt, endsAt),
                    this.availabilityRepository.findAreaIdsWithOverlappingReservations(openAreaIds, OCCUPYING_RESERVATION_STATUSES, startsAt, endsAt),
                ]);
            const open = new Set(openAreaIds);
            return areas.map((area) => ({
                area,
                reason: !open.has(area.id)
                    ? UnavailabilityReason.FUERA_DE_HORARIO
                    : blocked.has(area.id)
                        ? UnavailabilityReason.BLOQUEADA
                        : reserved.has(area.id)
                            ? UnavailabilityReason.RESERVADA
                            : null,
            }));
        }
        /** El intervalo completo cae dentro del horario del área ese día (y no cruza la medianoche). */
        isWithinSchedule(area, dayOfWeek, startSeconds, endSeconds) {
            const schedule = area.schedules.find((s) => s.dayOfWeek === dayOfWeek);
            return (schedule !== undefined &&
                startSeconds >= timeToSeconds(schedule.opensAt) &&
                endSeconds <= timeToSeconds(schedule.closesAt));
        }
    };
    return CommonAreaAvailabilityService = _classThis;
})();
export { CommonAreaAvailabilityService };
