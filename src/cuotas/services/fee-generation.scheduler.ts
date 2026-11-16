import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { GenerationOrigin, type GenerationRun } from '@PrismaClient';
import type { EnvConfig } from '@Config';
import { toZonedParts } from '@CommonAreas/utils';
import {
  FeeGenerationRepository,
  type FeeRuleWithConfig,
} from '../repositories/index.js';
import { GenerationInProgressError } from '../errors/index.js';
import { periodOf } from '../utils/index.js';
import {
  FeeGenerationService,
  STALE_RUN_MS,
} from './fee-generation.service.js';

@Injectable()
export class FeeGenerationScheduler {
  private readonly logger = new Logger(FeeGenerationScheduler.name);
  private readonly timeZone: string;
  private running = false;

  constructor(
    private readonly repository: FeeGenerationRepository,
    private readonly generationService: FeeGenerationService,
    configService: ConfigService<EnvConfig, true>,
  ) {
    this.timeZone = configService.get('APP_TIMEZONE', { infer: true });
  }

  // @Cron no lee APP_TIMEZONE: se dispara cada hora en el minuto 5 y solo trabaja
  // cuando en el condominio son las 00:05, sin importar la zona del servidor.
  @Cron('0 5 * * * *')
  async onTick(): Promise<void> {
    const now = new Date();
    if (toZonedParts(now, this.timeZone).secondsOfDay >= 3600) return;
    await this.runDaily(now);
  }

  /** Reglas ACTIVAS cuyo día de generación es hoy, más las ejecuciones interrumpidas del mes. */
  async runDaily(now = new Date()): Promise<GenerationRun[]> {
    if (this.running) return [];
    this.running = true;
    try {
      const { period, day } = periodOf(now, this.timeZone);
      const staleBefore = new Date(now.getTime() - STALE_RUN_MS);
      const [due, interrupted] = await Promise.all([
        this.repository.findActiveRulesByDay(day),
        this.repository.findActiveRulesWithStaleRuns(period, staleBefore),
      ]);
      const rules = new Map<number, FeeRuleWithConfig>(
        [...due, ...interrupted].map((rule) => [rule.id, rule]),
      );

      const runs: GenerationRun[] = [];
      for (const rule of rules.values()) {
        // Una regla que falla no detiene a las demás.
        try {
          runs.push(
            await this.generationService.generate(
              rule,
              period,
              GenerationOrigin.AUTOMATICA,
              null,
              now,
            ),
          );
        } catch (error) {
          if (error instanceof GenerationInProgressError) {
            this.logger.warn(error.message);
          } else {
            this.logger.error(
              `No se pudo generar la regla ${rule.id} (${period}).`,
              error,
            );
          }
        }
      }
      return runs;
    } finally {
      this.running = false;
    }
  }
}
