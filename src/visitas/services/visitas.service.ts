import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@Prisma/services';
import { VisitaRepository } from '../repositories/index.js';
import { PreautorizacionRepository } from '../repositories/index.js';
import { RegistrarEntradaDto } from '../dto/index.js';

@Injectable()
export class VisitaService {
  constructor(
    private readonly visitaRepo: VisitaRepository,
    private readonly preRepo: PreautorizacionRepository,
    private readonly prisma: PrismaService,
  ) {}

  async registrarEntrada(
    user: { id: string },
    dto: RegistrarEntradaDto,
  ) {
    let unidadId: string;
    let nombreVisitante: string;
    let documento: string;
    let acompanantes: number;
    let motivo: string | null = null;
    let estado: 'DENTRO' | 'DENTRO_SIN_AUTORIZACION';
    let preautorizacionId: string | null = null;

    if (dto.preautorizacionId) {
      const pre = await this.preRepo.findById(dto.preautorizacionId);
      if (!pre) throw new NotFoundException('Pre-autorización no encontrada');

      if (pre.estado === 'USADA') {
        throw new BadRequestException('La pre-autorización ya fue usada.');
      }
      if (pre.estado === 'CANCELADA') {
        throw new BadRequestException('La pre-autorización está cancelada.');
      }
      if (pre.estado === 'EXPIRADA') {
        throw new BadRequestException('La pre-autorización está expirada.');
      }
      if (new Date(pre.fin) < new Date()) {
        throw new BadRequestException('La pre-autorización ya expiró por fecha.');
      }

      const activa = await this.visitaRepo.findActivaByDocumento(pre.documento);
      if (activa) {
        throw new BadRequestException('Ya hay una visita activa con ese documento.');
      }

      unidadId = pre.unidadId;
      nombreVisitante = pre.nombreVisitante;
      documento = pre.documento;
      acompanantes = pre.acompanantes;
      preautorizacionId = pre.id;
      estado = 'DENTRO';
    } else {
      if (!dto.nombreVisitante || !dto.documento || !dto.unidadCode || !dto.motivo) {
        throw new BadRequestException(
          'Sin pre-autorización, se requieren: nombreVisitante, documento, unidadCode y motivo.',
        );
      }

      const motivoTrim = dto.motivo.trim();
      if (motivoTrim.length < 10 || motivoTrim.length > 200) {
        throw new BadRequestException(
          'El motivo debe tener entre 10 y 200 caracteres.',
        );
      }

      const activa = await this.visitaRepo.findActivaByDocumento(dto.documento);
      if (activa) {
        throw new BadRequestException('Ya hay una visita activa con ese documento.');
      }

      const unidad = await this.prisma.unit.findUnique({
        where: { code: dto.unidadCode },
      });
      if (!unidad) {
        throw new BadRequestException('Unidad no encontrada');
      }

      unidadId = unidad.id;
      nombreVisitante = dto.nombreVisitante;
      documento = dto.documento;
      acompanantes = dto.acompanantes ?? 0;
      motivo = motivoTrim;
      estado = 'DENTRO_SIN_AUTORIZACION';
    }

    const visita = await this.visitaRepo.createEntrada({
      nombreVisitante,
      documento,
      acompanantes,
      motivo,
      estado,
      unidadId,
      preautorizacionId,
      registradoPorId: user.id,
    });

    if (preautorizacionId) {
      await this.preRepo.markAsUsada(preautorizacionId);
    }

    return visita;
  }

  async registrarSalida(user: { id: string }, visitaId: string) {
    const visita = await this.visitaRepo.findActivaById(visitaId);
    if (!visita) {
      throw new NotFoundException('Visita activa no encontrada.');
    }
    if (visita.estado === 'SALIO') {
      throw new BadRequestException('La visita ya tiene salida registrada.');
    }

    return this.visitaRepo.registrarSalida(visitaId, user.id);
  }

  async findActivas() {
  const visitas = await this.visitaRepo.findAllActivas();

  return {
    total: visitas.length,
    visitas: visitas.map((v) => ({
      id: v.id,
      nombreVisitante: v.nombreVisitante,
      documento: v.documento,
      acompanantes: v.acompanantes,
      estado: v.estado,
      entrada: v.entrada,
      salidaEsperada: v.preautorizacion?.fin ?? null,
      motivo: v.motivo,
      unidad: v.unidad
        ? {
            id: v.unidad.id,
            code: v.unidad.code,
            tower: v.unidad.tower,
            label: `${v.unidad.tower} · ${v.unidad.code}`,
          }
        : null,
      preautorizacion: v.preautorizacion
        ? {
            id: v.preautorizacion.id,
            codigo: v.preautorizacion.codigo,
            estado: v.preautorizacion.estado,
            fin: v.preautorizacion.fin,
          }
        : null,
      registradoPor: v.registradoPor
        ? { id: v.registradoPor.id, email: v.registradoPor.email }
        : null,
    })),
  };
}

async countActivas() {
  const total = await this.visitaRepo.countActivas();
  return { total };
}

}