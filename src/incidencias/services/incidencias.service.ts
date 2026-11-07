import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IncidenciaRepository } from '../repositories/index.js';
import { CreateIncidenciaDto } from '../dto/index.js';

@Injectable()
export class IncidenciasService {
  constructor(private readonly incidenciaRepository: IncidenciaRepository) {}

  async create(
  user: { id: string; unit?: string | null },
  data: CreateIncidenciaDto,
  photoUrls: string[],
) {
  if (!user.unit) {
    throw new BadRequestException(
      'Tu usuario no tiene una unidad asignada. Contacta a la administración.',
    );
  }

  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const folio = `INC-${year}-${randomNum}`;

  return this.incidenciaRepository.create(user.id, user.unit, folio, data, photoUrls);
}
    async findAll(userId: string) {
    return this.incidenciaRepository.findAllByUser(userId);
  }

  async findOne(id: string, userId: string) {
    const report = await this.incidenciaRepository.findOneByIdAndUser(id, userId);
    if (!report) {
      throw new NotFoundException('Reporte no encontrado o no tienes permiso para verlo');
    }
    return report;
  }
 
}