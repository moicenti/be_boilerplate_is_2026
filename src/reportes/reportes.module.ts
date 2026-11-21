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
  ReporteAreasComunesService, // ✅ NUEVO
  ResumenService,
  ExportarReportesService,
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
    ReporteAreasComunesService, // ✅ NUEVO
    ExportarReportesService,
  ],
  exports: [ResumenService, SeccionesRepository, ReporteAreasComunesService],
})
export class ReportesModule {}