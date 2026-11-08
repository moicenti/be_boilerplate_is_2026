/**
 * Conversión entre "HH:mm" y los DateTime que Prisma usa para columnas
 * `TIME`. Prisma representa una hora como una fecha del 1970-01-01 en UTC,
 * así que se trabaja siempre en UTC para que la zona horaria del servidor no
 * corra las horas.
 */
export function parseTime(time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(Date.UTC(1970, 0, 1, hours, minutes));
}

export function formatTime(date: Date): string {
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
