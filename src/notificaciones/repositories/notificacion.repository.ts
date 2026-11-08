import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services';

export const MAX_INTENTOS = 3;

export interface NuevaNotificacion {
  residenteId: string;
  unidadId: number | null;
}

@Injectable()
export class NotificacionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crearLote(
    lote: { moduloOrigen: string; emitidoPorId: string | null },
    base: {
      tipo: string;
      titulo: string;
      mensaje: string;
      moduloOrigen: string;
      enlaceAccion: string | null;
      forzada: boolean;
    },
    destinos: NuevaNotificacion[],
  ): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      const l = await tx.loteNotificacion.create({ data: lote });
      if (destinos.length > 0) {
        await tx.notificacion.createMany({
          data: destinos.map((d) => ({ ...base, ...d, loteId: l.id })),
        });
      }
      return l.id;
    });
  }

  porLote(loteId: number) {
    return this.prisma.notificacion.findMany({
      where: { loteId, estado: 'PENDIENTE' },
    });
  }

  reintentables() {
    return this.prisma.notificacion.findMany({
      where: { estado: { in: ['PENDIENTE', 'FALLIDO'] } },
      orderBy: { id: 'asc' },
    });
  }

  marcarEnviada(id: number) {
    return this.prisma.notificacion.update({
      where: { id },
      data: { estado: 'ENVIADA' },
    });
  }


  async registrarFallo(
    id: number,
    motivo: string,
  ): Promise<'FALLIDO' | 'FALLIDO_PERMANENTE'> {
    return this.prisma.$transaction(async (tx) => {
      const previos = await tx.intentoEnvio.count({
        where: { notificacionId: id },
      });
      const numero = previos + 1;
      await tx.intentoEnvio.create({
        data: {
          notificacionId: id,
          numeroIntento: numero,
          motivoFallo: motivo,
        },
      });
      const estado = numero >= MAX_INTENTOS ? 'FALLIDO_PERMANENTE' : 'FALLIDO';
      await tx.notificacion.update({ where: { id }, data: { estado } });
      return estado;
    });
  }
}
