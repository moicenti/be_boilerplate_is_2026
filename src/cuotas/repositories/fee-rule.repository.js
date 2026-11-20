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
import { FeeRuleAction, FeeRuleStatus, Prisma, } from '@PrismaClient';
import { FeeRuleDuplicateError } from '../errors/index.js';
import { WITH_CONFIG, ruleSnapshot, scopeWhere, } from './fee-rule.types.js';
const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';
let FeeRuleRepository = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var FeeRuleRepository = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            FeeRuleRepository = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        constructor(prisma) {
            this.prisma = prisma;
        }
        findAll(status) {
            return this.prisma.feeRule.findMany({
                where: status ? { status } : {},
                include: WITH_CONFIG,
                orderBy: { id: 'asc' },
            });
        }
        findById(id) {
            return this.prisma.feeRule.findUnique({
                where: { id },
                include: WITH_CONFIG,
            });
        }
        /** Regla vigente (no INACTIVA) con el mismo concepto (sin mayúsculas) y alcance. */
        findDuplicate(data, excludeId) {
            return this.prisma.feeRule.findFirst({
                where: {
                    concept: { equals: data.concept, mode: 'insensitive' },
                    scope: data.scope,
                    scopeValue: data.scopeValue === null
                        ? null
                        : { equals: data.scopeValue, mode: 'insensitive' },
                    status: { not: FeeRuleStatus.INACTIVA },
                    ...(excludeId !== undefined && { id: { not: excludeId } }),
                },
                select: { id: true },
            });
        }
        findExistingUnitIds(ids) {
            return this.prisma.unit
                .findMany({ where: { id: { in: ids } }, select: { id: true } })
                .then((units) => units.map((u) => u.id));
        }
        countScopeUnits(data) {
            return this.prisma.unit.count({ where: scopeWhere(data) });
        }
        scopeUnitTypes(data) {
            return this.prisma.unit
                .findMany({
                where: scopeWhere(data),
                select: { type: true },
                distinct: ['type'],
            })
                .then((rows) => rows.map((r) => r.type));
        }
        async create(data, status, userId) {
            return this.mapDuplicate(() => this.prisma.$transaction(async (tx) => {
                const { unitIds, typeAmounts, ...fields } = data;
                const rule = await tx.feeRule.create({
                    data: {
                        ...fields,
                        status,
                        createdById: userId,
                        units: { create: unitIds.map((unitId) => ({ unitId })) },
                        typeAmounts: { create: typeAmounts },
                    },
                    include: WITH_CONFIG,
                });
                await tx.feeRuleChange.create({
                    data: {
                        ruleId: rule.id,
                        action: FeeRuleAction.CREACION,
                        newValue: ruleSnapshot(rule),
                        changedById: userId,
                    },
                });
                return rule;
            }));
        }
        async update(previous, data, userId) {
            return this.mapDuplicate(() => this.prisma.$transaction(async (tx) => {
                const { unitIds, typeAmounts, ...fields } = data;
                // Solo cambia la regla: las cuotas ya generadas guardan su propio monto y concepto.
                const rule = await tx.feeRule.update({
                    where: { id: previous.id },
                    data: {
                        ...fields,
                        units: {
                            deleteMany: {},
                            create: unitIds.map((unitId) => ({ unitId })),
                        },
                        typeAmounts: { deleteMany: {}, create: typeAmounts },
                    },
                    include: WITH_CONFIG,
                });
                await tx.feeRuleChange.create({
                    data: {
                        ruleId: rule.id,
                        action: FeeRuleAction.EDICION,
                        previousValue: ruleSnapshot(previous),
                        newValue: ruleSnapshot(rule),
                        changedById: userId,
                    },
                });
                return rule;
            }));
        }
        async changeStatus(previous, status, userId) {
            return this.mapDuplicate(() => this.prisma.$transaction(async (tx) => {
                const rule = await tx.feeRule.update({
                    where: { id: previous.id },
                    data: { status },
                    include: WITH_CONFIG,
                });
                await tx.feeRuleChange.create({
                    data: {
                        ruleId: rule.id,
                        action: FeeRuleAction.CAMBIO_ESTADO,
                        previousValue: { estado: previous.status },
                        newValue: { estado: status },
                        changedById: userId,
                    },
                });
                return rule;
            }));
        }
        findChanges(ruleId) {
            return this.prisma.feeRuleChange.findMany({
                where: { ruleId },
                include: { changedBy: { select: { email: true } } },
                orderBy: { id: 'asc' },
            });
        }
        // El índice único parcial de concepto y alcance es la protección final ante carreras.
        async mapDuplicate(operation) {
            try {
                return await operation();
            }
            catch (error) {
                if (error instanceof Prisma.PrismaClientKnownRequestError &&
                    error.code === UNIQUE_CONSTRAINT_VIOLATION) {
                    throw new FeeRuleDuplicateError();
                }
                throw error;
            }
        }
    };
    return FeeRuleRepository = _classThis;
})();
export { FeeRuleRepository };
