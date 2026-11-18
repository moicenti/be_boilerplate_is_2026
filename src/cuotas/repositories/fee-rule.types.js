import { FeeRuleScope, } from '@PrismaClient';
export const WITH_CONFIG = {
    units: { select: { unitId: true } },
    typeAmounts: { orderBy: { unitType: 'asc' } },
};
/** Unidades que abarca un alcance (sin mirar si están activas: eso lo decide la política). */
export function scopeWhere(data) {
    switch (data.scope) {
        case FeeRuleScope.TODAS:
            return {};
        case FeeRuleScope.TORRE:
            return { tower: { equals: data.scopeValue ?? '', mode: 'insensitive' } };
        case FeeRuleScope.TIPO:
            return { type: data.scopeValue };
        case FeeRuleScope.SELECCION:
            return { id: { in: data.unitIds } };
    }
}
export function toRuleData(rule) {
    return {
        concept: rule.concept,
        amountType: rule.amountType,
        amount: rule.amount,
        generationDay: rule.generationDay,
        dueDay: rule.dueDay,
        scope: rule.scope,
        scopeValue: rule.scopeValue,
        inactivePolicy: rule.inactivePolicy,
        unitIds: rule.units.map((u) => u.unitId),
        typeAmounts: rule.typeAmounts.map(({ unitType, amount }) => ({
            unitType,
            amount,
        })),
    };
}
/** Lo que se guarda en el historial de auditoría. */
export function ruleSnapshot(rule) {
    return {
        concepto: rule.concept,
        tipoMonto: rule.amountType,
        monto: rule.amount === null ? null : rule.amount.toFixed(2),
        montosPorTipo: rule.typeAmounts.map((t) => ({
            tipo: t.unitType,
            monto: t.amount.toFixed(2),
        })),
        diaGeneracion: rule.generationDay,
        diaVencimiento: rule.dueDay,
        alcance: rule.scope,
        alcanceValor: rule.scopeValue,
        unidadIds: rule.units.map((u) => u.unitId).sort(),
        politicaInactivas: rule.inactivePolicy,
        estado: rule.status,
    };
}
