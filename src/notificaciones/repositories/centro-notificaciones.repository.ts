import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services';

const CAMPOS_ITEM = {
  id: true,
  titulo: true,
  mensaje: true,
  moduloOrigen: true,
  fechaCreacion: true,
  leida: true,
  enlaceAccion: true,
} as const;

/** Acceso a datos del centro de notificaciones. Todas las consultas filtran por residente. */
@Injectable()
export class CentroNotificacionesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** De la más reciente a la más antigua. `id` desempata para que la paginación sea estable. */
  async listar(residenteId: string, skip: number, take: number) {
    const [total, items] = await this.prisma.$transaction([
      this.prisma.notificacion.count({ where: { residenteId } }),
      this.prisma.notificacion.findMany({
        where: { residenteId },
        orderBy: [{ fechaCreacion: 'desc' }, { id: 'desc' }],
        skip,
        take,
        select: CAMPOS_ITEM,
      }),
    ]);
    return { total, items };
  }

  contarNoLeidas(residenteId: string): Promise<number> {
    return this.prisma.notificacion.count({
      where: { residenteId, leida: false },
    });
  }

  /** Solo lo necesario para decidir si existe, de quién es y si hay algo que cambiar. */
  buscarPropiedad(id: number) {
    return this.prisma.notificacion.findUnique({
      where: { id },
      select: { id: true, residenteId: true, leida: true, fechaLectura: true },
    });
  }

  /** Marcar guarda la hora actual; desmarcar la deja en nulo. */
  actualizarLeida(id: number, leida: boolean) {
    return this.prisma.notificacion.update({
      where: { id },
      data: { leida, fechaLectura: leida ? new Date() : null },
      select: { id: true, leida: true, fechaLectura: true },
    });
  }
}
