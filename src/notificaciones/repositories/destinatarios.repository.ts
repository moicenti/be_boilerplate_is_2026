import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services';
import type { DestinatarioDto } from '@Notificaciones/dto';

export interface ResidenteDestino {
  id: string;
  unidadId: string | null;
}

@Injectable()
export class DestinatariosRepository {
  constructor(private readonly prisma: PrismaService) {}

  async resolver(d: DestinatarioDto): Promise<ResidenteDestino[] | null> {
    switch (d.tipo) {
      case 'RESIDENTE': {
        const u = await this.prisma.user.findUnique({
          where: { id: d.id },
          select: { id: true, unitId: true },
        });
        if (!u) return null;
        return [{ id: u.id, unidadId: u.unitId }];
      }
      case 'UNIDAD': {
        const unidad = await this.prisma.unit.findUnique({
          where: { id: d.id },
          select: { id: true },
        });
        if (!unidad) return null;
        const us = await this.prisma.user.findMany({
          where: { unitId: unidad.id, isActive: true, role: 'RESIDENTE' },
          select: { id: true },
        });
        return us.map((u) => ({ id: u.id, unidadId: unidad.id }));
      }
      case 'GRUPO': {
        const unidades = await this.prisma.unit.findMany({
          where: { tower: d.id },
          select: { id: true },
        });
        if (unidades.length === 0) return null;
        const ids = unidades.map((x) => x.id);
        const porId = new Map(unidades.map((x) => [x.id, x.id]));
        const us = await this.prisma.user.findMany({
          where: {
            unitId: { in: ids },
            isActive: true,
            role: 'RESIDENTE',
          },
          select: { id: true, unitId: true },
        });
        return us.map((u) => ({
          id: u.id,
          unidadId: u.unitId ? porId.get(u.unitId) ?? null : null,
        }));
      }
      default:
        return null;
    }
  }

  async desactivados(
    residenteIds: string[],
    modulo: string,
  ): Promise<Set<string>> {
    if (residenteIds.length === 0) return new Set();
    const filas = await this.prisma.preferenciaNotificacion.findMany({
      where: {
        residenteId: { in: residenteIds },
        moduloOrigen: modulo,
        activo: false,
      },
      select: { residenteId: true },
    });
    return new Set(filas.map((f) => f.residenteId));
  }
}