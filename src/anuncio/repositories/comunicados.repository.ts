import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/services/prisma.service.js';
import { CrearComunicadoDto } from '../dto/index.js';
import { ComunicadoOficial } from '@PrismaClient';

export interface ArchivoAdjuntoData {
  nombreOriginal: string;
  rutaArchivo: string;
  tipoMime: string;
  tamanoBytes: number;
}

@Injectable()
export class ComunicadosRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crearComunicado(
    emisorId: string,
    dto: CrearComunicadoDto,
    adjuntos: ArchivoAdjuntoData[],
  ): Promise<ComunicadoOficial & { adjuntos: ArchivoAdjuntoData[] }> {
    return this.prisma.$transaction(async (tx) => {
      return tx.comunicadoOficial.create({
        data: {
          titulo: dto.titulo.trim(),
          cuerpo: dto.cuerpo.trim(),
          categoria: dto.categoria,
          prioridad: dto.prioridad,
          audienciaTipo: dto.audienciaTipo,
          audienciaTarget: dto.audienciaTarget?.trim() || null,
          emisorId,
          adjuntos: {
            create: adjuntos.map((file) => ({
              nombreOriginal: file.nombreOriginal,
              rutaArchivo: file.rutaArchivo,
              tipoMime: file.tipoMime,
              tamanoBytes: file.tamanoBytes,
            })),
          },
        },
        include: {
          adjuntos: true,
        },
      });
    });
  }

  async obtenerUbicacionUsuario(userId: string, unitId?: string | null) {
    if (unitId) {
      return this.prisma.unit.findUnique({
        where: { id: unitId },
        select: { tower: true, code: true, description: true },
      });
    }

    const usuario = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        unit: {
          select: { tower: true, code: true, description: true },
        },
      },
    });

    return usuario?.unit ?? null;
  }

  async obtenerMuroResidente(
    residenteId: string,
    ubicacion?: { tower: string; code: string; description: string } | null,
  ) {
    const condicionesAudiencia: any[] = [
      { audienciaTipo: 'TODO_EL_CONDOMINIO' },
    ];

    if (ubicacion?.tower) {
      condicionesAudiencia.push({
        audienciaTipo: 'POR_TORRE',
        audienciaTarget: { equals: ubicacion.tower.trim(), mode: 'insensitive' },
      });
    }

    if (ubicacion?.description || ubicacion?.code) {
      condicionesAudiencia.push({
        audienciaTipo: 'POR_SECCION',
        OR: [
          { audienciaTarget: { equals: ubicacion.description.trim(), mode: 'insensitive' } },
          { audienciaTarget: { equals: ubicacion.code.trim(), mode: 'insensitive' } },
        ],
      });
    }

    return this.prisma.comunicadoOficial.findMany({
      where: {
        OR: condicionesAudiencia,
      },
      orderBy: {
        fechaPublicacion: 'desc',
      },
      include: {
        adjuntos: true,
        lecturas: {
          where: { residenteId },
          select: { fechaLectura: true },
        },
      },
    });
  }

  async obtenerPorId(id: number, residenteId: string) {
    return this.prisma.comunicadoOficial.findUnique({
      where: { id },
      include: {
        adjuntos: true,
        lecturas: {
          where: { residenteId },
          select: { fechaLectura: true },
        },
      },
    });
  }

  async registrarLectura(comunicadoId: number, residenteId: string) {
    return this.prisma.lecturaComunicado.upsert({
      where: {
        comunicadoId_residenteId: {
          comunicadoId,
          residenteId,
        },
      },
      update: {},
      create: {
        comunicadoId,
        residenteId,
      },
    });
  }
}