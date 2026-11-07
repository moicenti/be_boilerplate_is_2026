import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services';
import { Prisma } from '@PrismaClient';

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
}
