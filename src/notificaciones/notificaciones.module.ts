import { Module } from '@nestjs/common';
import {
  NotificacionesController,
  PreferenciasController,
} from '@Notificaciones/controllers';
import {
  CentroNotificacionesRepository,
  DestinatariosRepository,
  NotificacionRepository,
  PreferenciasRepository,
} from '@Notificaciones/repositories';
import {
  CentroNotificacionesService,
  EnvioService,
  NotificacionesService,
  PreferenciasService,
  ReintentosService,
} from '@Notificaciones/services';

@Module({
  controllers: [NotificacionesController, PreferenciasController],
  providers: [
    NotificacionesService,
    CentroNotificacionesService,
    PreferenciasService,
    EnvioService,
    ReintentosService,
    NotificacionRepository,
    DestinatariosRepository,
    CentroNotificacionesRepository,
    PreferenciasRepository,
  ],
  // Solo se exporta el servicio de H23: los módulos 1, 5, 6 y 7 no conocen la base.
  exports: [NotificacionesService],
})
export class NotificacionesModule {}
