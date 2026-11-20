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
import { CommonAreaStatus, Prisma, } from '@PrismaClient';
import { CommonAreaNameTakenError } from '../errors/index.js';
/** Código de Prisma para violación de restricción única. */
const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';
const WITH_SCHEDULES = {
    schedules: { orderBy: { dayOfWeek: 'asc' } },
};
let CommonAreaRepository = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var CommonAreaRepository = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CommonAreaRepository = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        constructor(prisma) {
            this.prisma = prisma;
        }
        findAllActive() {
            return this.prisma.commonArea.findMany({
                where: { status: CommonAreaStatus.ACTIVA },
                include: WITH_SCHEDULES,
                orderBy: { name: 'asc' },
            });
        }
        findActiveById(id) {
            return this.prisma.commonArea.findFirst({
                where: { id, status: CommonAreaStatus.ACTIVA },
                include: WITH_SCHEDULES,
            });
        }
        existsActiveByName(name, excludeId) {
            return this.prisma.commonArea
                .count({
                where: {
                    status: CommonAreaStatus.ACTIVA,
                    name: { equals: name, mode: 'insensitive' },
                    ...(excludeId !== undefined ? { id: { not: excludeId } } : {}),
                },
            })
                .then((count) => count > 0);
        }
        async create({ schedules, ...fields }) {
            try {
                return await this.prisma.commonArea.create({
                    data: { ...fields, schedules: { create: schedules } },
                    include: WITH_SCHEDULES,
                });
            }
            catch (error) {
                throw this.translateError(error, fields.name);
            }
        }
        async update(id, { schedules, ...fields }, changes, changedById) {
            try {
                return await this.prisma.$transaction(async (tx) => {
                    await tx.commonAreaSchedule.deleteMany({ where: { areaId: id } });
                    if (changes.length > 0) {
                        await tx.commonAreaChange.createMany({
                            data: changes.map((change) => ({ ...change, areaId: id, changedById })),
                        });
                    }
                    return tx.commonArea.update({
                        where: { id },
                        data: { ...fields, schedules: { create: schedules } },
                        include: WITH_SCHEDULES,
                    });
                });
            }
            catch (error) {
                throw this.translateError(error, fields.name);
            }
        }
        countUpcomingReservations(areaId, statuses, now) {
            return this.prisma.reservation.count({
                where: { areaId, status: { in: [...statuses] }, endsAt: { gt: now } },
            });
        }
        async softDelete(id, deletedById, deletedAt) {
            await this.prisma.commonArea.update({
                where: { id },
                data: { status: CommonAreaStatus.ELIMINADA, deletedAt, deletedById },
            });
        }
        translateError(error, name) {
            if (error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === UNIQUE_CONSTRAINT_VIOLATION) {
                return new CommonAreaNameTakenError(name);
            }
            return error;
        }
    };
    return CommonAreaRepository = _classThis;
})();
export { CommonAreaRepository };
