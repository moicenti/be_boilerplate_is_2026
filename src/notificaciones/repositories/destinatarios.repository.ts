import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services';
import type { DestinatarioDto } from '@Notificaciones/dto';

export interface ResidenteDestino {
  id: string;
  unidadId: number | null;
}

@Injectable()
export class DestinatariosRepository {
  constructor(private readonly prisma: PrismaService) {}

   async resolver(d: DestinatarioDto): Promise<ResidenteDestino[] | null> {
    switch (d.tipo) {
      case 'RESIDENTE': {
        const u = await this.prisma.user.findUnique({
          where: { id: String(d.id) },
          select: { id: true, unitId: true }, // AJUSTAR: nombre del campo de unidad
        });
        return u ? [{ id: u.id, unidadId: u.unitId }] : null;
      }
      case 'UNIDAD': {
        const unidad = await this.prisma.unit.findUnique({
          where: { id: Number(d.id) }, // AJUSTAR: si Unit.id es uuid, quita Number()
        });
        if (!unidad) return null;
        const us = await this.prisma.user.findMany({
          where: { unitId: unidad.id, isActive: true },
          select: { id: true, unitId: true },
        });
        return us.map((u) => ({ id: u.id, unidadId: u.unitId }));
      }
      case 'GRUPO': {
        // AJUSTAR: campos de torre o sección en Unit
        const unidades = await this.prisma.unit.findMany({
          where: { OR: [{ tower: String(d.id) }, { section: String(d.id) }] },
          select: { id: true },
        });
        if (unidades.length === 0) return null;
        const us = await this.prisma.user.findMany({
          where: { unitId: { in: unidades.map((x) => x.id) }, isActive: true },
          select: { id: true, unitId: true },
        });
        return us.map((u) => ({ id: u.id, unidadId: u.unitId }));
      }
    }
  }


  async desactivados(
    residenteIds: string[],
    modulo: string,
  ): Promise<Set<string>> {
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
