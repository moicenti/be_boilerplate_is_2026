import { Injectable, NotFoundException } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import {
  PackageRepository,
  type PackageWithRelations,
} from '@Paquetes/repositories';
import { UnidadesService } from '@Unidades/services';
import type { CreatePackageDto } from '@Paquetes/dto';
import type { User } from '@PrismaClient';

const PICKUP_CODE_LENGTH = 6;

@Injectable()
export class PaquetesService {
  constructor(
    private readonly packageRepository: PackageRepository,
    private readonly unidadesService: UnidadesService,
  ) {}

  async register(
    dto: CreatePackageDto,
    receivedBy: User,
  ): Promise<PackageWithRelations> {
    const unit = await this.unidadesService.findById(dto.unitId);
    if (!unit) {
      throw new NotFoundException(
        'La unidad indicada no existe en el condominio.',
      );
    }

    const number = await this.packageRepository.nextNumber();

    return this.packageRepository.create({
      number,
      folio: this.buildFolio(number, new Date()),
      pickupCode: this.generatePickupCode(),
      unitId: unit.id,
      receivedById: receivedBy.id,
      recipientName: dto.recipientName,
      carrier: dto.carrier,
      trackingReference: dto.trackingReference,
      description: dto.description,
      notes: dto.notes,
    });
  }

  buildFolio(number: number, date: Date): string {
    return `PAQ-${date.getFullYear()}-${String(number).padStart(4, '0')}`;
  }

  generatePickupCode(): string {
    return String(randomInt(0, 10 ** PICKUP_CODE_LENGTH)).padStart(
      PICKUP_CODE_LENGTH,
      '0',
    );
  }
}
