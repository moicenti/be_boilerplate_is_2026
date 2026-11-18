import { Injectable } from '@nestjs/common';
import { UnitRepository } from '@Unidades/repositories';
import type { Unit } from '@PrismaClient';

@Injectable()
export class UnidadesService {
  constructor(private readonly unitRepository: UnitRepository) {}

  findAll(): Promise<Unit[]> {
    return this.unitRepository.findAll();
  }

  findById(id: string): Promise<Unit | null> {
    return this.unitRepository.findById(id);
  }
}
