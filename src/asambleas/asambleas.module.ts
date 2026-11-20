import { Module } from '@nestjs/common';
import { NotificacionesModule } from '@Notificaciones';
import { AsambleasController, TemasController } from '@Asambleas/controllers';
import {
  AsambleasService,
  AuditDocumentRenderer,
  AuditPdfService,
  ResultadosService,
  VotosService,
} from '@Asambleas/services';
import {
  AssemblyRepository,
  ResultsRepository,
  VoteRepository,
} from '@Asambleas/repositories';

@Module({
  imports: [NotificacionesModule],
  controllers: [AsambleasController, TemasController],
  providers: [
    AsambleasService,
    AssemblyRepository,
    VotosService,
    VoteRepository,
    ResultadosService,
    ResultsRepository,
    { provide: AuditDocumentRenderer, useClass: AuditPdfService },
  ],
})
export class AsambleasModule {}
