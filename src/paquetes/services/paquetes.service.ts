import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { randomInt, timingSafeEqual } from 'node:crypto';
import {
  PackageRepository,
  type PackageWithRelations,
} from '@Paquetes/repositories';
import { UnidadesService } from '@Unidades/services';
import type { CreatePackageDto, DeliverPackageDto } from '@Paquetes/dto';
import { PackageStatus, type User } from '@PrismaClient';

const PICKUP_CODE_LENGTH = 6;
const TIME_ZONE = 'America/El_Salvador';

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

  async deliver(
    id: string,
    dto: DeliverPackageDto,
    deliveredBy: User,
  ): Promise<PackageWithRelations> {
    const pkg = await this.findOrFail(id);

    if (pkg.status === PackageStatus.ENTREGADO) {
      throw this.alreadyDelivered(pkg);
    }

    if (!this.pickupCodeMatches(pkg.pickupCode, dto.pickupCode)) {
      throw new UnprocessableEntityException(
        'El código de retiro no corresponde a este paquete.',
      );
    }

    const delivered = await this.packageRepository.markDeliveredIfPending(id, {
      deliveredTo: dto.deliveredTo,
      deliveredById: deliveredBy.id,
      deliveredAt: new Date(),
    });

    const updated = await this.findOrFail(id);
    if (!delivered) {
      throw this.alreadyDelivered(updated);
    }
    return updated;
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

  private async findOrFail(id: string): Promise<PackageWithRelations> {
    const pkg = await this.packageRepository.findById(id);
    if (!pkg) {
      throw new NotFoundException('El paquete no existe.');
    }
    return pkg;
  }

  private pickupCodeMatches(expected: string, received: string): boolean {
    const a = Buffer.from(expected);
    const b = Buffer.from(received);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  private alreadyDelivered(pkg: PackageWithRelations): ConflictException {
    const when = pkg.deliveredAt
      ? new Intl.DateTimeFormat('es-SV', {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: TIME_ZONE,
        }).format(pkg.deliveredAt)
      : 'fecha desconocida';

    return new ConflictException({
      message: `Este paquete ya fue entregado el ${when} a ${pkg.deliveredTo}.`,
      error: 'Conflict',
      statusCode: 409,
      deliveredAt: pkg.deliveredAt,
      deliveredTo: pkg.deliveredTo,
    });
  }
}
