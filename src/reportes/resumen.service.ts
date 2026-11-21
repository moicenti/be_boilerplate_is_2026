import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { FiltrosReportesDto } from './dto/filtros-reportes.dto.js';
import {
  MorosidadIndicador,
  type MorosidadValor,
} from './indicadores/morosidad.indicador.js';
import {
  OcupacionIndicador,
  type OcupacionValor,
} from './indicadores/ocupacion.indicador.js';
import {
  IncidenciasIndicador,
  type IncidenciasValor,
} from './indicadores/incidencias.indicador.js';
import {
  ParticipacionIndicador,
  type ParticipacionValor,
} from './indicadores/participacion.indicador.js';
import { SeccionesRepository } from './repositories/secciones.repository.js';

export type IndicadorValor<T> = T | { estado: 'no_disponible' };

export interface ResumenResponse {
  morosidad: IndicadorValor<MorosidadValor>;
  ocupacion: IndicadorValor<OcupacionValor>;
  incidencias: IndicadorValor<IncidenciasValor>;
  participacion: IndicadorValor<ParticipacionValor>;
}

@Injectable()
export class ResumenService {
  private readonly logger = new Logger(ResumenService.name);

  constructor(
    private readonly morosidad: MorosidadIndicador,
    private readonly ocupacion: OcupacionIndicador,
    private readonly incidencias: IncidenciasIndicador,
    private readonly participacion: ParticipacionIndicador,
    private readonly secciones: SeccionesRepository,
  ) {}

  async obtenerResumen(filtros: FiltrosReportesDto): Promise<ResumenResponse> {
    filtros.validar();

    if (filtros.seccion) {
      const secciones = await this.secciones.listar();
      const existe = secciones.some((s) => s.id === filtros.seccion);
      if (!existe) {
        throw new BadRequestException({
          codigo: 'FILTROS_INVALIDOS',
          mensaje: `La sección con ID ${filtros.seccion} no existe`,
        });
      }
    }

    const [m, o, i, p] = await Promise.allSettled([
      this.morosidad.calcular(filtros),
      this.ocupacion.calcular(filtros),
      this.incidencias.calcular(filtros),
      this.participacion.calcular(filtros),
    ]);

    return {
      morosidad:
        m.status === 'fulfilled' ? m.value : { estado: 'no_disponible' },
      ocupacion:
        o.status === 'fulfilled' ? o.value : { estado: 'no_disponible' },
      incidencias:
        i.status === 'fulfilled' ? i.value : { estado: 'no_disponible' },
      participacion:
        p.status === 'fulfilled' ? p.value : { estado: 'no_disponible' },
    };
  }
}
