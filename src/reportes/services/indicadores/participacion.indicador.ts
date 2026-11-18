import { Injectable } from '@nestjs/common';
import type { FiltrosResumen, IndicadorResumen } from '@Reportes/dto';
import { FuenteNoDisponibleError } from './fuente-no-disponible.error.js';

/**
 * Participación = unidades que votaron ÷ unidades habilitadas × 100
 * (habilitadas = unidades ACTIVAS al abrir la votación).
 * Debe dar el mismo valor que el reporte de H29 (vw_participacion_votaciones).
 *
 * PENDIENTE: leer de vw_participacion_votaciones cuando H29 la entregue. Mientras tanto
 * responde no_disponible, que es justo el ejemplo del diseño.
 */
@Injectable()
export class ParticipacionIndicador
  implements IndicadorResumen<{ porcentaje: number }>
{
  async calcular(_filtros: FiltrosResumen): Promise<{ porcentaje: number }> {
    throw new FuenteNoDisponibleError(
      'participacion',
      'vw_participacion_votaciones / H29',
    );
  }
}
