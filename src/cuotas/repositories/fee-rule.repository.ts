import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services';
import {
  FeeRuleAction,
  FeeRuleStatus,
  Prisma,
  type FeeRuleChange,
  type UnitType,
} from '@PrismaClient';
import { FeeRuleDuplicateError } from '../errors/index.js';
import {
  WITH_CONFIG,
  ruleSnapshot,
  scopeWhere,
  type FeeRuleData,
  type FeeRuleWithConfig,
} from './fee-rule.types.js';

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

export type FeeRuleChangeWithUser = FeeRuleChange & {
  changedBy: { email: string } | null;
};

@Injectable()
export class FeeRuleRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(status?: FeeRuleStatus): Promise<FeeRuleWithConfig[]> {
    return this.prisma.feeRule.findMany({
      where: status ? { status } : {},
      include: WITH_CONFIG,
      orderBy: { id: 'asc' },
    });
  }

  findById(id: number): Promise<FeeRuleWithConfig | null> {
    return this.prisma.feeRule.findUnique({
      where: { id },
      include: WITH_CONFIG,
    });
  }

  /** Regla vigente (no INACTIVA) con el mismo concepto (sin mayúsculas) y alcance. */
  findDuplicate(
    data: Pick<FeeRuleData, 'concept' | 'scope' | 'scopeValue'>,
    excludeId?: number,
  ): Promise<{ id: number } | null> {
    return this.prisma.feeRule.findFirst({
      where: {
        concept: { equals: data.concept, mode: 'insensitive' },
        scope: data.scope,
        scopeValue:
          data.scopeValue === null
            ? null
            : { equals: data.scopeValue, mode: 'insensitive' },
        status: { not: FeeRuleStatus.INACTIVA },
        ...(excludeId !== undefined && { id: { not: excludeId } }),
      },
      select: { id: true },
    });
  }

  findExistingUnitIds(ids: string[]): Promise<string[]> {
    return this.prisma.unit
      .findMany({ where: { id: { in: ids } }, select: { id: true } })
      .then((units) => units.map((u) => u.id));
  }

  countScopeUnits(
    data: Pick<FeeRuleData, 'scope' | 'scopeValue' | 'unitIds'>,
  ): Promise<number> {
    return this.prisma.unit.count({ where: scopeWhere(data) });
  }

  scopeUnitTypes(
    data: Pick<FeeRuleData, 'scope' | 'scopeValue' | 'unitIds'>,
  ): Promise<UnitType[]> {
    return this.prisma.unit
      .findMany({
        where: scopeWhere(data),
        select: { type: true },
        distinct: ['type'],
      })
      .then((rows) => rows.map((r) => r.type));
  }

  async create(
    data: FeeRuleData,
    status: FeeRuleStatus,
    userId: string,
  ): Promise<FeeRuleWithConfig> {
    return this.mapDuplicate(() =>
      this.prisma.$transaction(async (tx) => {
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
      }),
    );
  }

  async update(
    previous: FeeRuleWithConfig,
    data: FeeRuleData,
    userId: string,
  ): Promise<FeeRuleWithConfig> {
    return this.mapDuplicate(() =>
      this.prisma.$transaction(async (tx) => {
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
      }),
    );
  }

  async changeStatus(
    previous: FeeRuleWithConfig,
    status: FeeRuleStatus,
    userId: string,
  ): Promise<FeeRuleWithConfig> {
    return this.mapDuplicate(() =>
      this.prisma.$transaction(async (tx) => {
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
      }),
    );
  }

  findChanges(ruleId: number): Promise<FeeRuleChangeWithUser[]> {
    return this.prisma.feeRuleChange.findMany({
      where: { ruleId },
      include: { changedBy: { select: { email: true } } },
      orderBy: { id: 'asc' },
    });
  }

  // El índice único parcial de concepto y alcance es la protección final ante carreras.
  private async mapDuplicate<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_CONSTRAINT_VIOLATION
      ) {
        throw new FeeRuleDuplicateError();
      }
      throw error;
    }
  }
}
