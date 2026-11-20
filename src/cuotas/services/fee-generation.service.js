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
import { Injectable, Logger } from '@nestjs/common';
import { FeeAmountType, InactiveUnitPolicy, } from '@PrismaClient';
import { dueDateOf } from '../utils/index.js';
export const GENERATION_BATCH_SIZE = 100;
/** Una ejecución EN_CURSO más vieja que esto se considera interrumpida. */
export const STALE_RUN_MS = 30 * 60_000;
let FeeGenerationService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var FeeGenerationService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            FeeGenerationService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        repository;
        logger = new Logger(FeeGenerationService.name);
        constructor(repository) {
            this.repository = repository;
        }
        /**
         * Genera las cuotas de `period` para la regla. Idempotente: lo ya generado cuenta como
         * omitido, así que volver a ejecutar solo completa lo faltante.
         */
        async generate(rule, period, origin, userId = null, now = new Date()) {
            await this.repository.closeStaleRuns(rule.id, period, new Date(now.getTime() - STALE_RUN_MS));
            const run = await this.repository.startRun(rule.id, period, origin, userId);
            // Si algo falla fuera de un lote (p. ej. se cae la base), la ejecución queda EN_CURSO
            // y se reanuda cuando se considere interrumpida.
            const units = await this.repository.findScopeUnits(rule);
            const outcomes = units.map((unit) => this.classify(rule, unit));
            const dueDate = dueDateOf(period, rule.dueDay);
            for (let i = 0; i < outcomes.length; i += GENERATION_BATCH_SIZE) {
                const batch = outcomes.slice(i, i + GENERATION_BATCH_SIZE);
                await this.saveBatch(run.id, rule, period, dueDate, batch);
            }
            const finished = await this.repository.finishRun(run.id);
            this.logger.log(`Regla ${rule.id}, periodo ${period} (${origin}): ${finished.created} creadas, ` +
                `${finished.omitted} omitidas, ${finished.failed} con error.`);
            return finished;
        }
        classify(rule, unit) {
            if (!unit.active || !unit.hasResident) {
                const reason = !unit.active
                    ? 'Unidad inactiva'
                    : 'Unidad sin responsable';
                switch (rule.inactivePolicy) {
                    case InactiveUnitPolicy.OMITIR:
                        return { kind: 'omit' };
                    case InactiveUnitPolicy.REVISAR:
                        return {
                            kind: 'error',
                            unitId: unit.id,
                            cause: `${reason}: requiere revisión.`,
                        };
                    case InactiveUnitPolicy.GENERAR:
                        break;
                }
            }
            const amount = this.amountFor(rule, unit);
            if (!amount) {
                return {
                    kind: 'error',
                    unitId: unit.id,
                    cause: rule.amountType === FeeAmountType.FIJO
                        ? 'La regla no tiene monto configurado.'
                        : `La regla no tiene monto para el tipo de unidad ${unit.type}.`,
                };
            }
            return { kind: 'fee', fee: { unitId: unit.id, amount } };
        }
        amountFor(rule, unit) {
            if (rule.amountType === FeeAmountType.FIJO)
                return rule.amount;
            return (rule.typeAmounts.find((t) => t.unitType === unit.type)?.amount ?? null);
        }
        async saveBatch(runId, rule, period, dueDate, batch) {
            const base = {
                runId,
                ruleId: rule.id,
                concept: rule.concept,
                period,
                dueDate,
            };
            const fees = batch.flatMap((o) => (o.kind === 'fee' ? [o.fee] : []));
            const errors = batch.flatMap((o) => o.kind === 'error' ? [{ unitId: o.unitId, cause: o.cause }] : []);
            const omitted = batch.filter((o) => o.kind === 'omit').length;
            try {
                await this.repository.saveBatch({ ...base, fees, errors, omitted });
                return;
            }
            catch (error) {
                // Sin cuotas en el lote no hay unidad que aislar: es un problema de la base.
                if (fees.length === 0)
                    throw error;
                this.logger.warn(`Lote fallido en la ejecución ${runId}; se reintenta unidad por unidad.`);
            }
            // El lote se revirtió entero: se aísla la unidad que falla para no perder las demás.
            await this.repository.saveBatch({ ...base, fees: [], errors, omitted });
            for (const fee of fees) {
                try {
                    await this.repository.saveBatch({
                        ...base,
                        fees: [fee],
                        errors: [],
                        omitted: 0,
                    });
                }
                catch (error) {
                    await this.repository.saveBatch({
                        ...base,
                        fees: [],
                        errors: [{ unitId: fee.unitId, cause: this.describe(error) }],
                        omitted: 0,
                    });
                }
            }
        }
        describe(error) {
            const message = error instanceof Error ? error.message : String(error);
            const lastLine = message.trim().split('\n').at(-1) ?? message;
            return `Error al crear la cuota: ${lastLine}`.slice(0, 500);
        }
    };
    return FeeGenerationService = _classThis;
})();
export { FeeGenerationService };
