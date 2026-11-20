import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services';
import { Prisma, Role } from '@PrismaClient';
import { DELINQUENT_STATUSES, type UnitFeeBalance } from '../utils/index.js';

const ZERO = new Prisma.Decimal(0);

export interface DelinquentUnitInfo {
  id: string;
  code: string;
  tower: string;
  /** Correo del residente activo más antiguo de la unidad; nulo si no tiene. */
  responsible: string | null;
}

@Injectable()
export class DelinquencyRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cuotas PENDIENTE o PARCIAL que vencieron antes de `today`, con lo pagado de cada una.
   * Usa el índice cuota(estado, fecha_vencimiento).
   */
  async findOverdueFees(
    today: string,
    tower?: string,
  ): Promise<UnitFeeBalance[]> {
    const fees = await this.prisma.fee.findMany({
      where: {
        status: { in: DELINQUENT_STATUSES },
        dueDate: { lt: new Date(`${today}T00:00:00Z`) },
        ...(tower && {
          unit: { tower: { equals: tower, mode: 'insensitive' } },
        }),
      },
      select: {
        unitId: true,
        status: true,
        dueDate: true,
        amount: true,
        allocations: { select: { amount: true } },
      },
    });
    return fees.map(({ allocations, ...fee }) => ({
      ...fee,
      paid: allocations.reduce((sum, a) => sum.plus(a.amount), ZERO),
    }));
  }

  async findUnitsInfo(ids: string[]): Promise<DelinquentUnitInfo[]> {
    if (ids.length === 0) return [];
    const units = await this.prisma.unit.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        code: true,
        tower: true,
        users: {
          where: { role: Role.RESIDENTE, isActive: true },
          select: { email: true },
          orderBy: [{ createdAt: 'asc' }, { email: 'asc' }],
          take: 1,
        },
      },
    });
    return units.map(({ users, ...unit }) => ({
      ...unit,
      responsible: users[0]?.email ?? null,
    }));
  }
}
