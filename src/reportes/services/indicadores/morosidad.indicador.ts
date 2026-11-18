import { Injectable } from '@nestjs/common';
import type { FiltrosResumen, IndicadorResumen } from '@Reportes/dto';
import { FuenteNoDisponibleError } from './fuente-no-disponible.error.js';

/**
 * Morosidad = unidades morosas ÷ unidades ACTIVAS × 100, a la fecha de corte (`filtros.hasta`).
 * Unidad morosa: al menos una cuota PENDIENTE o PARCIAL con vencimiento anterior a hoy
 * (la que vence hoy no cuenta; las ANULADAS se excluyen). Devuelve también el monto adeudado.
 * Debe dar el mismo valor que el reporte de H2.
 *
 * PENDIENTE: el schema no tiene el modelo de cuotas ni un estado ACTIVA en Unit.
 * Reemplazar el cuerpo de `calcular` cuando existan (consulta de referencia en docs/indicadores-panel.md).
 */
@Injectable()
export class MorosidadIndicador
  implements IndicadorResumen<{ porcentaje: number; monto: number }>
{
  async calcular(
    _filtros: FiltrosResumen,
  ): Promise<{ porcentaje: number; monto: number }> {
    throw new FuenteNoDisponibleError('morosidad', 'cuota / H2');
  }
}
