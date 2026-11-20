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
import { Prisma, Role, } from '@PrismaClient';
const assemblyInclude = {
    createdBy: true,
    agendaItems: { orderBy: { position: 'asc' } },
    topics: {
        orderBy: { position: 'asc' },
        include: { options: { orderBy: { position: 'asc' } } },
    },
};
function fields(data) {
    return {
        title: data.title,
        type: data.type,
        modality: data.modality,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        location: data.location,
        description: data.description,
    };
}
function agendaCreate(data) {
    return data.agenda.map((item, position) => ({
        title: item.title,
        description: item.description || null,
        position,
    }));
}
function topicCreate(topic, position) {
    return {
        title: topic.title,
        description: topic.description,
        opensAt: topic.opensAt,
        closesAt: topic.closesAt,
        position,
        options: {
            create: topic.options.map((text, index) => ({ text, position: index })),
        },
    };
}
let AssemblyRepository = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AssemblyRepository = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AssemblyRepository = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        constructor(prisma) {
            this.prisma = prisma;
        }
        async nextNumber() {
            const [row] = await this.prisma.$queryRaw `
      SELECT nextval(pg_get_serial_sequence('asambleas', 'number')) AS value
    `;
            return Number(row.value);
        }
        create(data, meta) {
            return this.prisma.assembly.create({
                data: {
                    ...fields(data),
                    ...meta,
                    agendaItems: { create: agendaCreate(data) },
                    topics: { create: data.topics.map(topicCreate) },
                },
                include: assemblyInclude,
            });
        }
        replaceDraft(id, data) {
            return this.prisma.$transaction(async (tx) => {
                const { count } = await tx.assembly.updateMany({
                    where: { id, publishedAt: null },
                    data: fields(data),
                });
                if (count === 0)
                    return null;
                await tx.agendaItem.deleteMany({ where: { assemblyId: id } });
                await tx.votingTopic.deleteMany({ where: { assemblyId: id } });
                await tx.agendaItem.createMany({
                    data: agendaCreate(data).map((item) => ({ ...item, assemblyId: id })),
                });
                for (const [position, topic] of data.topics.entries()) {
                    await tx.votingTopic.create({
                        data: { ...topicCreate(topic, position), assemblyId: id },
                    });
                }
                return tx.assembly.findUniqueOrThrow({
                    where: { id },
                    include: assemblyInclude,
                });
            });
        }
        findById(id) {
            return this.prisma.assembly.findUnique({
                where: { id },
                include: assemblyInclude,
            });
        }
        findAll(filters) {
            const where = {};
            if (filters.onlyPublished)
                where.publishedAt = { not: null };
            if (filters.from || filters.to) {
                where.startsAt = {
                    ...(filters.from ? { gte: filters.from } : {}),
                    ...(filters.to ? { lte: filters.to } : {}),
                };
            }
            if (filters.search) {
                const insensitive = Prisma.QueryMode.insensitive;
                where.OR = [
                    { title: { contains: filters.search, mode: insensitive } },
                    { folio: { contains: filters.search, mode: insensitive } },
                ];
            }
            return this.prisma.assembly.findMany({
                where,
                include: assemblyInclude,
                orderBy: [{ startsAt: 'desc' }, { number: 'desc' }],
            });
        }
        async publishIfDraft(id, publishedAt) {
            const { count } = await this.prisma.assembly.updateMany({
                where: { id, publishedAt: null },
                data: { publishedAt },
            });
            return count === 1;
        }
        findTopicById(topicId) {
            return this.prisma.votingTopic.findUnique({
                where: { id: topicId },
                include: { assembly: true },
            });
        }
        updateTopicIfNotOpened(topicId, data, now) {
            return this.prisma.$transaction(async (tx) => {
                const { count } = await tx.votingTopic.updateMany({
                    where: { id: topicId, opensAt: { gt: now } },
                    data: {
                        title: data.title,
                        description: data.description,
                        opensAt: data.opensAt,
                        closesAt: data.closesAt,
                    },
                });
                if (count === 0)
                    return false;
                await tx.votingOption.deleteMany({ where: { topicId } });
                await tx.votingOption.createMany({
                    data: data.options.map((text, position) => ({
                        topicId,
                        text,
                        position,
                    })),
                });
                return true;
            });
        }
        countActiveResidents() {
            return this.prisma.user.count({
                where: { role: Role.RESIDENTE, isActive: true, unitId: { not: null } },
            });
        }
        async towers() {
            const rows = await this.prisma.unit.findMany({
                distinct: ['tower'],
                select: { tower: true },
                orderBy: { tower: 'asc' },
            });
            return rows.map((row) => row.tower);
        }
    };
    return AssemblyRepository = _classThis;
})();
export { AssemblyRepository };
