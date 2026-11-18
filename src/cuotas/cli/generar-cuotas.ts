// Ejecuta la tarea diaria de generación como si fueran las 00:05 de la fecha indicada.
// Uso: npm run cuotas:generar -- 2026-12-01   (sin fecha: hoy)
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { EnvConfig } from '@Config';
import { toZonedParts, zonedDateTimeToInstant } from '@CommonAreas/utils';
import { AppModule } from '../../app.module.js';
import { FeeGenerationScheduler } from '../services/index.js';

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });
  try {
    const timeZone = app
      .get(ConfigService<EnvConfig, true>)
      .get('APP_TIMEZONE', { infer: true });
    const date = process.argv[2] ?? toZonedParts(new Date(), timeZone).date;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
      throw new Error('La fecha debe tener el formato AAAA-MM-DD.');

    const runs = await app
      .get(FeeGenerationScheduler)
      .runDaily(zonedDateTimeToInstant(date, '00:05', timeZone));
    Logger.log(
      `${date}: ${runs.length} regla(s) procesada(s).`,
      'GenerarCuotas',
    );
    for (const run of runs) {
      Logger.log(
        `Regla ${run.ruleId} · ${run.period} · ${run.status}: ${run.created} creadas, ` +
          `${run.omitted} omitidas, ${run.failed} con error (ejecución ${run.id}).`,
        'GenerarCuotas',
      );
    }
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  Logger.error(error instanceof Error ? error.message : error, 'GenerarCuotas');
  process.exit(1);
});
