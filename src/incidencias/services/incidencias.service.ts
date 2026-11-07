import { Injectable, NotFoundException } from '@nestjs/common';
import { IncidenciaRepository } from '../repositories/index.js';
import { CreateIncidenciaDto } from '../dto/index.js';

@Injectable()
export class IncidenciasService {
  constructor(private readonly incidenciaRepository: IncidenciaRepository) {}

  async create(userId: string, data: CreateIncidenciaDto, photoUrls: string[]) {
    // Generamos un folio único. Formato: INC-YYYY-XXXX
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000); 
    const folio = `INC-${year}-${randomNum}`;

    // Nota: El userId viene del token JWT, no del body. 
    // Esto cumple la regla de que el reporte siempre queda a nombre de la unidad del usuario.
    return this.incidenciaRepository.create(userId, folio, data, photoUrls);
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