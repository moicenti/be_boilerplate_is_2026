import { Module } from '@nestjs/common';
import { ComunicadosController } from './controllers/index.js';
import { ComunicadosService } from './services/index.js';
import { ComunicadosRepository } from './repositories/index.js';

@Module({
  controllers: [ComunicadosController],
  providers: [ComunicadosService, ComunicadosRepository],
  exports: [ComunicadosService, ComunicadosRepository],
})
export class AnunciosModule {}