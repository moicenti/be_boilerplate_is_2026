import { toZonedParts } from '@CommonAreas/utils';
/** Periodo "AAAA-MM" y día del mes del instante, en la zona horaria del condominio. */
export function periodOf(instant, timeZone) {
    const { date } = toZonedParts(instant, timeZone);
    return { period: date.slice(0, 7), day: Number(date.slice(8, 10)) };
}
/** Fecha de vencimiento de una cuota del periodo: el día `dueDay` de ese mes (columna DATE). */
export function dueDateOf(period, dueDay) {
    return new Date(`${period}-${String(dueDay).padStart(2, '0')}T00:00:00Z`);
}
