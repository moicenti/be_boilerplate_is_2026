export type TipoDestinatario = 'RESIDENTE' | 'UNIDAD' | 'GRUPO';

// Catálogo estricto de 7 módulos según diseño técnico H23/H25
export const MODULOS_NOTIFICACION = [
  'pagos',
  'reservas',
  'incidencias',
  'visitas',
  'paqueteria', // Ojo: es paqueteria, no paquetes
  'votaciones',
  'anuncios',
] as const;

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
  moduloOrigen: ModuloNotificacion; // <-- Cambiado a tipo estricto
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
