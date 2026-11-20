// src/notificaciones/dto/emitir-notificacion.dto.ts

export type TipoDestinatario = 'RESIDENTE' | 'UNIDAD' | 'GRUPO';

// ✅ 1. EXPORTAR EL CATÁLOGO COMO CONSTANTE (no como tipo)
export const MODULOS_NOTIFICACION = [
  'pagos',
  'reservas',
  'incidencias',
  'visitas',
  'paqueteria', // Ojo: es paqueteria, no paquetes
  'votaciones',
  'anuncios',
] as const;

// ✅ 2. Exportar el tipo derivado (opcional pero recomendado)
export type ModuloNotificacion = (typeof MODULOS_NOTIFICACION)[number];

export interface DestinatarioDto {
  tipo: TipoDestinatario;
  id: string;
}

export interface EmitirNotificacionDto {
  destinatario: DestinatarioDto;
  tipo: string;
  titulo?: string;
  mensaje: string;
  moduloOrigen: ModuloNotificacion; // Usamos el tipo estricto
  enlaceAccion?: string;
  forzada?: boolean;
}

export interface Emisor {
  id: string;
  rol: string;
}

export interface EmitirResultado {
  loteId: number;
  creadas: number;
  omitidas: number;
}
