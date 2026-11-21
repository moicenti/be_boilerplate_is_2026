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
import {
  ExportacionController,
  ReporteExportacionService,
  ReportePdfRenderer,
  ReportePdfService,
} from './exportacion/index.js';

@Module({
  controllers: [ReportesController, ExportacionController],
  providers: [
    ResumenService,
    SeccionesRepository,
    MorosidadIndicador,
    OcupacionIndicador,
    IncidenciasIndicador,
    ParticipacionIndicador,
    ReporteIncidenciasService,
    ReporteParticipacionService,
    ReporteExportacionService,
    { provide: ReportePdfRenderer, useClass: ReportePdfService },
  ],
})
export class ReportesModule {}