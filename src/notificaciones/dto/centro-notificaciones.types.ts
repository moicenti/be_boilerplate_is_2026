/** Lo único que H24 necesita de la sesión. Siempre sale del token, nunca de la petición. */
export interface SesionResidente {
  id: string;
}

export interface NotificacionItem {
  id: number;
  titulo: string;
  mensaje: string;
  moduloOrigen: string;
  fechaCreacion: Date;
  leida: boolean;
  enlaceAccion: string | null;
}

export interface ListadoNotificaciones {
  total: number;
  page: number;
  size: number;
  items: NotificacionItem[];
}

export interface CambioLeida {
  id: number;
  leida: boolean;
  fechaLectura: Date | null;
}

export interface ConteoNoLeidas {
  count: number;
}
