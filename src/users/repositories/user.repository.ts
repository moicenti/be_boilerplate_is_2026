import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services';
import { EmailAlreadyTakenError, UnitNotFoundError } from '@Users/errors';
import { Prisma, type Role, type User } from '@PrismaClient';

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';
const FOREIGN_KEY_VIOLATION = 'P2003';

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