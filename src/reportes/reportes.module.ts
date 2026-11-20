import { Module } from '@nestjs/common';
import { ReportesController } from '@Reportes/controllers';
import { SeccionesRepository } from '@Reportes/repositories';
import {
  IncidenciasIndicador,
  MorosidadIndicador,
  OcupacionIndicador,
  ParticipacionIndicador,
  ReporteIncidenciasService,
  ReporteParticipacionService,
  ResumenService,
} from '@Reportes/services';

@Module({
  controllers: [ReportesController],
  providers: [
    ResumenService,
    SeccionesRepository,
    MorosidadIndicador,
    OcupacionIndicador,
    IncidenciasIndicador,
    ParticipacionIndicador,
    ReporteIncidenciasService,
    ReporteParticipacionService,
  ],
})
export class ReportesModule {}