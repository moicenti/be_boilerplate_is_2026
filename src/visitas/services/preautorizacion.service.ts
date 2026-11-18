import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PreautorizacionRepository } from '../repositories/index.js';
import { CreatePreautorizacionDto } from '@Visitas/dto/';
import type { Unit } from '@PrismaClient';

const MAX_VIGENCIA_HORAS = 24;
const MAX_ACOMPANANTES = 5;

function generarCodigo(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

@Injectable()
export class PreautorizacionService {
  constructor(private readonly repo: PreautorizacionRepository) {}

  async create(
    user: { id: string; unitId?: string | null; unit?: Unit | null },
    data: CreatePreautorizacionDto,
  ) {
    if (!user.unitId) {
      throw new BadRequestException(
        'Tu usuario no tiene una unidad asignada. Contacta a la administración.',
      );
    }

    const inicio = new Date(data.inicio);
    const fin = new Date(data.fin);
    const ahora = new Date();

    if (inicio < ahora) {
      throw new BadRequestException('La fecha de inicio no puede ser anterior a la actual.');
    }

    if (fin <= inicio) {
      throw new BadRequestException('La fecha de fin debe ser posterior al inicio.');
    }

    const diffHoras = (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60);
    if (diffHoras > MAX_VIGENCIA_HORAS) {
      throw new BadRequestException(
        `La vigencia no puede superar las ${MAX_VIGENCIA_HORAS} horas.`,
      );
    }

    if (data.acompanantes < 0 || data.acompanantes > MAX_ACOMPANANTES) {
      throw new BadRequestException(
        `Los acompañantes deben estar entre 0 y ${MAX_ACOMPANANTES}.`,
      );
    }

    let codigo = generarCodigo();
    for (let i = 0; i < 5; i++) {
      const existente = await this.repo.findByCodigo(codigo);
      if (!existente) break;
      codigo = generarCodigo();
    }

    return this.repo.create(user.id, user.unitId, codigo, data);
  }

  async findAll(userId: string) {
    return this.repo.findAllByResidente(userId);
  }

  async findOne(id: string, userId: string) {
    const pre = await this.repo.findByIdAndResidente(id, userId);
    if (!pre) {
      throw new NotFoundException('Pre-autorización no encontrada');
    }
    return pre;
  }
}