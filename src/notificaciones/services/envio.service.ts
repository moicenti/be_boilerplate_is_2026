import { Injectable, Logger } from '@nestjs/common';
import { NotificacionRepository } from '@Notificaciones/repositories';

@Injectable()
export class EnvioService {
  private readonly logger = new Logger(EnvioService.name);

  constructor(private readonly repo: NotificacionRepository) {}

  /** Punto de integración del canal real (correo, push...). Por ahora simulado. */
  private async enviar(_n: { id: number }): Promise<void> {
    if (process.env.NOTIFICACIONES_SIMULAR_FALLO === 'true') {
      throw new Error('Fallo simulado de envío');
    }
  }

  async procesar(n: { id: number }): Promise<void> {
    try {
      await this.enviar(n);
      await this.repo.marcarEnviada(n.id);
    } catch (e) {
      const estado = await this.repo.registrarFallo(
        n.id,
        e instanceof Error ? e.message : String(e),
      );
      this.logger.warn(`Notificación ${n.id} → ${estado}`);
    }
  }
}
