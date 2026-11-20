import { Module } from '@nestjs/common';
import { NotificacionesModule } from '@Notificaciones';
import { AsambleasController, TemasController } from '@Asambleas/controllers';
import { AsambleasService, VotosService } from '@Asambleas/services';
import { AssemblyRepository, VoteRepository } from '@Asambleas/repositories';

@Module({
  imports: [NotificacionesModule],
  controllers: [AsambleasController, TemasController],
  providers: [
    AsambleasService,
    AssemblyRepository,
    VotosService,
    VoteRepository,
  ],
})
export class AsambleasModule {}
