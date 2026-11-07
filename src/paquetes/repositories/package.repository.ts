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

export interface PackageFilters {
  status: PackageStatus;
  unitCode?: string;
  folio?: string;
  carrier?: string;
  search?: string;
}

export interface PendingSummary {
  pendingCount: number;
  pendingRecipientCount: number;
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

  async findPage(
    filters: PackageFilters,
    skip: number,
    take: number,
  ): Promise<{ items: PackageWithRelations[]; total: number }> {
    const where = this.buildWhere(filters);
    const orderBy: Prisma.PackageOrderByWithRelationInput =
      filters.status === PackageStatus.PENDIENTE_RETIRO
        ? { receivedAt: 'asc' }
        : { receivedAt: 'desc' };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.package.findMany({
        where,
        include: packageInclude,
        orderBy: [orderBy, { number: 'asc' }],
        skip,
        take,
      }),
      this.prisma.package.count({ where }),
    ]);
    return { items, total };
  }

  async pendingSummary(): Promise<PendingSummary> {
    const where = { status: PackageStatus.PENDIENTE_RETIRO };
    const [pendingCount, recipients] = await this.prisma.$transaction([
      this.prisma.package.count({ where }),
      this.prisma.package.findMany({
        where,
        distinct: ['unitId', 'recipientName'],
        select: { id: true },
      }),
    ]);
    return { pendingCount, pendingRecipientCount: recipients.length };
  }

  async carriers(): Promise<string[]> {
    const rows = await this.prisma.package.findMany({
      distinct: ['carrier'],
      select: { carrier: true },
      orderBy: { carrier: 'asc' },
    });
    return rows.map((row) => row.carrier);
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

  private buildWhere(filters: PackageFilters): Prisma.PackageWhereInput {
    const insensitive = Prisma.QueryMode.insensitive;
    const where: Prisma.PackageWhereInput = { status: filters.status };

    if (filters.unitCode) {
      where.unit = { code: { equals: filters.unitCode, mode: insensitive } };
    }
    if (filters.folio) {
      where.folio = { contains: filters.folio, mode: insensitive };
    }
    if (filters.carrier) {
      where.carrier = { equals: filters.carrier, mode: insensitive };
    }
    if (filters.search) {
      where.OR = [
        { folio: { contains: filters.search, mode: insensitive } },
        { recipientName: { contains: filters.search, mode: insensitive } },
        { unit: { code: { contains: filters.search, mode: insensitive } } },
      ];
    }
    return where;
  }
}
