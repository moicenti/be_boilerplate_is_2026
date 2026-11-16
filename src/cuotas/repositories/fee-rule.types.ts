import {
  FeeRuleScope,
  Prisma,
  type FeeAmountType,
  type InactiveUnitPolicy,
  type UnitType,
} from '@PrismaClient';

export const WITH_CONFIG = {
  units: { select: { unitId: true } },
  typeAmounts: { orderBy: { unitType: 'asc' } },
} satisfies Prisma.FeeRuleInclude;

export type FeeRuleWithConfig = Prisma.FeeRuleGetPayload<{
  include: typeof WITH_CONFIG;
}>;

export interface FeeRuleData {
  concept: string;
  amountType: FeeAmountType;
  amount: Prisma.Decimal | null;
  generationDay: number;
  dueDay: number;
  scope: FeeRuleScope;
  scopeValue: string | null;
  inactivePolicy: InactiveUnitPolicy;
  unitIds: string[];
  typeAmounts: { unitType: UnitType; amount: Prisma.Decimal }[];
}

/** Unidades que abarca un alcance (sin mirar si están activas: eso lo decide la política). */
export function scopeWhere(
  data: Pick<FeeRuleData, 'scope' | 'scopeValue' | 'unitIds'>,
): Prisma.UnitWhereInput {
  switch (data.scope) {
    case FeeRuleScope.TODAS:
      return {};
    case FeeRuleScope.TORRE:
      return { tower: { equals: data.scopeValue ?? '', mode: 'insensitive' } };
    case FeeRuleScope.TIPO:
      return { type: data.scopeValue as UnitType };
    case FeeRuleScope.SELECCION:
      return { id: { in: data.unitIds } };
  }
}

export function toRuleData(rule: FeeRuleWithConfig): FeeRuleData {
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
export function ruleSnapshot(rule: FeeRuleWithConfig): Prisma.InputJsonObject {
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
