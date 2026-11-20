import { Module } from '@nestjs/common';
import { PreautorizacionController } from '@Visitas/controllers/';
import { PreautorizacionService } from '@Visitas/services/';
import { PreautorizacionRepository } from '@Visitas/repositories/';
import { VisitaController } from '@Visitas/controllers/';
import { VisitaService } from '@Visitas/services/';
import { VisitaRepository } from '@Visitas/repositories/';

@Module({
  controllers: [PreautorizacionController, VisitaController],
  providers: [PreautorizacionService, PreautorizacionRepository, VisitaService, VisitaRepository],
})
export class VisitasModule {}