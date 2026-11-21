import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificacionesService } from '@Notificaciones';
import {
  PackageRepository,
  type PackageWithRelations,
} from '@Paquetes/repositories';
import type { User } from '@PrismaClient';

const MODULO_ORIGEN = 'paqueteria';
const PICKUP_LOCATION = 'Caseta principal';
const REMINDER_AFTER_HOURS = 72;
const TIME_ZONE = 'America/El_Salvador';

@Injectable()
export class AvisosPaqueteService {
  private readonly logger = new Logger(AvisosPaqueteService.name);

  constructor(
    private readonly packageRepository: PackageRepository,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  now(): Date {
    return new Date();
  }

  async notifyArrival(
    pkg: PackageWithRelations,
    receivedBy: User,
  ): Promise<void> {
    try {
      await this.notificacionesService.emitir(
        {
          destinatario: { tipo: 'UNIDAD', id: pkg.unitId },
          tipo: 'LLEGADA_PAQUETE',
          titulo: 'Llegó un paquete para tu unidad',
          mensaje:
            `Paquete de ${pkg.carrier} recibido el ${this.format(pkg.receivedAt)} ` +
            `para ${pkg.recipientName}. Retíralo en ${PICKUP_LOCATION} con el ` +
            `código de retiro ${pkg.pickupCode}.`,
          moduloOrigen: MODULO_ORIGEN,
          enlaceAccion: `/paquetes/${pkg.id}`,
        },
        { id: receivedBy.id, rol: receivedBy.role },
      );
    } catch (error) {
      this.logger.warn(
        `No se pudo avisar la llegada del paquete ${pkg.folio}: ${String(error)}`,
      );
    }
  }

  @Cron(CronExpression.EVERY_HOUR, { name: 'recordatorio-paquetes' })
  async handleReminders(): Promise<void> {
    const sent = await this.sendReminders();
    if (sent > 0)
      this.logger.log(`Recordatorios de paquetes enviados: ${sent}`);
  }

  async sendReminders(): Promise<number> {
    const now = this.now();
    const cutoff = new Date(now.getTime() - REMINDER_AFTER_HOURS * 3_600_000);
    const due = await this.packageRepository.findDueForReminder(cutoff);

    let sent = 0;
    for (const pkg of due) {
      const claimed = await this.packageRepository.markReminderSentIfPending(
        pkg.id,
        now,
      );
      if (!claimed) continue;
      try {
        await this.notificacionesService.emitir({
          destinatario: { tipo: 'UNIDAD', id: pkg.unitId },
          tipo: 'RECORDATORIO_PAQUETE',
          titulo: 'Tu paquete sigue en caseta',
          mensaje:
            `El paquete ${pkg.folio} de ${pkg.carrier} lleva más de ${REMINDER_AFTER_HOURS} horas ` +
            `en ${PICKUP_LOCATION}. Código de retiro: ${pkg.pickupCode}.`,
          moduloOrigen: MODULO_ORIGEN,
          enlaceAccion: `/paquetes/${pkg.id}`,
        });
        sent += 1;
      } catch (error) {
        this.logger.warn(
          `No se pudo enviar el recordatorio del paquete ${pkg.folio}: ${String(error)}`,
        );
      }
    }
    return sent;
  }

  private format(date: Date): string {
    return new Intl.DateTimeFormat('es-SV', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: TIME_ZONE,
    }).format(date);
  }
}
