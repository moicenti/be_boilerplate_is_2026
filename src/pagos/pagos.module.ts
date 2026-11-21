import { Module } from '@nestjs/common';
import { UnidadesModule } from '@Unidades';
import {
  AccountStatementController,
  DelinquencyController,
  PaymentsController,
} from './controllers/index.js';
import {
  DelinquencyService,
  PaymentsService,
  SimulatedCardGateway,
} from './services/index.js';
import {
  DelinquencyRepository,
  PaymentRepository,
} from './repositories/index.js';

/** H1: estado de cuenta y pago de cuotas. H2: unidades en mora. */
@Module({
  imports: [UnidadesModule],
  // DelinquencyController antes que AccountStatementController: /unidades/mora es una ruta fija.
  controllers: [
    DelinquencyController,
    AccountStatementController,
    PaymentsController,
  ],
  providers: [
    PaymentsService,
    SimulatedCardGateway,
    PaymentRepository,
    DelinquencyService,
    DelinquencyRepository,
  ],
})
export class PagosModule {}
