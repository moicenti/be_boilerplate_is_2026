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
import { CommonAreaChangeField } from '@PrismaClient';
import { ApiException } from '@Common/errors';
import { CommonAreaNameTakenError } from '../errors/index.js';
import { formatTime, parseTime, timeToSeconds } from '../utils/time.js';
import { BLOCKING_RESERVATION_STATUSES } from '../constants.js';
let CommonAreasService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var CommonAreasService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CommonAreasService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        commonAreaRepository;
        constructor(commonAreaRepository) {
            this.commonAreaRepository = commonAreaRepository;
        }
        findAll() {
            return this.commonAreaRepository.findAllActive();
        }
        async findOne(id) {
            const area = await this.commonAreaRepository.findActiveById(id);
            if (!area) {
                throw new ApiException(HttpStatus.NOT_FOUND, 'AREA_INEXISTENTE', 'El área común no existe.');
            }
            return area;
        }
        async create(dto) {
            this.validateBusinessRules(dto);
            await this.ensureNameAvailable(dto.nombre);
            try {
                return await this.commonAreaRepository.create(this.toData(dto));
            }
            catch (error) {
                throw this.translateError(error);
            }
        }
        async update(id, dto, user) {
            const current = await this.findOne(id);
            this.validateBusinessRules(dto);
            await this.ensureNameAvailable(dto.nombre, id);
            try {
                return await this.commonAreaRepository.update(id, this.toData(dto), this.detectChanges(current, dto), user.id);
            }
            catch (error) {
                throw this.translateError(error);
            }
        }
        async remove(id, user) {
            await this.findOne(id);
            const now = new Date();
            const upcoming = await this.commonAreaRepository.countUpcomingReservations(id, BLOCKING_RESERVATION_STATUSES, now);
            if (upcoming > 0) {
                throw new ApiException(HttpStatus.CONFLICT, 'AREA_DUPLICADA', `No se puede eliminar el área: tiene ${upcoming} reserva(s) pendiente(s) o confirmada(s) por realizarse.`);
            }
            await this.commonAreaRepository.softDelete(id, user.id, now);
        }
        validateBusinessRules({ capacidad, duracionBloque, horarios }) {
            if (capacidad <= 0) {
                throw this.invalidData('La capacidad debe ser mayor a 0.');
            }
            if (duracionBloque <= 0) {
                throw this.invalidData('La duración del bloque debe ser de al menos 1 hora.');
            }
            const seenDays = new Set();
            for (const schedule of horarios) {
                if (seenDays.has(schedule.diaSemana)) {
                    throw this.invalidData(`Hay más de un horario para el día ${schedule.diaSemana}; solo se permite uno por día.`);
                }
                seenDays.add(schedule.diaSemana);
                // "HH:mm" con ceros a la izquierda se compara bien como texto.
                if (schedule.horaCierre <= schedule.horaApertura) {
                    throw this.invalidData(`La hora de cierre debe ser posterior a la de apertura (día ${schedule.diaSemana}).`);
                }
                // Un bloque más largo que el horario del día nunca podría reservarse.
                const openSeconds = timeToSeconds(parseTime(schedule.horaCierre)) - timeToSeconds(parseTime(schedule.horaApertura));
                if (duracionBloque * 3600 > openSeconds) {
                    throw this.invalidData(`La duración del bloque (${duracionBloque} h) excede el horario del día ${schedule.diaSemana}.`);
                }
            }
        }
        async ensureNameAvailable(name, excludeId) {
            if (await this.commonAreaRepository.existsActiveByName(name, excludeId)) {
                throw this.duplicateName(name);
            }
        }
        detectChanges(current, dto) {
            const changes = [];
            if (current.capacity !== dto.capacidad) {
                changes.push({
                    field: CommonAreaChangeField.CAPACIDAD,
                    previousValue: current.capacity,
                    newValue: dto.capacidad,
                });
            }
            if (current.blockDurationHours !== dto.duracionBloque) {
                changes.push({
                    field: CommonAreaChangeField.DURACION_BLOQUE,
                    previousValue: current.blockDurationHours,
                    newValue: dto.duracionBloque,
                });
            }
            const previousSchedules = this.normalizeSchedules(current.schedules.map((schedule) => ({
                diaSemana: schedule.dayOfWeek,
                horaApertura: formatTime(schedule.opensAt),
                horaCierre: formatTime(schedule.closesAt),
            })));
            const newSchedules = this.normalizeSchedules(dto.horarios);
            if (JSON.stringify(previousSchedules) !== JSON.stringify(newSchedules)) {
                changes.push({
                    field: CommonAreaChangeField.HORARIOS,
                    previousValue: previousSchedules,
                    newValue: newSchedules,
                });
            }
            return changes;
        }
        /** Copia ordenada por día y con claves en orden fijo, para comparar y guardar. */
        normalizeSchedules(schedules) {
            return schedules
                .map(({ diaSemana, horaApertura, horaCierre }) => ({ diaSemana, horaApertura, horaCierre }))
                .sort((a, b) => a.diaSemana - b.diaSemana);
        }
        toData(dto) {
            return {
                name: dto.nombre,
                capacity: dto.capacidad,
                location: dto.ubicacion,
                blockDurationHours: dto.duracionBloque,
                usageConditions: dto.condicionesUso ?? null,
                schedules: dto.horarios.map((schedule) => ({
                    dayOfWeek: schedule.diaSemana,
                    opensAt: parseTime(schedule.horaApertura),
                    closesAt: parseTime(schedule.horaCierre),
                })),
            };
        }
        translateError(error) {
            // Carrera entre la verificación previa y el insert: lo resuelve el índice único.
            if (error instanceof CommonAreaNameTakenError) {
                return this.duplicateName(error.areaName);
            }
            return error;
        }
        invalidData(mensaje) {
            return new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, 'DATOS_INVALIDOS', mensaje);
        }
        duplicateName(name) {
            return new ApiException(HttpStatus.CONFLICT, 'AREA_DUPLICADA', `Ya existe un área común activa llamada "${name}".`);
        }
    };
    return CommonAreasService = _classThis;
})();
export { CommonAreasService };
