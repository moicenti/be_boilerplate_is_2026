import { Module } from '@nestjs/common';
import { FeeRulesController } from './controllers/index.js';
import {
  FeeGenerationScheduler,
  FeeGenerationService,
  FeeRulesService,
} from './services/index.js';
import {
  FeeGenerationRepository,
  FeeRuleRepository,
} from './repositories/index.js';

@Module({
  controllers: [FeeRulesController],
  providers: [
    FeeRulesService,
    FeeGenerationService,
    FeeGenerationScheduler,
    FeeRuleRepository,
    FeeGenerationRepository,
  ],
  // H34 (generación manual) reutiliza el motor.
  exports: [FeeGenerationService],
})
export class CuotasModule {}
