import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificacionRepository } from '@Notificaciones/repositories';
import { EnvioService } from './envio.service.js';

@Injectable()
export class ReintentosService {
  constructor(
    private readonly repo: NotificacionRepository,
    private readonly envio: EnvioService,
  ) {}

  @Cron('*/5 * * * *')
  async reintentar(): Promise<void> {
    for (const n of await this.repo.reintentables()) {
      await this.envio.procesar(n);
    }
  }
}
