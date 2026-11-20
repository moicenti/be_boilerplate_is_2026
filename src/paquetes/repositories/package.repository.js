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
import { PackageStatus, Prisma } from '@PrismaClient';
const packageInclude = {
    unit: true,
    receivedBy: true,
    deliveredBy: true,
};
let PackageRepository = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var PackageRepository = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            PackageRepository = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        constructor(prisma) {
            this.prisma = prisma;
        }
        async nextNumber() {
            const [row] = await this.prisma.$queryRaw `
      SELECT nextval(pg_get_serial_sequence('packages', 'number')) AS value
    `;
            return Number(row.value);
        }
        create(data) {
            return this.prisma.package.create({
                data: { ...data, notes: data.notes || null },
                include: packageInclude,
            });
        }
        findById(id) {
            return this.prisma.package.findUnique({
                where: { id },
                include: packageInclude,
            });
        }
        async findPage(filters, skip, take) {
            const where = this.buildWhere(filters);
            const orderBy = filters.status === PackageStatus.PENDIENTE_RETIRO
                ? { receivedAt: 'asc' }
                : { receivedAt: 'desc' };
            const [items, total] = await this.prisma.$transaction([
                this.prisma.package.findMany({
                    where,
                    include: packageInclude,
                    orderBy: [orderBy, { number: 'asc' }],
                    skip,
                    take,
                }),
                this.prisma.package.count({ where }),
            ]);
            return { items, total };
        }
        async findPageForUnit(unitId, status, skip, take) {
            const where = {
                unitId,
                ...(status ? { status } : {}),
            };
            const [items, total] = await this.prisma.$transaction([
                this.prisma.package.findMany({
                    where,
                    include: packageInclude,
                    orderBy: [{ receivedAt: 'desc' }, { number: 'desc' }],
                    skip,
                    take,
                }),
                this.prisma.package.count({ where }),
            ]);
            return { items, total };
        }
        countPendingForUnit(unitId) {
            return this.prisma.package.count({
                where: {
                    unitId,
                    status: PackageStatus.PENDIENTE_RETIRO,
                },
            });
        }
        async pendingSummary() {
            const where = { status: PackageStatus.PENDIENTE_RETIRO };
            const [pendingCount, recipients] = await this.prisma.$transaction([
                this.prisma.package.count({ where }),
                this.prisma.package.findMany({
                    where,
                    distinct: ['unitId', 'recipientName'],
                    select: { id: true },
                }),
            ]);
            return { pendingCount, pendingRecipientCount: recipients.length };
        }
        async carriers() {
            const rows = await this.prisma.package.findMany({
                distinct: ['carrier'],
                select: { carrier: true },
                orderBy: { carrier: 'asc' },
            });
            return rows.map((row) => row.carrier);
        }
        async markDeliveredIfPending(id, data) {
            const { count } = await this.prisma.package.updateMany({
                where: { id, status: PackageStatus.PENDIENTE_RETIRO },
                data: { ...data, status: PackageStatus.ENTREGADO },
            });
            return count === 1;
        }
        buildWhere(filters) {
            const insensitive = Prisma.QueryMode.insensitive;
            const where = { status: filters.status };
            if (filters.unitCode) {
                where.unit = { code: { equals: filters.unitCode, mode: insensitive } };
            }
            if (filters.folio) {
                where.folio = { contains: filters.folio, mode: insensitive };
            }
            if (filters.carrier) {
                where.carrier = { equals: filters.carrier, mode: insensitive };
            }
            if (filters.search) {
                where.OR = [
                    { folio: { contains: filters.search, mode: insensitive } },
                    { recipientName: { contains: filters.search, mode: insensitive } },
                    { unit: { code: { contains: filters.search, mode: insensitive } } },
                ];
            }
            return where;
        }
    };
    return PackageRepository = _classThis;
})();
export { PackageRepository };
