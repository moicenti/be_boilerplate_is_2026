import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services';
import {
  FeeRuleStatus,
  GenerationRunStatus,
  Prisma,
  Role,
  type GenerationOrigin,
  type GenerationRun,
  type UnitType,
} from '@PrismaClient';
import { GenerationInProgressError } from '../errors/index.js';
import {
  WITH_CONFIG,
  scopeWhere,
  type FeeRuleWithConfig,
} from './fee-rule.types.js';

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

export interface ScopeUnit {
  id: string;
  code: string;
  type: UnitType;
  active: boolean;
  /** Tiene al menos un residente activo asignado. */
  hasResident: boolean;
}

export interface FeeToInsert {
  unitId: string;
  amount: Prisma.Decimal;
}

export interface BatchInput {
  runId: number;
  ruleId: number;
  concept: string;
  period: string;
  dueDate: Date;
  fees: FeeToInsert[];
  errors: { unitId: string; cause: string }[];
  /** Unidades omitidas por política, sin intentar insertar. */
  omitted: number;
}

@Injectable()
export class FeeGenerationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveRulesByDay(day: number): Promise<FeeRuleWithConfig[]> {
    return this.prisma.feeRule.findMany({
      where: { status: FeeRuleStatus.ACTIVA, generationDay: day },
      include: WITH_CONFIG,
      orderBy: { id: 'asc' },
    });
  }

  /** Reglas ACTIVAS con una ejecución del periodo que quedó EN_CURSO (proceso interrumpido). */
  findActiveRulesWithStaleRuns(
    period: string,
    staleBefore: Date,
  ): Promise<FeeRuleWithConfig[]> {
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

  findRuleById(id: number): Promise<FeeRuleWithConfig | null> {
    return this.prisma.feeRule.findUnique({
      where: { id },
      include: WITH_CONFIG,
    });
  }

  /** Cierra como CON_ERRORES las ejecuciones EN_CURSO abandonadas, para poder reanudar. */
  closeStaleRuns(
    ruleId: number,
    period: string,
    staleBefore: Date,
  ): Promise<number> {
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

  async startRun(
    ruleId: number,
    period: string,
    origin: GenerationOrigin,
    userId: string | null,
  ): Promise<GenerationRun> {
    try {
      return await this.prisma.generationRun.create({
        data: { ruleId, period, origin, userId },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_CONSTRAINT_VIOLATION
      ) {
        throw new GenerationInProgressError(ruleId, period);
      }
      throw error;
    }
  }

  async findScopeUnits(rule: FeeRuleWithConfig): Promise<ScopeUnit[]> {
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
  async saveBatch(input: BatchInput): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const created =
        input.fees.length === 0
          ? 0
          : (
              await tx.fee.createManyAndReturn({
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
              })
            ).length;

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

  finishRun(runId: number): Promise<GenerationRun> {
    return this.prisma.$transaction(async (tx) => {
      const run = await tx.generationRun.findUniqueOrThrow({
        where: { id: runId },
      });
      return tx.generationRun.update({
        where: { id: runId },
        data: {
          finishedAt: new Date(),
          status:
            run.failed > 0
              ? GenerationRunStatus.CON_ERRORES
              : GenerationRunStatus.COMPLETADA,
        },
      });
    });
  }
}
