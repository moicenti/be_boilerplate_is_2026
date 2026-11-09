import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificacionRepository } from '@Notificaciones/repositories';
import { EnvioService } from './envio.service.js';

@Injectable()
export class ReintentosService {
  private ejecutando = false;

  constructor(
    private readonly repo: NotificacionRepository,
    private readonly envio: EnvioService,
  ) {}

  /** Cada 5 minutos: reintenta PENDIENTE y FALLIDO. Al tercer fallo queda FALLIDO_PERMANENTE. */
  @Cron('*/5 * * * *')
  async reintentar(): Promise<void> {
    if (this.ejecutando) return; // no solapar ejecuciones
    this.ejecutando = true;
    try {
      for (const n of await this.repo.reintentables()) {
        await this.envio.procesar(n);
      }
    } finally {
      this.ejecutando = false;
    }
  }
}
