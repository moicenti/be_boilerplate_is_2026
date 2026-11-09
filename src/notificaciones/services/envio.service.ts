import { Injectable, Logger } from '@nestjs/common';
import { NotificacionRepository } from '@Notificaciones/repositories';

@Injectable()
export class EnvioService {
  private readonly logger = new Logger(EnvioService.name);

  constructor(private readonly repo: NotificacionRepository) {}

  /**
   * Punto de integración del canal real (correo, push...). Por ahora simulado.
   * Para probar los reintentos, arrancar con NOTIFICACIONES_SIMULAR_FALLO=true.
   */
  private async enviar(_n: { id: number }): Promise<void> {
    if (process.env.NOTIFICACIONES_SIMULAR_FALLO === 'true') {
      throw new Error('Fallo simulado de envío');
    }
  }

  /** Intenta el envío y deja el estado actualizado. Nunca lanza: los errores se registran. */
  async procesar(n: { id: number }): Promise<void> {
    let motivo: string | null = null;
    try {
      await this.enviar(n);
    } catch (e) {
      motivo = e instanceof Error ? e.message : String(e);
    }

    try {
      if (motivo === null) {
        await this.repo.marcarEnviada(n.id);
      } else {
        const estado = await this.repo.registrarFallo(n.id, motivo);
        this.logger.warn(`Notificación ${n.id} → ${estado}: ${motivo}`);
      }
    } catch (e) {
      this.logger.error(
        `No se pudo actualizar la notificación ${n.id}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
}
