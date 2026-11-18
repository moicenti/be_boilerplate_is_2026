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
import { ConflictException, Injectable, NotFoundException, UnprocessableEntityException, } from '@nestjs/common';
import { randomInt, timingSafeEqual } from 'node:crypto';
import { PackageStatus, Role } from '@PrismaClient';
const PICKUP_CODE_LENGTH = 6;
const PAGE_SIZE = 20;
const TIME_ZONE = 'America/El_Salvador';
let PaquetesService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var PaquetesService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            PaquetesService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        packageRepository;
        unidadesService;
        constructor(packageRepository, unidadesService) {
            this.packageRepository = packageRepository;
            this.unidadesService = unidadesService;
        }
        async register(dto, receivedBy) {
            const unit = await this.unidadesService.findById(dto.unitId);
            if (!unit) {
                throw new NotFoundException('La unidad indicada no existe en el condominio.');
            }
            const number = await this.packageRepository.nextNumber();
            return this.packageRepository.create({
                number,
                folio: this.buildFolio(number, new Date()),
                pickupCode: this.generatePickupCode(),
                unitId: unit.id,
                receivedById: receivedBy.id,
                recipientName: dto.recipientName,
                carrier: dto.carrier,
                trackingReference: dto.trackingReference,
                description: dto.description,
                notes: dto.notes,
            });
        }
        async deliver(id, dto, deliveredBy) {
            const pkg = await this.findOrFail(id);
            if (pkg.status === PackageStatus.ENTREGADO) {
                throw this.alreadyDelivered(pkg);
            }
            if (!this.pickupCodeMatches(pkg.pickupCode, dto.pickupCode)) {
                throw new UnprocessableEntityException('El código de retiro no corresponde a este paquete.');
            }
            const delivered = await this.packageRepository.markDeliveredIfPending(id, {
                deliveredTo: dto.deliveredTo,
                deliveredById: deliveredBy.id,
                deliveredAt: new Date(),
            });
            const updated = await this.findOrFail(id);
            if (!delivered) {
                throw this.alreadyDelivered(updated);
            }
            return updated;
        }
        async findOne(id, user) {
            const pkg = await this.findOrFail(id);
            if (user.role === Role.RESIDENTE && !this.belongsToUnitOf(pkg, user)) {
                throw new NotFoundException('El paquete no existe.');
            }
            return pkg;
        }
        canSeePickupCode(pkg, user) {
            return (user.role === Role.RESIDENTE &&
                this.belongsToUnitOf(pkg, user) &&
                pkg.status === PackageStatus.PENDIENTE_RETIRO);
        }
        async listForResident(user, query) {
            const empty = {
                items: [],
                page: query.page,
                pageSize: PAGE_SIZE,
                total: 0,
                totalPages: 1,
                pendingCount: 0,
            };
            if (!user.unitId)
                return empty;
            const [{ items, total }, pendingCount] = await Promise.all([
                this.packageRepository.findPageForUnit(user.unitId, query.estado, (query.page - 1) * PAGE_SIZE, PAGE_SIZE),
                this.packageRepository.countPendingForUnit(user.unitId),
            ]);
            return {
                ...empty,
                items,
                total,
                totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
                pendingCount,
            };
        }
        async list(query) {
            const { items, total } = await this.packageRepository.findPage({
                status: query.estado,
                unitCode: query.unidad,
                folio: query.folio,
                carrier: query.empresa,
                search: query.q,
            }, (query.page - 1) * PAGE_SIZE, PAGE_SIZE);
            const [summary, carriers] = await Promise.all([
                this.packageRepository.pendingSummary(),
                this.packageRepository.carriers(),
            ]);
            return {
                items,
                page: query.page,
                pageSize: PAGE_SIZE,
                total,
                totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
                ...summary,
                carriers,
            };
        }
        buildFolio(number, date) {
            return `PAQ-${date.getFullYear()}-${String(number).padStart(4, '0')}`;
        }
        generatePickupCode() {
            return String(randomInt(0, 10 ** PICKUP_CODE_LENGTH)).padStart(PICKUP_CODE_LENGTH, '0');
        }
        belongsToUnitOf(pkg, user) {
            return Boolean(user.unitId) && pkg.unitId === user.unitId;
        }
        async findOrFail(id) {
            const pkg = await this.packageRepository.findById(id);
            if (!pkg) {
                throw new NotFoundException('El paquete no existe.');
            }
            return pkg;
        }
        pickupCodeMatches(expected, received) {
            const a = Buffer.from(expected);
            const b = Buffer.from(received);
            return a.length === b.length && timingSafeEqual(a, b);
        }
        alreadyDelivered(pkg) {
            const when = pkg.deliveredAt
                ? new Intl.DateTimeFormat('es-SV', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                    timeZone: TIME_ZONE,
                }).format(pkg.deliveredAt)
                : 'fecha desconocida';
            return new ConflictException({
                message: `Este paquete ya fue entregado el ${when} a ${pkg.deliveredTo}.`,
                error: 'Conflict',
                statusCode: 409,
                deliveredAt: pkg.deliveredAt,
                deliveredTo: pkg.deliveredTo,
            });
        }
    };
    return PaquetesService = _classThis;
})();
export { PaquetesService };
