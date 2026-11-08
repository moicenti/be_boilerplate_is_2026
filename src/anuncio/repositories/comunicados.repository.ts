import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/services/prisma.service.js';
import { CrearComunicadoDto } from '../dto/index.js';
import { ComunicadoOficial } from '../../generated/prisma/index.js';

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
      const comunicado = await tx.comunicadoOficial.create({
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

      return comunicado;
    });
  }

  async existe(id: number): Promise<boolean> {
    const total = await this.prisma.comunicadoOficial.count({ where: { id } });
    return total > 0;
  }
}