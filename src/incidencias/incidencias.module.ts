import { Module } from '@nestjs/common';
import { IncidenciasController } from '@Incidencias/controllers';
import { IncidenciasService } from '@Incidencias/services';
import { IncidenciaRepository } from '@Incidencias/repositories';

@Module({
  controllers: [IncidenciasController],
  providers: [IncidenciasService, IncidenciaRepository],
})
export class IncidenciasModule {}