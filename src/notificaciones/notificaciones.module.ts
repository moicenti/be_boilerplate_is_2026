import { Module } from '@nestjs/common';
import {
  DestinatariosRepository,
  NotificacionRepository,
} from '@Notificaciones/repositories';
import {
  EnvioService,
  NotificacionesService,
  ReintentosService,
} from '@Notificaciones/services';

@Module({
  providers: [
    NotificacionesService,
    EnvioService,
    ReintentosService,
    NotificacionRepository,
    DestinatariosRepository,
  ],
  // Solo se exporta el servicio: los módulos 1, 5, 6 y 7 no conocen la base.
  exports: [NotificacionesService],
})
export class NotificacionesModule {}
