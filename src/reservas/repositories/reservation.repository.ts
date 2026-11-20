import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services';
import { ReservationStatus, type Reservation } from '@PrismaClient';
import { ReservationOverlapError } from '../errors/index.js';

const OVERLAP_CONSTRAINT = 'reserva_sin_cruce';

export interface CreateReservationData {
  areaId: number;
  residentId: string;
  unitId: string;
  startsAt: Date;
  endsAt: Date;
}

@Injectable()
export class ReservationRepository {
  constructor(private readonly prisma: PrismaService) {}

  hasOverlappingBlock(areaId: number, startsAt: Date, endsAt: Date): Promise<boolean> {
    return this.prisma.commonAreaBlock
      .count({ where: { areaId, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } } })
      .then((count) => count > 0);
  }

  findAllByUnit(unitId: string): Promise<Reservation[]> {
    return this.prisma.reservation.findMany({
      // Las reservas de cuentas desactivadas ya no se muestran.
      where: { unitId, resident: { isActive: true } },
      orderBy: { startsAt: 'desc' },
    });
  }

  findById(id: number): Promise<Reservation | null> {
    return this.prisma.reservation.findUnique({ where: { id } });
  }

  async create(data: CreateReservationData): Promise<Reservation> {
    try {
      return await this.prisma.reservation.create({
        data: { ...data, status: ReservationStatus.CONFIRMADA },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes(OVERLAP_CONSTRAINT)) {
        throw new ReservationOverlapError();
      }
      throw error;
    }
  }

  /** Cancela solo si sigue CONFIRMADA y no ha terminado; null si otra request se adelantó. */
  async cancel(id: number, now: Date): Promise<Reservation | null> {
    const { count } = await this.prisma.reservation.updateMany({
      where: { id, status: ReservationStatus.CONFIRMADA, endsAt: { gt: now } },
      data: { status: ReservationStatus.CANCELADA },
    });
    return count === 0 ? null : this.findById(id);
  }
}
