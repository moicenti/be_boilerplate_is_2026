// El catálogo de módulos vive en un solo lugar (H23/H25).
import type { ModuloNotificacion } from './modulos-notificacion.js';

export type TipoDestinatario = 'RESIDENTE' | 'UNIDAD' | 'GRUPO';

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
