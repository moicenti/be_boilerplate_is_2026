import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '@Prisma/services';
import type { FiltrosResumen, IndicadorResumen } from '@Reportes/dto';
import { FuenteNoDisponibleError } from './fuente-no-disponible.error.js';

@Injectable()
export class IncidenciasIndicador implements IndicadorResumen<{ cantidad: number }> {
  constructor(@Optional() private readonly prisma?: PrismaService) {}

  async calcular(filtros: FiltrosResumen): Promise<{ cantidad: number }> {
    if (!this.prisma) {
      throw new FuenteNoDisponibleError(
        'incidencias',
        'vw_incidencias_abiertas / H28',
      );
    }

    const inicioUtc = new Date(`${filtros.desde}T00:00:00-06:00`);
    const finUtc = new Date(`${filtros.hasta}T23:59:59.999-06:00`);

    const rows = filtros.seccion
      ? await this.prisma.$queryRaw<{ total: bigint }[]>`
          SELECT COUNT(*)::bigint AS total
          FROM vw_incidencias_abiertas
          WHERE fecha_creacion >= ${inicioUtc}
            AND fecha_creacion <= ${finUtc}
            AND seccion = ${filtros.seccion}
        `
      : await this.prisma.$queryRaw<{ total: bigint }[]>`
          SELECT COUNT(*)::bigint AS total
          FROM vw_incidencias_abiertas
          WHERE fecha_creacion >= ${inicioUtc}
            AND fecha_creacion <= ${finUtc}
        `;

    return { cantidad: Number(rows[0]?.total ?? 0) };
  }
}