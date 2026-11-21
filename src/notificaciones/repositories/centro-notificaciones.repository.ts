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
  async listar(
    residenteId: string,
    skip: number,
    take: number,
    filtros: { modulo?: string; leidas?: boolean } = {},
  ) {
    const where = {
      residenteId,
      ...(filtros.modulo !== undefined && { moduloOrigen: filtros.modulo }),
      ...(filtros.leidas !== undefined && { leida: filtros.leidas }),
    };
    const [total, items] = await this.prisma.$transaction([
      this.prisma.notificacion.count({ where }),
      this.prisma.notificacion.findMany({
        where,
        orderBy: [{ fechaCreacion: 'desc' }, { id: 'desc' }],
        skip,
        take,
        select: CAMPOS_ITEM,
      }),
    ]);
    return { total, items };
  }

  async marcarTodasLeidas(residenteId: string): Promise<number> {
    const resultado = await this.prisma.notificacion.updateMany({
      where: {
        residenteId,
        leida: false,
        estado: { not: 'FALLIDO_PERMANENTE' }, // No marcamos las que fallaron permanentemente
      },
      data: {
        leida: true,
        fechaLectura: new Date(),
      },
    });
    return resultado.count;
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
