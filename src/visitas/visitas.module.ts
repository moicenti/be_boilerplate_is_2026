import { Module } from '@nestjs/common';
import { PreautorizacionController } from '@Visitas/controllers/';
import { PreautorizacionService } from '@Visitas/services/';
import { PreautorizacionRepository } from '@Visitas/repositories/';

@Module({
  controllers: [PreautorizacionController],
  providers: [PreautorizacionService, PreautorizacionRepository],
})
export class VisitasModule {}