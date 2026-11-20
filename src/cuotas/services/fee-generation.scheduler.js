var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { GenerationOrigin } from '@PrismaClient';
import { toZonedParts } from '@CommonAreas/utils';
import { GenerationInProgressError } from '../errors/index.js';
import { periodOf } from '../utils/index.js';
import { STALE_RUN_MS, } from './fee-generation.service.js';
let FeeGenerationScheduler = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _onTick_decorators;
    var FeeGenerationScheduler = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _onTick_decorators = [Cron('0 5 * * * *')];
            __esDecorate(this, null, _onTick_decorators, { kind: "method", name: "onTick", static: false, private: false, access: { has: obj => "onTick" in obj, get: obj => obj.onTick }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            FeeGenerationScheduler = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        repository = __runInitializers(this, _instanceExtraInitializers);
        generationService;
        logger = new Logger(FeeGenerationScheduler.name);
        timeZone;
        running = false;
        constructor(repository, generationService, configService) {
            this.repository = repository;
            this.generationService = generationService;
            this.timeZone = configService.get('APP_TIMEZONE', { infer: true });
        }
        // @Cron no lee APP_TIMEZONE: se dispara cada hora en el minuto 5 y solo trabaja
        // cuando en el condominio son las 00:05, sin importar la zona del servidor.
        async onTick() {
            const now = new Date();
            if (toZonedParts(now, this.timeZone).secondsOfDay >= 3600)
                return;
            await this.runDaily(now);
        }
        /** Reglas ACTIVAS cuyo día de generación es hoy, más las ejecuciones interrumpidas del mes. */
        async runDaily(now = new Date()) {
            if (this.running)
                return [];
            this.running = true;
            try {
                const { period, day } = periodOf(now, this.timeZone);
                const staleBefore = new Date(now.getTime() - STALE_RUN_MS);
                const [due, interrupted] = await Promise.all([
                    this.repository.findActiveRulesByDay(day),
                    this.repository.findActiveRulesWithStaleRuns(period, staleBefore),
                ]);
                const rules = new Map([...due, ...interrupted].map((rule) => [rule.id, rule]));
                const runs = [];
                for (const rule of rules.values()) {
                    // Una regla que falla no detiene a las demás.
                    try {
                        runs.push(await this.generationService.generate(rule, period, GenerationOrigin.AUTOMATICA, null, now));
                    }
                    catch (error) {
                        if (error instanceof GenerationInProgressError) {
                            this.logger.warn(error.message);
                        }
                        else {
                            this.logger.error(`No se pudo generar la regla ${rule.id} (${period}).`, error);
                        }
                    }
                }
                return runs;
            }
            finally {
                this.running = false;
            }
        }
    };
    return FeeGenerationScheduler = _classThis;
})();
export { FeeGenerationScheduler };
