import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services';
import { PackageStatus, Prisma } from '@PrismaClient';

const packageInclude = {
  unit: true,
  receivedBy: true,
  deliveredBy: true,
} satisfies Prisma.PackageInclude;

export type PackageWithRelations = Prisma.PackageGetPayload<{
  include: typeof packageInclude;
}>;

export interface CreatePackageData {
  number: number;
  folio: string;
  pickupCode: string;
  unitId: string;
  receivedById: string;
  recipientName: string;
  carrier: string;
  trackingReference: string;
  description: string;
  notes?: string | null;
}

export interface DeliveryData {
  deliveredTo: string;
  deliveredById: string;
  deliveredAt: Date;
}

@Injectable()
export class PackageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async nextNumber(): Promise<number> {
    const [row] = await this.prisma.$queryRaw<{ value: bigint }[]>`
      SELECT nextval(pg_get_serial_sequence('packages', 'number')) AS value
    `;
    return Number(row.value);
  }

  create(data: CreatePackageData): Promise<PackageWithRelations> {
    return this.prisma.package.create({
      data: { ...data, notes: data.notes || null },
      include: packageInclude,
    });
  }

  findById(id: string): Promise<PackageWithRelations | null> {
    return this.prisma.package.findUnique({
      where: { id },
      include: packageInclude,
    });
  }

  async markDeliveredIfPending(
    id: string,
    data: DeliveryData,
  ): Promise<boolean> {
    const { count } = await this.prisma.package.updateMany({
      where: { id, status: PackageStatus.PENDIENTE_RETIRO },
      data: { ...data, status: PackageStatus.ENTREGADO },
    });
    return count === 1;
  }
}
