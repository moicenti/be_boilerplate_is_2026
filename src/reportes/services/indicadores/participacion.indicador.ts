import { Injectable, Optional } from '@nestjs/common';
import type { FiltrosResumen, IndicadorResumen } from '@Reportes/dto';
import { ReporteParticipacionService } from '../reporte-participacion.service.js';
import { FuenteNoDisponibleError } from './fuente-no-disponible.error.js';

@Injectable()
export class ParticipacionIndicador
  implements IndicadorResumen<{ porcentaje: number }>
{
  constructor(
    @Optional()
    private readonly reporteParticipacion?: ReporteParticipacionService,
  ) {}

  async calcular(filtros: FiltrosResumen): Promise<{ porcentaje: number }> {
    if (!this.reporteParticipacion) {
      throw new FuenteNoDisponibleError(
        'participacion',
        'vw_participacion_votaciones / H29',
      );
    }

    const reporte = await this.reporteParticipacion.obtenerReporte(filtros);
    return { porcentaje: reporte.promedio };
  }
}