import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services';
import type { FiltroLeidas } from '@Notificaciones/dto';

const CAMPOS_ITEM = {
  id: true,
  tipo: true, // Agregado: útil para iconos en el frontend
  titulo: true,
  mensaje: true,
  moduloOrigen: true,
  fechaCreacion: true,
  leida: true,
  fechaLectura: true, // Agregado: útil para ordenar o mostrar "Leído el..."
  enlaceAccion: true,
  forzada: true, // Agregado: para mostrar badge "Forzado" si aplica
} as const;

@Injectable()
export class CentroNotificacionesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listar(
    residenteId: string,
    skip: number,
    take: number,
    modulo?: string,
    leidas?: FiltroLeidas,
  ) {
    // 1. Construir el where base
    const where: any = {
      residenteId,
      estado: { not: 'FALLIDO_PERMANENTE' }, // Excluir notificaciones que nunca llegarán
    };

    // 2. Aplicar filtros opcionales
    if (modulo) where.moduloOrigen = modulo;
    if (leidas === 'sin_leer') where.leida = false;
    if (leidas === 'leidas') where.leida = true;

    // 3. Ejecutar en transacción para consistencia
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

  contarNoLeidas(residenteId: string): Promise<number> {
    return this.prisma.notificacion.count({
      where: {
        residenteId,
        leida: false,
        estado: { not: 'FALLIDO_PERMANENTE' }, // Solo contar las que realmente pueden leerse
      },
    });
  }

  buscarPropiedad(id: number) {
    return this.prisma.notificacion.findUnique({
      where: { id },
      select: { id: true, residenteId: true, leida: true, fechaLectura: true },
    });
  }

  actualizarLeida(id: number, leida: boolean) {
    return this.prisma.notificacion.update({
      where: { id },
      data: { leida, fechaLectura: leida ? new Date() : null },
      select: { id: true, leida: true, fechaLectura: true },
    });
  }
}
