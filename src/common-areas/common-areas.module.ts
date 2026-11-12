import { Module } from '@nestjs/common';
import { CommonAreaBlocksController, CommonAreasController } from './controllers/index.js';
import {
  CommonAreaAvailabilityService,
  CommonAreaBlocksService,
  CommonAreasService,
} from './services/index.js';
import {
  CommonAreaAvailabilityRepository,
  CommonAreaBlockRepository,
  CommonAreaRepository,
} from './repositories/index.js';

@Module({
  controllers: [CommonAreasController, CommonAreaBlocksController],
  providers: [
    CommonAreasService,
    CommonAreaBlocksService,
    CommonAreaAvailabilityService,
    CommonAreaRepository,
    CommonAreaBlockRepository,
    CommonAreaAvailabilityRepository,
  ],
})
export class CommonAreasModule {}
