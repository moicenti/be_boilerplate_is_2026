import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services';
import type { Unit } from '@PrismaClient';

@Injectable()
export class UnitRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Unit[]> {
    return this.prisma.unit.findMany({ orderBy: { code: 'asc' } });
  }

  findById(id: string): Promise<Unit | null> {
    return this.prisma.unit.findUnique({ where: { id } });
  }
}
