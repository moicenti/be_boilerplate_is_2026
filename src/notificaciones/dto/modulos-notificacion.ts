/**
 * Catálogo de módulos que pueden emitir avisos (H25).
 * El orden es el de la respuesta del GET.
 * Se usa 'paqueteria' (BE-25.1 y H23); el ejemplo con 'paquetes' del diseño queda descartado.
 */
export const MODULOS_NOTIFICACION = [
  'pagos',
  'reservas',
  'incidencias',
  'visitas',
  'paqueteria',
  'votaciones',
  'anuncios',
] as const;

export type ModuloNotificacion = (typeof MODULOS_NOTIFICACION)[number];

export function esModuloValido(valor: unknown): valor is ModuloNotificacion {
  return (
    typeof valor === 'string' &&
    (MODULOS_NOTIFICACION as readonly string[]).includes(valor)
  );
}

export interface PreferenciaModulo {
  modulo: string;
  activo: boolean;
}
