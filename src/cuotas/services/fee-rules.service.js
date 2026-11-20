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
import { HttpStatus, Injectable } from '@nestjs/common';
import { FeeAmountType, FeeRuleScope, FeeRuleStatus, InactiveUnitPolicy, Prisma, UnitType, } from '@PrismaClient';
import { ApiException } from '@Common/errors';
import { toRuleData, } from '../repositories/index.js';
import { FeeRuleDuplicateError } from '../errors/index.js';
const SCOPES_WITH_VALUE = [
    FeeRuleScope.TORRE,
    FeeRuleScope.TIPO,
];
let FeeRulesService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var FeeRulesService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            FeeRulesService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        repository;
        constructor(repository) {
            this.repository = repository;
        }
        async findAll(status) {
            const rules = await this.repository.findAll(status);
            return Promise.all(rules.map((rule) => this.view(rule)));
        }
        async findOne(id) {
            return this.view(await this.getRule(id));
        }
        async create(dto, user) {
            const data = await this.toData(dto);
            const status = dto.estado ?? FeeRuleStatus.ACTIVA;
            if (status === FeeRuleStatus.ACTIVA)
                await this.assertComplete(data);
            if (status !== FeeRuleStatus.INACTIVA)
                await this.assertNotDuplicate(data);
            const rule = await this.guardDuplicate(() => this.repository.create(data, status, user.id));
            return this.view(rule);
        }
        async update(id, dto, user) {
            const previous = await this.getRule(id);
            const data = await this.toData(dto);
            if (previous.status === FeeRuleStatus.ACTIVA)
                await this.assertComplete(data);
            if (previous.status !== FeeRuleStatus.INACTIVA)
                await this.assertNotDuplicate(data, id);
            const rule = await this.guardDuplicate(() => this.repository.update(previous, data, user.id));
            return this.view(rule);
        }
        async changeStatus(id, status, user) {
            const previous = await this.getRule(id);
            if (previous.status === status) {
                throw new ApiException(HttpStatus.CONFLICT, 'TRANSICION_INVALIDA', `La regla ya está ${status}.`);
            }
            const data = toRuleData(previous);
            if (status === FeeRuleStatus.ACTIVA)
                await this.assertComplete(data);
            // Al salir de INACTIVA vuelve a contar para la unicidad de concepto y alcance.
            if (previous.status === FeeRuleStatus.INACTIVA)
                await this.assertNotDuplicate(data, id);
            return this.guardDuplicate(() => this.repository.changeStatus(previous, status, user.id));
        }
        async findChanges(id) {
            await this.getRule(id);
            return this.repository.findChanges(id);
        }
        async getRule(id) {
            const rule = await this.repository.findById(id);
            if (!rule) {
                throw new ApiException(HttpStatus.NOT_FOUND, 'REGLA_INEXISTENTE', 'La regla de cuota no existe.');
            }
            return rule;
        }
        async view(rule) {
            return {
                rule,
                applicableUnits: await this.repository.countScopeUnits({
                    scope: rule.scope,
                    scopeValue: rule.scopeValue,
                    unitIds: rule.units.map((u) => u.unitId),
                }),
            };
        }
        /** Coherencia del request (400). Que la regla esté completa se valida al activarla (422). */
        async toData(dto) {
            if (dto.diaVencimiento < dto.diaGeneracion) {
                throw this.invalid('diaVencimiento debe ser mayor o igual a diaGeneracion.');
            }
            const typeAmounts = dto.montosPorTipo ?? [];
            if (dto.tipoMonto === FeeAmountType.FIJO && typeAmounts.length > 0) {
                throw this.invalid('montosPorTipo solo aplica con tipoMonto POR_TIPO_UNIDAD.');
            }
            if (dto.tipoMonto === FeeAmountType.POR_TIPO_UNIDAD && dto.monto != null) {
                throw this.invalid('Con tipoMonto POR_TIPO_UNIDAD el monto se indica en montosPorTipo.');
            }
            if (new Set(typeAmounts.map((t) => t.tipo)).size !== typeAmounts.length) {
                throw this.invalid('montosPorTipo no puede repetir un tipo de unidad.');
            }
            const scopeValue = dto.alcanceValor ?? null;
            if (SCOPES_WITH_VALUE.includes(dto.alcance) && scopeValue === null) {
                throw this.invalid(`alcanceValor es obligatorio con alcance ${dto.alcance}.`);
            }
            if (!SCOPES_WITH_VALUE.includes(dto.alcance) && scopeValue !== null) {
                throw this.invalid('alcanceValor solo aplica con alcance TORRE o TIPO.');
            }
            if (dto.alcance === FeeRuleScope.TIPO &&
                !Object.values(UnitType).includes(scopeValue)) {
                throw this.invalid('Con alcance TIPO, alcanceValor debe ser DEPARTAMENTO, CASA o LOCAL.');
            }
            const unitIds = [...new Set(dto.unidadIds ?? [])];
            if (dto.alcance !== FeeRuleScope.SELECCION && unitIds.length > 0) {
                throw this.invalid('unidadIds solo aplica con alcance SELECCION.');
            }
            if (unitIds.length > 0) {
                const existing = new Set(await this.repository.findExistingUnitIds(unitIds));
                const missing = unitIds.filter((unitId) => !existing.has(unitId));
                if (missing.length > 0)
                    throw this.invalid(`Unidades inexistentes: ${missing.join(', ')}.`);
            }
            return {
                concept: dto.concepto,
                amountType: dto.tipoMonto,
                amount: dto.monto == null ? null : new Prisma.Decimal(dto.monto),
                generationDay: dto.diaGeneracion,
                dueDay: dto.diaVencimiento,
                scope: dto.alcance,
                // El tipo se guarda tal cual (enum); la torre, como la escribió el administrador.
                scopeValue,
                inactivePolicy: dto.politicaInactivas ?? InactiveUnitPolicy.OMITIR,
                unitIds,
                typeAmounts: typeAmounts.map((t) => ({
                    unitType: t.tipo,
                    amount: new Prisma.Decimal(t.monto),
                })),
            };
        }
        /** Una regla ACTIVA debe poder generar: monto y al menos una unidad aplicable. */
        async assertComplete(data) {
            const missing = [];
            if (data.amountType === FeeAmountType.FIJO && data.amount === null)
                missing.push('el monto');
            const applicable = await this.repository.countScopeUnits(data);
            if (applicable === 0)
                missing.push('unidades aplicables');
            if (data.amountType === FeeAmountType.POR_TIPO_UNIDAD) {
                if (data.typeAmounts.length === 0) {
                    missing.push('los montos por tipo de unidad');
                }
                else if (applicable > 0) {
                    const configured = new Set(data.typeAmounts.map((t) => t.unitType));
                    const types = await this.repository.scopeUnitTypes(data);
                    for (const type of types.filter((t) => !configured.has(t))) {
                        missing.push(`el monto para el tipo ${type}`);
                    }
                }
            }
            if (missing.length > 0) {
                throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, 'REGLA_INCOMPLETA', `Para activar la regla falta: ${missing.join(', ')}.`);
            }
        }
        async assertNotDuplicate(data, excludeId) {
            if (await this.repository.findDuplicate(data, excludeId))
                throw this.duplicate();
        }
        async guardDuplicate(operation) {
            try {
                return await operation();
            }
            catch (error) {
                if (error instanceof FeeRuleDuplicateError)
                    throw this.duplicate();
                throw error;
            }
        }
        duplicate() {
            return new ApiException(HttpStatus.CONFLICT, 'REGLA_DUPLICADA', 'Ya existe una regla vigente con el mismo concepto y alcance.');
        }
        invalid(mensaje) {
            return new ApiException(HttpStatus.BAD_REQUEST, 'SOLICITUD_INVALIDA', mensaje);
        }
    };
    return FeeRulesService = _classThis;
})();
export { FeeRulesService };
