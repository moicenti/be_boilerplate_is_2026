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
];
export function esModuloValido(valor) {
    return (typeof valor === 'string' &&
        MODULOS_NOTIFICACION.includes(valor));
}
