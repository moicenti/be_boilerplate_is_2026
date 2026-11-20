import { Module } from '@nestjs/common';
import { DirectorioController } from './controllers/index.js';
import { DirectorioService } from './services/index.js';
import { DirectorioRepository } from './repositories/index.js';

@Module({
  controllers: [DirectorioController],
  providers: [DirectorioService, DirectorioRepository],
  exports: [DirectorioService],
})
export class DirectorioModule {}