import { Module } from '@nestjs/common';
import { UnidadesController } from '@Unidades/controllers';
import { UnidadesService } from '@Unidades/services';
import { UnitRepository } from '@Unidades/repositories';

@Module({
  controllers: [UnidadesController],
  providers: [UnidadesService, UnitRepository],
  exports: [UnidadesService],
})
export class UnidadesModule {}
