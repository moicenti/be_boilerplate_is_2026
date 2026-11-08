import { Module } from '@nestjs/common';
import { CommonAreasController } from './controllers/index.js';
import { CommonAreasService } from './services/index.js';
import { CommonAreaRepository } from './repositories/index.js';

@Module({
  controllers: [CommonAreasController],
  providers: [CommonAreasService, CommonAreaRepository],
})
export class CommonAreasModule {}
