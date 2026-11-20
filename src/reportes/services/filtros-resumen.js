const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;
/** AAAA-MM-DD y una fecha que existe en el calendario (rechaza 2026-02-30). */
export function esFechaValida(valor) {
    if (!FORMATO_FECHA.test(valor))
        return false;
    const fecha = new Date(`${valor}T00:00:00Z`);
    return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
}
/** La fecha de hoy en El Salvador (UTC-6), no en UTC: a las 9 pm ya sería "mañana" en UTC. */
export function hoyEnElSalvador(ahora = new Date()) {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/El_Salvador',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(ahora);
}
export function primerDiaDelMes(fecha) {
    return `${fecha.slice(0, 8)}01`;
}
