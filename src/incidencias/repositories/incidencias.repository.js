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
let IncidenciaRepository = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var IncidenciaRepository = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            IncidenciaRepository = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        constructor(prisma) {
            this.prisma = prisma;
        }
        async create(userId, unit, folio, data, photoUrls) {
            return this.prisma.report.create({
                data: {
                    folio,
                    title: data.title,
                    description: data.description,
                    category: data.category,
                    location: data.location,
                    status: 'Abierto',
                    unit,
                    userId,
                    photos: {
                        create: photoUrls.map((url) => ({ url })),
                    },
                    events: {
                        create: {
                            action: 'CREADO',
                            userId,
                            metadata: { status: 'Abierto' },
                        },
                    },
                },
                include: { photos: true, events: true },
            });
        }
        async findAllByUser(userId) {
            return this.prisma.report.findMany({
                where: { userId },
                include: { photos: true, assignee: true },
                orderBy: { createdAt: 'desc' },
            });
        }
        async findOneByIdAndUser(id, userId) {
            return this.prisma.report.findFirst({
                where: { id, userId },
                include: { photos: true, events: true, assignee: true },
            });
        }
        async findById(id) {
            return this.prisma.report.findUnique({
                where: { id },
                include: {
                    photos: true,
                    events: true,
                    assignee: true,
                    user: true,
                },
            });
        }
        async assign(id, data) {
            return this.prisma.report.update({
                where: { id },
                data: {
                    priority: data.priority,
                    assigneeId: data.assigneeId,
                    dueDate: data.dueDate,
                    priorityJustification: data.priorityJustification,
                    ...(data.newStatus && { status: data.newStatus }),
                    events: {
                        create: {
                            action: 'ASIGNADO',
                            userId: data.updatedById,
                            metadata: {
                                priority: data.priority,
                                assigneeId: data.assigneeId,
                                dueDate: data.dueDate.toISOString(),
                                ...(data.priorityJustification && {
                                    priorityJustification: data.priorityJustification,
                                }),
                            },
                        },
                    },
                },
                include: { photos: true, assignee: true, events: true },
            });
        }
        async resolve(id, data) {
            return this.prisma.report.update({
                where: { id },
                data: {
                    status: 'Resuelto',
                    resolutionComment: data.resolutionComment,
                    resolvedAt: new Date(),
                    resolvedById: data.resolvedById,
                    events: {
                        create: {
                            action: 'RESUELTO',
                            userId: data.resolvedById,
                            metadata: { resolutionComment: data.resolutionComment },
                        },
                    },
                },
                include: { photos: true, events: true },
            });
        }
        async findAllAdmin(filters) {
            return this.prisma.report.findMany({
                where: {
                    ...(filters.status && { status: filters.status }),
                    ...(filters.priority && { priority: filters.priority }),
                    ...(filters.unit && { unit: filters.unit }),
                },
                include: {
                    photos: true,
                    assignee: true,
                    user: true,
                    events: { orderBy: { createdAt: 'asc' } },
                },
                orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
            });
        }
        async countOpenByPriority() {
            const OPEN_STATUSES = ['Abierto', 'En atención', 'Rechazado'];
            const [groups, rechazados] = await Promise.all([
                this.prisma.report.groupBy({
                    by: ['priority'],
                    where: { status: { in: OPEN_STATUSES } },
                    _count: { _all: true },
                }),
                this.prisma.report.count({
                    where: { status: 'Rechazado' },
                }),
            ]);
            const result = {
                BAJA: 0,
                MEDIA: 0,
                ALTA: 0,
                CRITICA: 0,
                SIN_PRIORIDAD: 0,
                RECHAZADOS: rechazados, // ← NUEVO
            };
            for (const group of groups) {
                if (group.priority) {
                    result[group.priority] = group._count._all;
                }
                else {
                    result.SIN_PRIORIDAD = group._count._all;
                }
            }
            return result;
        }
        async findMaintenanceUsers() {
            return this.prisma.user.findMany({
                where: { role: 'MANTENIMIENTO', isActive: true },
                select: { id: true, email: true, role: true },
                orderBy: { email: 'asc' },
            });
        }
        async findActiveMaintenanceById(id) {
            return this.prisma.user.findFirst({
                where: { id, role: 'MANTENIMIENTO', isActive: true },
            });
        }
        async confirmResolution(id, userId) {
            return this.prisma.report.update({
                where: { id },
                data: {
                    status: 'Cerrado',
                    events: {
                        create: {
                            action: 'CONFIRMADO',
                            userId,
                            metadata: { confirmedAt: new Date().toISOString() },
                        },
                    },
                },
                include: { photos: true, events: true },
            });
        }
        async rejectResolution(id, userId, comment) {
            return this.prisma.report.update({
                where: { id },
                data: {
                    status: 'Rechazado',
                    resolutionComment: null,
                    resolvedAt: null,
                    resolvedById: null,
                    events: {
                        create: {
                            action: 'RECHAZADO',
                            userId,
                            metadata: { rejectionComment: comment },
                        },
                    },
                },
                include: { photos: true, events: true },
            });
        }
    };
    return IncidenciaRepository = _classThis;
})();
export { IncidenciaRepository };
