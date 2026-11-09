import { Module } from '@nestjs/common';
import { IncidenciasController } from './controllers/index.js';
import { IncidenciasService } from './services/index.js';
import { IncidenciaRepository } from './repositories/index.js';

@Module({
  controllers: [IncidenciasController],
  providers: [IncidenciasService, IncidenciaRepository],
})
export class IncidenciasModule {}