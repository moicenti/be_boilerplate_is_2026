import { Module } from '@nestjs/common';
import { UnidadesModule } from '@Unidades';
import { AccountStatementController, PaymentsController } from './controllers/index.js';
import { PaymentsService, SimulatedCardGateway } from './services/index.js';
import { PaymentRepository } from './repositories/index.js';

/** H1: estado de cuenta de una unidad y pago de cuotas. */
@Module({
  imports: [UnidadesModule],
  controllers: [AccountStatementController, PaymentsController],
  providers: [PaymentsService, SimulatedCardGateway, PaymentRepository],
})
export class PagosModule {}
