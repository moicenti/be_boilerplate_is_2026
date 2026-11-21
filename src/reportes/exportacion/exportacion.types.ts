export const TIPOS_REPORTE = [
  'resumen',
  'morosidad',
  'areas-comunes',
  'incidencias',
  'votaciones',
] as const;

export type TipoReporte = (typeof TIPOS_REPORTE)[number];

export const esTipoReporte = (valor: string): valor is TipoReporte =>
  (TIPOS_REPORTE as readonly string[]).includes(valor);

/** Título que se imprime en el encabezado del PDF. */
export const TITULOS_REPORTE: Record<TipoReporte, string> = {
  resumen: 'Panel general de indicadores',
  morosidad: 'Reporte de morosidad',
  'areas-comunes': 'Reporte de áreas comunes',
  incidencias: 'Incidencias abiertas',
  votaciones: 'Reporte de votaciones',
};

export interface ColumnaReporte {
  titulo: string;
  /** Peso relativo del ancho de la columna. */
  ancho: number;
  alinear?: 'left' | 'right' | 'center';
}

/** Lo único que el renderer necesita saber: no conoce la base de datos ni los servicios. */
export interface ReporteDocumento {
  titulo: string;
  /** Texto del periodo, p. ej. "01/11/2026 al 30/11/2026". */
  periodo: string;
  seccion?: string;
  generadoEn: string;
  administrador: string;
  /** Líneas de resumen antes de la tabla (totales). */
  resumen: string[];
  columnas: ColumnaReporte[];
  filas: string[][];
  /** Se imprime en lugar de la tabla cuando no hay filas. */
  mensajeVacio: string;
}

export const MENSAJE_SIN_DATOS =
  'Sin datos para el periodo y la sección seleccionados';

export abstract class ReportePdfRenderer {
  abstract render(documento: ReporteDocumento): Promise<Buffer>;
}
