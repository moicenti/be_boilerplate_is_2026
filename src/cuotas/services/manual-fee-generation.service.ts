import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  FeeRuleStatus,
  GenerationOrigin,
  Prisma,
  type User,
} from '@PrismaClient';
import type { EnvConfig } from '@Config';
import { ApiException } from '@Common/errors';
import {
  FeeGenerationRepository,
  type FeeRuleWithConfig,
  type RunErrorWithUnit,
  type RunWithUser,
} from '../repositories/index.js';
import { GenerationInProgressError } from '../errors/index.js';
import { periodOf } from '../utils/index.js';
import {
  FeeGenerationService,
  type ExceptionReason,
  type GenerationResult,
} from './fee-generation.service.js';

export interface PreviewException {
  unitId: string;
  unitCode: string;
  reason: ExceptionReason;
  /** Si al ejecutar contará como omitida o como error (depende de la política). */
  result: 'OMITIDA' | 'ERROR';
}

export interface PreviewView {
  period: string;
  /** Cuotas que se crearían (lo que la ejecución devolvería en `created`). */
  feeCount: number;
  totalAmount: Prisma.Decimal;
  alreadyGenerated: number;
  dueDate: Date;
  exceptions: PreviewException[];
}

export interface ExecutionView {
  run: GenerationResult;
  errors: RunErrorWithUnit[];
}

export interface RunsPage {
  total: number;
  page: number;
  pageSize: number;
  items: RunWithUser[];
}

/**
 * H34: vista previa, ejecución manual e historial. La generación es la misma que la de la
 * tarea programada de H3 (`FeeGenerationService`), con origen MANUAL y el usuario que confirma.
 */
@Injectable()
export class ManualFeeGenerationService {
  private readonly timeZone: string;

  constructor(
    private readonly repository: FeeGenerationRepository,
    private readonly generationService: FeeGenerationService,
    configService: ConfigService<EnvConfig, true>,
  ) {
    this.timeZone = configService.get('APP_TIMEZONE', { infer: true });
  }

  /** Simula la generación sin escribir en la base. */
  async preview(
    ruleId: number,
    period: string,
    now = new Date(),
  ): Promise<PreviewView> {
    const rule = await this.getGeneratableRule(ruleId, period, now);
    const { units, outcomes, dueDate } = await this.generationService.plan(
      rule,
      period,
    );
    const codeById = new Map(units.map((u) => [u.id, u.code]));

    let feeCount = 0;
    let alreadyGenerated = 0;
    let totalAmount = new Prisma.Decimal(0);
    const exceptions: PreviewException[] = [];
    for (const outcome of outcomes) {
      switch (outcome.kind) {
        case 'fee':
          feeCount++;
          totalAmount = totalAmount.add(outcome.fee.amount);
          break;
        case 'existing':
          alreadyGenerated++;
          break;
        case 'omit':
        case 'error':
          exceptions.push({
            unitId: outcome.unitId,
            unitCode: codeById.get(outcome.unitId) ?? '',
            reason: outcome.reason,
            result: outcome.kind === 'omit' ? 'OMITIDA' : 'ERROR',
          });
          break;
      }
    }

    return {
      period,
      feeCount,
      totalAmount,
      alreadyGenerated,
      dueDate,
      exceptions,
    };
  }

  /** Genera el periodo a pedido del administrador: solo crea las cuotas faltantes. */
  async execute(
    ruleId: number,
    period: string,
    user: User,
    now = new Date(),
  ): Promise<ExecutionView> {
    const rule = await this.getGeneratableRule(ruleId, period, now);

    let run: GenerationResult;
    try {
      run = await this.generationService.generate(
        rule,
        period,
        GenerationOrigin.MANUAL,
        user.id,
        now,
      );
    } catch (error) {
      if (error instanceof GenerationInProgressError) {
        throw new ApiException(
          HttpStatus.CONFLICT,
          'EJECUCION_EN_CURSO',
          `Ya hay una ejecución en curso para esta regla y el periodo ${period}.`,
        );
      }
      throw error;
    }

    return { run, errors: await this.repository.findRunErrors(run.id) };
  }

  /** Ejecuciones automáticas y manuales de la regla, de la más reciente a la más antigua. */
  async listRuns(
    ruleId: number,
    page: number,
    pageSize: number,
  ): Promise<RunsPage> {
    await this.getRule(ruleId);
    const { total, items } = await this.repository.findRunsPage(
      ruleId,
      (page - 1) * pageSize,
      pageSize,
    );
    return { total, page, pageSize, items };
  }

  private async getRule(id: number): Promise<FeeRuleWithConfig> {
    const rule = await this.repository.findRuleById(id);
    if (!rule) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'REGLA_INEXISTENTE',
        'La regla de cuota no existe.',
      );
    }
    return rule;
  }

  /** Igual que la tarea programada, solo genera reglas ACTIVAS; y nunca periodos futuros. */
  private async getGeneratableRule(
    id: number,
    period: string,
    now: Date,
  ): Promise<FeeRuleWithConfig> {
    const rule = await this.getRule(id);
    if (rule.status !== FeeRuleStatus.ACTIVA) {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'REGLA_INACTIVA',
        `La regla está ${rule.status}: solo se generan cuotas de reglas activas.`,
      );
    }
    const current = periodOf(now, this.timeZone).period;
    if (period > current) {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'REGLA_INACTIVA',
        `No se puede generar un periodo futuro (${period}); el periodo actual es ${current}.`,
      );
    }
    return rule;
  }
}
