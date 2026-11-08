import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services';
import type {
  CommonAreaBlock,
  CommonAreaBlockReason,
  ReservationStatus,
} from '@PrismaClient';
import { BlockOverlapError } from '../errors/index.js';

const OVERLAP_CONSTRAINT = 'bloqueo_area_sin_superposicion';

export interface CreateBlockData {
  areaId: number;
  startsAt: Date;
  endsAt: Date;
  reason: CommonAreaBlockReason;
  createdById: string;
}

@Injectable()
export class CommonAreaBlockRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllByArea(areaId: number): Promise<CommonAreaBlock[]> {
    return this.prisma.commonAreaBlock.findMany({
      where: { areaId },
      orderBy: { startsAt: 'asc' },
    });
  }

  findByIdAndArea(id: number, areaId: number): Promise<CommonAreaBlock | null> {
    return this.prisma.commonAreaBlock.findFirst({ where: { id, areaId } });
  }

  hasOverlappingBlock(areaId: number, startsAt: Date, endsAt: Date): Promise<boolean> {
    return this.prisma.commonAreaBlock
      .count({ where: { areaId, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } } })
      .then((count) => count > 0);
  }

  countOverlappingReservations(
    areaId: number,
    statuses: readonly ReservationStatus[],
    startsAt: Date,
    endsAt: Date,
  ): Promise<number> {
    return this.prisma.reservation.count({
      where: {
        areaId,
        status: { in: [...statuses] },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
    });
  }

  async create(data: CreateBlockData): Promise<CommonAreaBlock> {
    try {
      return await this.prisma.commonAreaBlock.create({ data });
    } catch (error) {
      if (error instanceof Error && error.message.includes(OVERLAP_CONSTRAINT)) {
        throw new BlockOverlapError();
      }
      throw error;
    }
  }

  async deleteById(id: number): Promise<void> {
    await this.prisma.commonAreaBlock.delete({ where: { id } });
  }
}
