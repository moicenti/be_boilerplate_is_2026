import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services';

export interface FilaPreferencia {
  moduloOrigen: string;
  activo: boolean;
}

/** Acceso a la tabla preferencia_notificacion (creada en H23). */
@Injectable()
export class PreferenciasRepository {
  constructor(private readonly prisma: PrismaService) {}

  listar(residenteId: string): Promise<FilaPreferencia[]> {
    return this.prisma.preferenciaNotificacion.findMany({
      where: { residenteId },
      select: { moduloOrigen: true, activo: true },
    });
  }

  /**
   * Upsert por (residente_id, modulo_origen) en una sola transacción:
   * si algo falla, no se guarda nada y se conserva el estado anterior.
   * Devuelve el estado final leído dentro de la misma transacción.
   */
  guardar(
    residenteId: string,
    cambios: { modulo: string; activo: boolean }[],
  ): Promise<FilaPreferencia[]> {
    return this.prisma.$transaction(async (tx) => {
      for (const c of cambios) {
        await tx.preferenciaNotificacion.upsert({
          where: {
            residenteId_moduloOrigen: {
              residenteId,
              moduloOrigen: c.modulo,
            },
          },
          create: { residenteId, moduloOrigen: c.modulo, activo: c.activo },
          update: { activo: c.activo },
        });
      }
      return tx.preferenciaNotificacion.findMany({
        where: { residenteId },
        select: { moduloOrigen: true, activo: true },
      });
    });
  }
}
