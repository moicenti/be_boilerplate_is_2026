import { Module } from '@nestjs/common';
import { UnidadesModule } from '@Unidades';
import { PaquetesController } from '@Paquetes/controllers';
import { AvisosPaqueteService, PaquetesService } from '@Paquetes/services';
import { NotificacionesModule } from '@Notificaciones';
import { PackageRepository } from '@Paquetes/repositories';

@Module({
  imports: [UnidadesModule, NotificacionesModule],
  controllers: [PaquetesController],
  providers: [PaquetesService, AvisosPaqueteService, PackageRepository],
})
export class PaquetesModule {}
