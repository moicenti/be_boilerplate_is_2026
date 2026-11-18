/** Filtros ya validados. Las fechas son AAAA-MM-DD, ambas inclusivas. */
export interface FiltrosResumen {
  desde: string;
  /** También es la fecha de corte de la morosidad. */
  hasta: string;
  seccion?: string;
}

export interface NoDisponible {
  estado: 'no_disponible';
}

export type Resultado<T> = T | NoDisponible;

export interface ResumenIndicadores {
  morosidad: Resultado<{ porcentaje: number; monto: number }>;
  ocupacion: Resultado<{ porcentaje: number }>;
  incidencias: Resultado<{ cantidad: number }>;
  participacion: Resultado<{ porcentaje: number }>;
}

/** Contrato de cada indicador. Cada historia dueña de los datos implementa el suyo. */
export interface IndicadorResumen<T> {
  calcular(filtros: FiltrosResumen): Promise<T>;
}
