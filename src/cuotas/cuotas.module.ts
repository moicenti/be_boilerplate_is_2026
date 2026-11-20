import { Module } from '@nestjs/common';
import {
  FeeGenerationController,
  FeeRulesController,
} from './controllers/index.js';
import {
  FeeGenerationScheduler,
  FeeGenerationService,
  FeeRulesService,
  ManualFeeGenerationService,
} from './services/index.js';
import {
  FeeGenerationRepository,
  FeeRuleRepository,
} from './repositories/index.js';

@Module({
  controllers: [FeeRulesController, FeeGenerationController],
  providers: [
    FeeRulesService,
    ManualFeeGenerationService,
    FeeGenerationService,
    FeeGenerationScheduler,
    FeeRuleRepository,
    FeeGenerationRepository,
  ],
  exports: [FeeGenerationService],
})
export class CuotasModule {}
