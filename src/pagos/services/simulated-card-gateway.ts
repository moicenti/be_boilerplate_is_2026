import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '@Config';

/** Últimos 4 dígitos de la tarjeta de prueba que siempre se rechaza. */
export const DECLINED_TEST_CARD = '2000';

/**
 * Pasarela de pago simulada (H1): no mueve dinero. Tarda PAGO_SIMULADO_ESPERA_MS (5 s por
 * defecto) y rechaza siempre la tarjeta que termina en 2000; acepta las demás, incluida la
 * de prueba que termina en 2026. Recibe solo los últimos 4 dígitos, nunca el número completo.
 */
@Injectable()
export class SimulatedCardGateway {
  private readonly delayMs: number;

  constructor(configService: ConfigService<EnvConfig, true>) {
    this.delayMs = configService.get('PAGO_SIMULADO_ESPERA_MS', { infer: true });
  }

  /** true si la pasarela aprueba el cobro. */
  async charge(cardLast4: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    return cardLast4 !== DECLINED_TEST_CARD;
  }
}
