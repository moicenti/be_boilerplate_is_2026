const ZONA = 'America/El_Salvador';

/** AAAA-MM-DD -> DD/MM/AAAA (sin pasar por Date, para no mover el día por zona horaria). */
export function formatearFecha(iso: string): string {
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

/** Fecha y hora de El Salvador: DD/MM/AAAA HH:MM. */
export function formatearFechaHora(fecha: Date): string {
  const partes = new Intl.DateTimeFormat('es-SV', {
    timeZone: ZONA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(fecha);
  const p = (tipo: string) => partes.find((x) => x.type === tipo)?.value ?? '';
  return `${p('day')}/${p('month')}/${p('year')} ${p('hour')}:${p('minute')}`;
}

export const formatearMonto = (valor: number): string =>
  `$${valor.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
