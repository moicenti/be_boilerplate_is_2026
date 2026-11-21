import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services';
import { CreatePreautorizacionDto } from '@Visitas/dto/';

@Injectable()
export class PreautorizacionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    residenteId: string,
    unidadId: string,
    codigo: string,
    data: CreatePreautorizacionDto,
  ) {
    return this.prisma.preAutorizacion.create({
      data: {
        codigo,
        nombreVisitante: data.nombreVisitante,
        documento: data.documento,
        motivo: data.motivo ?? null,
        acompanantes: data.acompanantes,
        inicio: new Date(data.inicio),
        fin: new Date(data.fin),
        estado: 'VIGENTE',
        residenteId,
        unidadId,
      },
    });
  }

  async findAllByResidente(residenteId: string) {
    return this.prisma.preAutorizacion.findMany({
      where: { residenteId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByIdAndResidente(id: string, residenteId: string) {
    return this.prisma.preAutorizacion.findFirst({
      where: { id, residenteId },
    });
  }

  async findByCodigo(codigo: string) {
    return this.prisma.preAutorizacion.findUnique({
      where: { codigo },
    });
  }

  async findById(id: string) {
  return this.prisma.preAutorizacion.findUnique({ where: { id } });
}

async markAsUsada(id: string) {
  return this.prisma.preAutorizacion.update({
    where: { id },
    data: { estado: 'USADA' },
  });
}

async buscar(query: string) {
  return this.prisma.preAutorizacion.findMany({
    where: {
      estado: 'VIGENTE',
      OR: [
        { codigo: query.toUpperCase() },
        { documento: query },
        { nombreVisitante: { contains: query, mode: 'insensitive' } },
      ],
    },
    take: 20,
  });
}

}