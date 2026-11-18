import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services';
import type { RegistrarEntradaDto } from '../dto/index.js';

@Injectable()
export class VisitaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActivaByDocumento(documento: string) {
    return this.prisma.visitaActiva.findFirst({
      where: {
        documento,
        estado: { in: ['DENTRO', 'DENTRO_SIN_AUTORIZACION'] },
      },
    });
  }

  async findActivaById(id: string) {
    return this.prisma.visitaActiva.findUnique({ where: { id } });
  }

  async findAllActivas() {
    return this.prisma.visitaActiva.findMany({
      where: { estado: { in: ['DENTRO', 'DENTRO_SIN_AUTORIZACION'] } },
      include: { unidad: true, preautorizacion: true },
      orderBy: { entrada: 'desc' },
    });
  }

  async createEntrada(data: {
    nombreVisitante: string;
    documento: string;
    acompanantes: number;
    motivo: string | null;
    estado: 'DENTRO' | 'DENTRO_SIN_AUTORIZACION';
    unidadId: string;
    preautorizacionId: string | null;
    registradoPorId: string;
  }) {
    return this.prisma.visitaActiva.create({
      data: {
        nombreVisitante: data.nombreVisitante,
        documento: data.documento,
        acompanantes: data.acompanantes,
        motivo: data.motivo,
        estado: data.estado,
        unidadId: data.unidadId,
        preautorizacionId: data.preautorizacionId,
        registradoPorId: data.registradoPorId,
      },
      include: { unidad: true, preautorizacion: true },
    });
  }

  async registrarSalida(id: string, registradoPorId: string) {
    return this.prisma.visitaActiva.update({
      where: { id },
      data: {
        salida: new Date(),
        estado: 'SALIO',
        salidaRegistradaPorId: registradoPorId,
      },
    });
  }
}