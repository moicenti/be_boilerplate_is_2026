export type TipoDestinatario = 'RESIDENTE' | 'UNIDAD' | 'GRUPO';

export interface DestinatarioDto {
  tipo: TipoDestinatario;
  /** residente: uuid del usuario · unidad: uuid de la unidad · grupo: nombre de la torre */
  id: string;
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

/** Quién emite. Sale de la sesión del módulo que llama, nunca del cuerpo de una petición. */
export interface Emisor {
  id: string;
  rol: string;
}

export interface EmitirResultado {
  loteId: number;
  creadas: number;
  omitidas: number;
}
