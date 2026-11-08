export type TipoDestinatario = 'RESIDENTE' | 'UNIDAD' | 'GRUPO';

export interface DestinatarioDto {
  tipo: TipoDestinatario;
  id: string | number;
}

export interface EmitirNotificacionDto {
  destinatario: DestinatarioDto;
  tipo: string;
  titulo?: string;
  mensaje: string;
  moduloOrigen: string;
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
