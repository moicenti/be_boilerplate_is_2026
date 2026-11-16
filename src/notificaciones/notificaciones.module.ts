import { Module } from '@nestjs/common';
import { NotificacionesController } from '@Notificaciones/controllers';
import {
  CentroNotificacionesRepository,
  DestinatariosRepository,
  NotificacionRepository,
} from '@Notificaciones/repositories';
import {
  CentroNotificacionesService,
  EnvioService,
  NotificacionesService,
  ReintentosService,
} from '@Notificaciones/services';

@Module({
  controllers: [NotificacionesController],
  providers: [
    NotificacionesService,
    CentroNotificacionesService,
    EnvioService,
    ReintentosService,
    NotificacionRepository,
    DestinatariosRepository,
    CentroNotificacionesRepository,
  ],
  // Solo se exporta el servicio de H23: los módulos 1, 5, 6 y 7 no conocen la base.
  exports: [NotificacionesService],
})
export class NotificacionesModule {}
