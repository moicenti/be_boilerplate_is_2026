import { Module } from '@nestjs/common';
import { CommonAreasModule } from '@CommonAreas';
import { ReservationsController } from './controllers/index.js';
import { ReservationsService } from './services/index.js';
import { ReservationRepository } from './repositories/index.js';

@Module({
  imports: [CommonAreasModule],
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationRepository],
})
export class ReservasModule {}
