import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services';
import {
  CommonAreaStatus,
  Prisma,
  type CommonAreaChangeField,
  type ReservationStatus,
} from '@PrismaClient';
import { CommonAreaNameTakenError } from '../errors/index.js';

/** Código de Prisma para violación de restricción única. */
const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

const WITH_SCHEDULES = {
  schedules: { orderBy: { dayOfWeek: 'asc' } },
} satisfies Prisma.CommonAreaInclude;

export type CommonAreaWithSchedules = Prisma.CommonAreaGetPayload<{
  include: typeof WITH_SCHEDULES;
}>;

export interface ScheduleData {
  dayOfWeek: number;
  opensAt: Date;
  closesAt: Date;
}

export interface SaveCommonAreaData {
  name: string;
  capacity: number;
  schedules: ScheduleData[];
}

export interface CommonAreaChangeData {
  field: CommonAreaChangeField;
  previousValue: Prisma.InputJsonValue;
  newValue: Prisma.InputJsonValue;
}

@Injectable()
export class CommonAreaRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllActive(): Promise<CommonAreaWithSchedules[]> {
    return this.prisma.commonArea.findMany({
      where: { status: CommonAreaStatus.ACTIVA },
      include: WITH_SCHEDULES,
      orderBy: { name: 'asc' },
    });
  }

  findActiveById(id: number): Promise<CommonAreaWithSchedules | null> {
    return this.prisma.commonArea.findFirst({
      where: { id, status: CommonAreaStatus.ACTIVA },
      include: WITH_SCHEDULES,
    });
  }

  existsActiveByName(name: string, excludeId?: number): Promise<boolean> {
    return this.prisma.commonArea
      .count({
        where: {
          status: CommonAreaStatus.ACTIVA,
          name: { equals: name, mode: 'insensitive' },
          ...(excludeId !== undefined ? { id: { not: excludeId } } : {}),
        },
      })
      .then((count) => count > 0);
  }

  async create({ name, capacity, schedules }: SaveCommonAreaData): Promise<CommonAreaWithSchedules> {
    try {
      return await this.prisma.commonArea.create({
        data: { name, capacity, schedules: { create: schedules } },
        include: WITH_SCHEDULES,
      });
    } catch (error) {
      throw this.translateError(error, name);
    }
  }

  async update(
    id: number,
    { name, capacity, schedules }: SaveCommonAreaData,
    changes: CommonAreaChangeData[],
    changedById: string,
  ): Promise<CommonAreaWithSchedules> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.commonAreaSchedule.deleteMany({ where: { areaId: id } });
        if (changes.length > 0) {
          await tx.commonAreaChange.createMany({
            data: changes.map((change) => ({ ...change, areaId: id, changedById })),
          });
        }
        return tx.commonArea.update({
          where: { id },
          data: { name, capacity, schedules: { create: schedules } },
          include: WITH_SCHEDULES,
        });
      });
    } catch (error) {
      throw this.translateError(error, name);
    }
  }

  countUpcomingReservations(
    areaId: number,
    statuses: readonly ReservationStatus[],
    now: Date,
  ): Promise<number> {
    return this.prisma.reservation.count({
      where: { areaId, status: { in: [...statuses] }, endsAt: { gt: now } },
    });
  }

  async softDelete(id: number, deletedById: string, deletedAt: Date): Promise<void> {
    await this.prisma.commonArea.update({
      where: { id },
      data: { status: CommonAreaStatus.ELIMINADA, deletedAt, deletedById },
    });
  }

  private translateError(error: unknown, name: string): unknown {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === UNIQUE_CONSTRAINT_VIOLATION
    ) {
      return new CommonAreaNameTakenError(name);
    }
    return error;
  }
}
