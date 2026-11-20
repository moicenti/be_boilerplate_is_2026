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
import { FeeRuleStatus, GenerationRunStatus, Prisma, Role, } from '@PrismaClient';
import { GenerationInProgressError } from '../errors/index.js';
import { WITH_CONFIG, scopeWhere, } from './fee-rule.types.js';
const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';
let FeeGenerationRepository = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var FeeGenerationRepository = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            FeeGenerationRepository = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        constructor(prisma) {
            this.prisma = prisma;
        }
        findActiveRulesByDay(day) {
            return this.prisma.feeRule.findMany({
                where: { status: FeeRuleStatus.ACTIVA, generationDay: day },
                include: WITH_CONFIG,
                orderBy: { id: 'asc' },
            });
        }
        /** Reglas ACTIVAS con una ejecución del periodo que quedó EN_CURSO (proceso interrumpido). */
        findActiveRulesWithStaleRuns(period, staleBefore) {
            return this.prisma.feeRule.findMany({
                where: {
                    status: FeeRuleStatus.ACTIVA,
                    runs: {
                        some: {
                            period,
                            status: GenerationRunStatus.EN_CURSO,
                            startedAt: { lt: staleBefore },
                        },
                    },
                },
                include: WITH_CONFIG,
                orderBy: { id: 'asc' },
            });
        }
        findRuleById(id) {
            return this.prisma.feeRule.findUnique({
                where: { id },
                include: WITH_CONFIG,
            });
        }
        /** Cierra como CON_ERRORES las ejecuciones EN_CURSO abandonadas, para poder reanudar. */
        closeStaleRuns(ruleId, period, staleBefore) {
            return this.prisma.generationRun
                .updateMany({
                where: {
                    ruleId,
                    period,
                    status: GenerationRunStatus.EN_CURSO,
                    startedAt: { lt: staleBefore },
                },
                data: {
                    status: GenerationRunStatus.CON_ERRORES,
                    finishedAt: new Date(),
                },
            })
                .then((r) => r.count);
        }
        async startRun(ruleId, period, origin, userId) {
            try {
                return await this.prisma.generationRun.create({
                    data: { ruleId, period, origin, userId },
                });
            }
            catch (error) {
                if (error instanceof Prisma.PrismaClientKnownRequestError &&
                    error.code === UNIQUE_CONSTRAINT_VIOLATION) {
                    throw new GenerationInProgressError(ruleId, period);
                }
                throw error;
            }
        }
        async findScopeUnits(rule) {
            const units = await this.prisma.unit.findMany({
                where: scopeWhere({
                    scope: rule.scope,
                    scopeValue: rule.scopeValue,
                    unitIds: rule.units.map((u) => u.unitId),
                }),
                select: {
                    id: true,
                    code: true,
                    type: true,
                    active: true,
                    _count: {
                        select: {
                            users: { where: { role: Role.RESIDENTE, isActive: true } },
                        },
                    },
                },
                orderBy: { code: 'asc' },
            });
            return units.map(({ _count, ...unit }) => ({
                ...unit,
                hasResident: _count.users > 0,
            }));
        }
        /**
         * Un lote en una sola transacción. ON CONFLICT DO NOTHING sobre (unidad, regla, periodo):
         * las cuotas que ya existían no se insertan y cuentan como omitidas.
         */
        async saveBatch(input) {
            await this.prisma.$transaction(async (tx) => {
                const created = input.fees.length === 0
                    ? 0
                    : (await tx.fee.createManyAndReturn({
                        data: input.fees.map((fee) => ({
                            unitId: fee.unitId,
                            ruleId: input.ruleId,
                            concept: input.concept,
                            period: input.period,
                            amount: fee.amount,
                            dueDate: input.dueDate,
                        })),
                        skipDuplicates: true,
                        select: { id: true },
                    })).length;
                if (input.errors.length > 0) {
                    await tx.generationError.createMany({
                        data: input.errors.map((e) => ({
                            runId: input.runId,
                            unitId: e.unitId,
                            cause: e.cause,
                        })),
                    });
                }
                await tx.generationRun.update({
                    where: { id: input.runId },
                    data: {
                        created: { increment: created },
                        omitted: { increment: input.omitted + input.fees.length - created },
                        failed: { increment: input.errors.length },
                    },
                });
            });
        }
        finishRun(runId) {
            return this.prisma.$transaction(async (tx) => {
                const run = await tx.generationRun.findUniqueOrThrow({
                    where: { id: runId },
                });
                return tx.generationRun.update({
                    where: { id: runId },
                    data: {
                        finishedAt: new Date(),
                        status: run.failed > 0
                            ? GenerationRunStatus.CON_ERRORES
                            : GenerationRunStatus.COMPLETADA,
                    },
                });
            });
        }
    };
    return FeeGenerationRepository = _classThis;
})();
export { FeeGenerationRepository };
