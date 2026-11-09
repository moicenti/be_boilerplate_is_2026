import { Module } from '@nestjs/common';
import { UnidadesModule } from '@Unidades';
import { PaquetesController } from '@Paquetes/controllers';
import { PaquetesService } from '@Paquetes/services';
import { PackageRepository } from '@Paquetes/repositories';

@Module({
  imports: [UnidadesModule],
  controllers: [PaquetesController],
  providers: [PaquetesService, PackageRepository],
})
export class PaquetesModule {}
