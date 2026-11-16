import { Injectable, Logger } from '@nestjs/common';
import {
  FeeAmountType,
  InactiveUnitPolicy,
  type GenerationOrigin,
  type GenerationRun,
  type Prisma,
} from '@PrismaClient';
import {
  FeeGenerationRepository,
  type FeeRuleWithConfig,
  type FeeToInsert,
  type ScopeUnit,
} from '../repositories/index.js';
import { dueDateOf } from '../utils/index.js';

export const GENERATION_BATCH_SIZE = 100;
/** Una ejecución EN_CURSO más vieja que esto se considera interrumpida. */
export const STALE_RUN_MS = 30 * 60_000;

type Outcome =
  | { kind: 'fee'; fee: FeeToInsert }
  | { kind: 'omit' }
  | { kind: 'error'; unitId: string; cause: string };

@Injectable()
export class FeeGenerationService {
  private readonly logger = new Logger(FeeGenerationService.name);

  constructor(private readonly repository: FeeGenerationRepository) {}

  /**
   * Genera las cuotas de `period` para la regla. Idempotente: lo ya generado cuenta como
   * omitido, así que volver a ejecutar solo completa lo faltante.
   */
  async generate(
    rule: FeeRuleWithConfig,
    period: string,
    origin: GenerationOrigin,
    userId: string | null = null,
    now = new Date(),
  ): Promise<GenerationRun> {
    await this.repository.closeStaleRuns(
      rule.id,
      period,
      new Date(now.getTime() - STALE_RUN_MS),
    );
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
    this.logger.log(
      `Regla ${rule.id}, periodo ${period} (${origin}): ${finished.created} creadas, ` +
        `${finished.omitted} omitidas, ${finished.failed} con error.`,
    );
    return finished;
  }

  classify(rule: FeeRuleWithConfig, unit: ScopeUnit): Outcome {
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
        cause:
          rule.amountType === FeeAmountType.FIJO
            ? 'La regla no tiene monto configurado.'
            : `La regla no tiene monto para el tipo de unidad ${unit.type}.`,
      };
    }
    return { kind: 'fee', fee: { unitId: unit.id, amount } };
  }

  private amountFor(
    rule: FeeRuleWithConfig,
    unit: ScopeUnit,
  ): Prisma.Decimal | null {
    if (rule.amountType === FeeAmountType.FIJO) return rule.amount;
    return (
      rule.typeAmounts.find((t) => t.unitType === unit.type)?.amount ?? null
    );
  }

  private async saveBatch(
    runId: number,
    rule: FeeRuleWithConfig,
    period: string,
    dueDate: Date,
    batch: Outcome[],
  ): Promise<void> {
    const base = {
      runId,
      ruleId: rule.id,
      concept: rule.concept,
      period,
      dueDate,
    };
    const fees = batch.flatMap((o) => (o.kind === 'fee' ? [o.fee] : []));
    const errors = batch.flatMap((o) =>
      o.kind === 'error' ? [{ unitId: o.unitId, cause: o.cause }] : [],
    );
    const omitted = batch.filter((o) => o.kind === 'omit').length;

    try {
      await this.repository.saveBatch({ ...base, fees, errors, omitted });
      return;
    } catch (error) {
      // Sin cuotas en el lote no hay unidad que aislar: es un problema de la base.
      if (fees.length === 0) throw error;
      this.logger.warn(
        `Lote fallido en la ejecución ${runId}; se reintenta unidad por unidad.`,
      );
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
      } catch (error) {
        await this.repository.saveBatch({
          ...base,
          fees: [],
          errors: [{ unitId: fee.unitId, cause: this.describe(error) }],
          omitted: 0,
        });
      }
    }
  }

  private describe(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    const lastLine = message.trim().split('\n').at(-1) ?? message;
    return `Error al crear la cuota: ${lastLine}`.slice(0, 500);
  }
}
