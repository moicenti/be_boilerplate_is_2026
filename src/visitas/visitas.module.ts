import { Module } from '@nestjs/common';
import { PreautorizacionController } from './controllers/index.js';
import { PreautorizacionService } from './services/index.js';
import { PreautorizacionRepository } from './repositories/index.js';

@Module({
  controllers: [PreautorizacionController],
  providers: [PreautorizacionService, PreautorizacionRepository],
})
export class VisitasModule {}