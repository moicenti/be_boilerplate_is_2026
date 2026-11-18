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
import { Injectable } from '@nestjs/common';
import { ReservationStatus } from '@PrismaClient';
import { ReservationOverlapError } from '../errors/index.js';
const OVERLAP_CONSTRAINT = 'reserva_sin_cruce';
let ReservationRepository = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ReservationRepository = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ReservationRepository = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        constructor(prisma) {
            this.prisma = prisma;
        }
        hasOverlappingBlock(areaId, startsAt, endsAt) {
            return this.prisma.commonAreaBlock
                .count({ where: { areaId, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } } })
                .then((count) => count > 0);
        }
        findAllByUnit(unitId) {
            return this.prisma.reservation.findMany({
                where: { unitId },
                orderBy: { startsAt: 'desc' },
            });
        }
        findById(id) {
            return this.prisma.reservation.findUnique({ where: { id } });
        }
        async create(data) {
            try {
                return await this.prisma.reservation.create({
                    data: { ...data, status: ReservationStatus.CONFIRMADA },
                });
            }
            catch (error) {
                if (error instanceof Error && error.message.includes(OVERLAP_CONSTRAINT)) {
                    throw new ReservationOverlapError();
                }
                throw error;
            }
        }
        /** Cancela solo si sigue CONFIRMADA y no ha terminado; null si otra request se adelantó. */
        async cancel(id, now) {
            const { count } = await this.prisma.reservation.updateMany({
                where: { id, status: ReservationStatus.CONFIRMADA, endsAt: { gt: now } },
                data: { status: ReservationStatus.CANCELADA },
            });
            return count === 0 ? null : this.findById(id);
        }
    };
    return ReservationRepository = _classThis;
})();
export { ReservationRepository };
