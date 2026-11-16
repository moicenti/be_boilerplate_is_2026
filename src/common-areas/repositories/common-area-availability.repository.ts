import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services';
import type { ReservationStatus } from '@PrismaClient';

/**
 * Consultas de solo lectura para la disponibilidad (H4). Cada método resuelve todas las
 * áreas en una sola query, en vez de una por área.
 *
 * Dos intervalos se cruzan cuando inicio < fin del otro y fin > inicio del otro: uno que
 * termina justo cuando empieza el consultado no genera conflicto.
 */
@Injectable()
export class CommonAreaAvailabilityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAreaIdsWithOverlappingBlocks(
    areaIds: number[],
    startsAt: Date,
    endsAt: Date,
  ): Promise<Set<number>> {
    const rows = await this.prisma.commonAreaBlock.findMany({
      where: { areaId: { in: areaIds }, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
      select: { areaId: true },
      distinct: ['areaId'],
    });
    return new Set(rows.map((row) => row.areaId));
  }

  async findAreaIdsWithOverlappingReservations(
    areaIds: number[],
    statuses: readonly ReservationStatus[],
    startsAt: Date,
    endsAt: Date,
  ): Promise<Set<number>> {
    const rows = await this.prisma.reservation.findMany({
      where: {
        areaId: { in: areaIds },
        status: { in: [...statuses] },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
      select: { areaId: true },
      distinct: ['areaId'],
    });
    return new Set(rows.map((row) => row.areaId));
  }
}
