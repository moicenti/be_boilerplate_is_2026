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
import { BlockOverlapError } from '../errors/index.js';
import { BLOCKING_RESERVATION_STATUSES } from '../constants.js';
import { formatTime, timeToSeconds, toZonedParts } from '../utils/time.js';
const DAY_NAMES = ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'];
let CommonAreaBlocksService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var CommonAreaBlocksService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CommonAreaBlocksService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        blockRepository;
        commonAreasService;
        timeZone;
        constructor(blockRepository, commonAreasService, configService) {
            this.blockRepository = blockRepository;
            this.commonAreasService = commonAreasService;
            this.timeZone = configService.get('APP_TIMEZONE', { infer: true });
        }
        async findAll(areaId) {
            await this.commonAreasService.findOne(areaId);
            return this.blockRepository.findAllByArea(areaId);
        }
        async create(areaId, dto, user) {
            const area = await this.commonAreasService.findOne(areaId);
            const startsAt = new Date(dto.inicio);
            const endsAt = new Date(dto.fin);
            if (endsAt <= startsAt) {
                throw this.error(HttpStatus.UNPROCESSABLE_ENTITY, 'DATOS_INVALIDOS', 'El fin del bloqueo debe ser posterior al inicio.');
            }
            if (startsAt <= new Date()) {
                throw this.error(HttpStatus.UNPROCESSABLE_ENTITY, 'DATOS_INVALIDOS', 'No se pueden crear bloqueos que empiecen en el pasado.');
            }
            const start = toZonedParts(startsAt, this.timeZone);
            const end = toZonedParts(endsAt, this.timeZone);
            if (start.date !== end.date) {
                throw this.outsideSchedule('El bloqueo debe empezar y terminar el mismo día.');
            }
            const schedule = area.schedules.find((s) => s.dayOfWeek === start.dayOfWeek);
            if (!schedule) {
                throw this.outsideSchedule(`El área no abre los ${DAY_NAMES[start.dayOfWeek]}.`);
            }
            if (start.secondsOfDay < timeToSeconds(schedule.opensAt) ||
                end.secondsOfDay > timeToSeconds(schedule.closesAt)) {
                throw this.outsideSchedule(`El bloqueo debe quedar dentro del horario del área los ${DAY_NAMES[start.dayOfWeek]} ` +
                    `(${formatTime(schedule.opensAt)} a ${formatTime(schedule.closesAt)}, hora local).`);
            }
            if (await this.blockRepository.hasOverlappingBlock(areaId, startsAt, endsAt)) {
                throw this.overlap();
            }
            const reservations = await this.blockRepository.countOverlappingReservations(areaId, BLOCKING_RESERVATION_STATUSES, startsAt, endsAt);
            if (reservations > 0) {
                throw this.error(HttpStatus.CONFLICT, 'BLOQUEO_CON_RESERVAS', `No se puede bloquear: hay ${reservations} reserva(s) pendiente(s) o confirmada(s) en ese horario.`);
            }
            try {
                return await this.blockRepository.create({
                    areaId,
                    startsAt,
                    endsAt,
                    reason: dto.motivo,
                    createdById: user.id,
                });
            }
            catch (error) {
                if (error instanceof BlockOverlapError)
                    throw this.overlap();
                throw error;
            }
        }
        async remove(areaId, blockId) {
            await this.commonAreasService.findOne(areaId);
            const block = await this.blockRepository.findByIdAndArea(blockId, areaId);
            if (!block) {
                throw this.error(HttpStatus.NOT_FOUND, 'BLOQUEO_INEXISTENTE', 'El bloqueo no existe.');
            }
            if (block.endsAt <= new Date()) {
                throw this.error(HttpStatus.CONFLICT, 'TRANSICION_INVALIDA', 'El bloqueo ya terminó; se conserva como historial y no se puede eliminar.');
            }
            await this.blockRepository.deleteById(blockId);
        }
        outsideSchedule(mensaje) {
            return this.error(HttpStatus.UNPROCESSABLE_ENTITY, 'BLOQUEO_FUERA_DE_HORARIO', mensaje);
        }
        overlap() {
            return this.error(HttpStatus.CONFLICT, 'BLOQUEO_SUPERPUESTO', 'El bloqueo se superpone con otro bloqueo de la misma área.');
        }
        error(status, codigo, mensaje) {
            return new ApiException(status, codigo, mensaje);
        }
    };
    return CommonAreaBlocksService = _classThis;
})();
export { CommonAreaBlocksService };
