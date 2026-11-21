import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services';
import { EmailAlreadyTakenError, UnitNotFoundError } from '@Users/errors';
import {
  EstadoPreAutorizacion,
  Prisma,
  ReservationStatus,
  Role,
  type User,
} from '@PrismaClient';

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';
const FOREIGN_KEY_VIOLATION = 'P2003';

export interface ListUsersFilters {
  role?: Role;
  isActive?: boolean;
}

export interface CreateUserData {
  email: string;
  passwordHash: string;
  role: Role;
  unitId: string | null;
}

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create({ email, passwordHash, role, unitId }: CreateUserData): Promise<User> {
    try {
      return await this.prisma.user.create({
        data: { email: this.normalizeEmail(email), passwordHash, role, unitId },
        include: { unit: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === UNIQUE_CONSTRAINT_VIOLATION) {
          throw new EmailAlreadyTakenError(email);
        }
        if (error.code === FOREIGN_KEY_VIOLATION && unitId) {
          throw new UnitNotFoundError(unitId);
        }
      }
      throw error;
    }
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { unit: true },
    });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: this.normalizeEmail(email) },
      include: { unit: true },
    });
  }

  existsByEmail(email: string): Promise<boolean> {
    return this.prisma.user
      .count({ where: { email: this.normalizeEmail(email) } })
      .then((count) => count > 0);
  }

  updatePasswordHash(id: string, passwordHash: string): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: { passwordHash } });
  }

  /** Cuentas que gestiona el administrador: residentes y seguridad. */
  findManageable({ role, isActive }: ListUsersFilters): Promise<User[]> {
    return this.prisma.user.findMany({
      where: {
        role: role ?? { in: [Role.RESIDENTE, Role.SEGURIDAD] },
        ...(isActive !== undefined && { isActive }),
      },
      include: { unit: true },
      orderBy: { email: 'asc' },
    });
  }

  /**
   * Desactiva la cuenta y limpia lo que cuelga de ella, todo o nada.
   * Devuelve null si ya estaba inactiva (o si otra request se adelantó).
   */
  async deactivate(id: string, now: Date): Promise<User | null> {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.user.findUnique({ where: { id } });
      const { count } = await tx.user.updateMany({
        where: { id, isActive: true },
        data: { isActive: false, unitId: null },
      });
      if (!current || count === 0) return null;

      await tx.refreshToken.deleteMany({ where: { userId: id } });
      // Libera los horarios que tenía apartados.
      await tx.reservation.updateMany({
        where: { residentId: id, status: ReservationStatus.CONFIRMADA, endsAt: { gt: now } },
        data: { status: ReservationStatus.CANCELADA },
      });
      await tx.preAutorizacion.updateMany({
        where: { residenteId: id, estado: EstadoPreAutorizacion.VIGENTE },
        data: { estado: EstadoPreAutorizacion.CANCELADA },
      });

      if (current.unitId) {
        const remaining = await tx.user.count({
          where: { unitId: current.unitId, role: Role.RESIDENTE, isActive: true },
        });
        if (remaining === 0) {
          await tx.unit.update({
            where: { id: current.unitId },
            data: { historyStartsAt: now },
          });
        }
      }

      return tx.user.findUniqueOrThrow({ where: { id }, include: { unit: true } });
    });
  }

  setActive(id: string, isActive: boolean): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: { isActive } });
  }

  deleteById(id: string): Promise<User> {
    return this.prisma.user.delete({ where: { id } });
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}