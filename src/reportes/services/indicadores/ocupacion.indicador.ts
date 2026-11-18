import { Injectable } from '@nestjs/common';
import type { FiltrosResumen, IndicadorResumen } from '@Reportes/dto';
import { FuenteNoDisponibleError } from './fuente-no-disponible.error.js';

/**
 * Ocupación = horas de reservas CONFIRMADAS ÷ horas de uso permitido del área en el periodo × 100,
 * sin contar bloqueos. Debe dar el mismo valor que el reporte de H27 (vw_ocupacion_areas).
 *
 * PENDIENTE: leer de vw_ocupacion_areas cuando H27 la entregue. Las tablas base (reserva,
 * horario_area, bloqueo_area) existen, pero esta cifra tiene que coincidir con la de H27,
 * así que no se recalcula aparte.
 */
@Injectable()
export class OcupacionIndicador implements IndicadorResumen<{ porcentaje: number }> {
  async calcular(_filtros: FiltrosResumen): Promise<{ porcentaje: number }> {
    throw new FuenteNoDisponibleError('ocupacion', 'vw_ocupacion_areas / H27');
  }
}
