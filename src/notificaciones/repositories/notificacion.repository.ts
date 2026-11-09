import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services';

export const MAX_INTENTOS = 3;

export interface NuevaNotificacion {
  residenteId: string;
  unidadId: string | null;
}

export interface BaseNotificacion {
  tipo: string;
  titulo: string;
  mensaje: string;
  moduloOrigen: string;
  enlaceAccion: string | null;
  forzada: boolean;
}

@Injectable()
export class NotificacionRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Crea el lote y una notificación por destinatario, todo en una transacción. */
  async crearLote(
    lote: { moduloOrigen: string; emitidoPorId: string | null },
    base: BaseNotificacion,
    destinos: NuevaNotificacion[],
  ): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      const creado = await tx.loteNotificacion.create({ data: lote });
      if (destinos.length > 0) {
        await tx.notificacion.createMany({
          data: destinos.map((d) => ({ ...base, ...d, loteId: creado.id })),
        });
      }
      return creado.id;
    });
  }

  porLote(loteId: number) {
    return this.prisma.notificacion.findMany({
      where: { loteId, estado: 'PENDIENTE' },
      orderBy: { id: 'asc' },
    });
  }

  /** PENDIENTE o FALLIDO. FALLIDO siempre significa "menos de 3 intentos". */
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

  /** Registra el intento fallido y actualiza el estado en una sola transacción. */
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
        data: { notificacionId: id, numeroIntento: numero, motivoFallo: motivo },
      });
      const estado =
        numero >= MAX_INTENTOS
          ? ('FALLIDO_PERMANENTE' as const)
          : ('FALLIDO' as const);
      await tx.notificacion.update({ where: { id }, data: { estado } });
      return estado;
    });
  }
}
