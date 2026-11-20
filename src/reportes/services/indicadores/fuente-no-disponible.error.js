/** El indicador no tiene todavía una fuente de datos conectada. Se registra y se muestra no_disponible. */
export class FuenteNoDisponibleError extends Error {
    constructor(indicador, fuente) {
        super(`El indicador '${indicador}' aún no tiene su fuente conectada (${fuente})`);
        this.name = 'FuenteNoDisponibleError';
    }
}
