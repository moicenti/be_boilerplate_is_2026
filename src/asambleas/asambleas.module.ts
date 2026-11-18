import { Module } from '@nestjs/common';
import { NotificacionesModule } from '@Notificaciones';
import { AsambleasController, TemasController } from '@Asambleas/controllers';
import { AsambleasService } from '@Asambleas/services';
import { AssemblyRepository } from '@Asambleas/repositories';

@Module({
  imports: [NotificacionesModule],
  controllers: [AsambleasController, TemasController],
  providers: [AsambleasService, AssemblyRepository],
})
export class AsambleasModule {}
