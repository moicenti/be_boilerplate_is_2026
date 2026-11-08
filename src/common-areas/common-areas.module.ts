import { Module } from '@nestjs/common';
import { CommonAreaBlocksController, CommonAreasController } from './controllers/index.js';
import { CommonAreaBlocksService, CommonAreasService } from './services/index.js';
import { CommonAreaBlockRepository, CommonAreaRepository } from './repositories/index.js';

@Module({
  controllers: [CommonAreasController, CommonAreaBlocksController],
  providers: [
    CommonAreasService,
    CommonAreaBlocksService,
    CommonAreaRepository,
    CommonAreaBlockRepository,
  ],
})
export class CommonAreasModule {}
