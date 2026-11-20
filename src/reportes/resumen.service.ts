import { Injectable, Logger } from '@nestjs/common';
import { FiltrosReportesDto } from './dto/filtros-reportes.dto.js';
import {MorosidadIndicador, type MorosidadValor,} from './services/indicadores/morosidad.indicador.js';
import {OcupacionIndicador, type OcupacionValor,} from './services/indicadores/ocupacion.indicador.js';
import {IncidenciasIndicador, type IncidenciasValor,} from './services/indicadores/incidencias.indicador.js';
import {ParticipacionIndicador, type ParticipacionValor,} from './services/indicadores/participacion.indicador.js';
import { PrismaService } from '../prisma/services/index.js';

export type IndicadorValor<T> = T | { estado: 'no_disponible' };

// ✅ LA PALABRA 'export' ES OBLIGATORIA AQUÍ
export interface ResumenResponse {
  morosidad: IndicadorValor<MorosidadValor>;
  ocupacion: IndicadorValor<OcupacionValor>;
  incidencias: IndicadorValor<IncidenciasValor>;
  participacion: IndicadorValor<ParticipacionValor>;
}

@Injectable()
export class ResumenService {
  private readonly logger = new Logger(ResumenService.name);

  constructor(private readonly prisma:  PrismaService) {}

  async obtenerResumen(filtros: FiltrosReportesDto): Promise<ResumenResponse> {
    const [morosidad, ocupacion, incidencias, participacion] =
      await Promise.allSettled([
        this.calcularMorosidad(filtros),
        this.calcularOcupacion(filtros),
        this.calcularIncidencias(filtros),
        this.calcularParticipacion(filtros),
      ]);

    return {
      morosidad:
        morosidad.status === 'fulfilled'
          ? morosidad.value
          : { estado: 'no_disponible' },
      ocupacion:
        ocupacion.status === 'fulfilled'
          ? ocupacion.value
          : { estado: 'no_disponible' },
      incidencias:
        incidencias.status === 'fulfilled'
          ? incidencias.value
          : { estado: 'no_disponible' },
      participacion:
        participacion.status === 'fulfilled'
          ? participacion.value
          : { estado: 'no_disponible' },
    };
  }

  private async calcularMorosidad(
    _filtros: FiltrosReportesDto,
  ): Promise<IndicadorValor<{ porcentaje: number; monto: number }>> {
    // El modelo 'Cuota' no existe en tu schema.prisma actual.
    // H26 exige: si falla o no existe, devolver "no_disponible" sin romper los demás.
    this.logger.warn(
      'Indicador Morosidad: no_disponible (modelo Cuota no implementado aún)',
    );
    return { estado: 'no_disponible' };
  }

  private async calcularOcupacion(
    filtros: FiltrosReportesDto,
  ): Promise<IndicadorValor<{ porcentaje: number }>> {
    try {
      const reservas = await this.prisma.reservation.findMany({
        where: {
          status: 'CONFIRMADA',
          startsAt: { gte: new Date(filtros.desde) },
          endsAt: { lte: new Date(filtros.hasta) },
        },
        select: { startsAt: true, endsAt: true },
      });

      let horasReservadas = 0;
      reservas.forEach((r) => {
        horasReservadas +=
          (r.endsAt.getTime() - r.startsAt.getTime()) / (1000 * 60 * 60);
      });

      const horasDisponibles = 100; // Simplificación para H26
      const porcentaje =
        horasDisponibles > 0 ? (horasReservadas / horasDisponibles) * 100 : 0;

      return { porcentaje: parseFloat(porcentaje.toFixed(2)) };
    } catch (error) {
      this.logger.error('Error calculando ocupación', error);
      return { estado: 'no_disponible' };
    }
  }

  private async calcularIncidencias(
    filtros: FiltrosReportesDto,
  ): Promise<IndicadorValor<{ cantidad: number }>> {
    try {
      const cantidad = await this.prisma.report.count({
        where: {
          status: { in: ['Abierto', 'En proceso', 'ABIERTO', 'EN_PROCESO'] },
          createdAt: {
            gte: new Date(filtros.desde),
            lte: new Date(filtros.hasta),
          },
        },
      });
      return { cantidad };
    } catch (error) {
      this.logger.error('Error calculando incidencias', error);
      return { estado: 'no_disponible' };
    }
  }

  private async calcularParticipacion(
    _filtros: FiltrosReportesDto,
  ): Promise<IndicadorValor<{ porcentaje: number }>> {
    // El modelo de Votaciones no existe en tu schema.prisma actual.
    this.logger.warn(
      'Indicador Participación: no_disponible (modelo Votación no implementado aún)',
    );
    return { estado: 'no_disponible' };
  }
}
