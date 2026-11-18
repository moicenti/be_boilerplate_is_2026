import { Injectable } from '@nestjs/common';
import type { FiltrosResumen, IndicadorResumen } from '@Reportes/dto';
import { FuenteNoDisponibleError } from './fuente-no-disponible.error.js';

/**
 * Incidencias abiertas = cantidad de incidencias en ABIERTO o EN_PROCESO.
 * Debe dar el mismo valor que el reporte de H28 (vw_incidencias_abiertas).
 *
 * PENDIENTE: leer de vw_incidencias_abiertas cuando H28 la entregue.
 */
@Injectable()
export class IncidenciasIndicador implements IndicadorResumen<{ cantidad: number }> {
  async calcular(_filtros: FiltrosResumen): Promise<{ cantidad: number }> {
    throw new FuenteNoDisponibleError(
      'incidencias',
      'vw_incidencias_abiertas / H28',
    );
  }
}
