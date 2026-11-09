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

  /**
   * null = el destinatario no existe · [] = existe pero sin residentes activos.
   *
   * En H13, User.unit es un texto que se asume igual a Unit.code.
   * Si guarda otra cosa, solo hay que ajustar este archivo.
   */
  async resolver(d: DestinatarioDto): Promise<ResidenteDestino[] | null> {
    switch (d.tipo) {
      case 'RESIDENTE': {
        const u = await this.prisma.user.findUnique({
          where: { id: d.id },
          select: { id: true, unit: true },
        });
        if (!u) return null;
        const unidad = await this.prisma.unit.findUnique({
          where: { code: u.unit },
          select: { id: true },
        });
        return [{ id: u.id, unidadId: unidad?.id ?? null }];
      }
      case 'UNIDAD': {
        const unidad = await this.prisma.unit.findUnique({
          where: { id: d.id },
          select: { id: true, code: true },
        });
        if (!unidad) return null;
        const us = await this.prisma.user.findMany({
          where: { unit: unidad.code, isActive: true, role: 'RESIDENTE' },
          select: { id: true },
        });
        return us.map((u) => ({ id: u.id, unidadId: unidad.id }));
      }
      case 'GRUPO': {
        // En H13 una unidad solo tiene torre (no hay sección).
        const unidades = await this.prisma.unit.findMany({
          where: { tower: d.id },
          select: { id: true, code: true },
        });
        if (unidades.length === 0) return null;
        const porCodigo = new Map(unidades.map((x) => [x.code, x.id]));
        const us = await this.prisma.user.findMany({
          where: {
            unit: { in: [...porCodigo.keys()] },
            isActive: true,
            role: 'RESIDENTE',
          },
          select: { id: true, unit: true },
        });
        return us.map((u) => ({
          id: u.id,
          unidadId: porCodigo.get(u.unit) ?? null,
        }));
      }
      default:
        return null;
    }
  }

  /** IDs de residentes que desactivaron ese módulo. Sin registro = activo. */
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
