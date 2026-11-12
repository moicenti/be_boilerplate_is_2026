export function parseTime(time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(Date.UTC(1970, 0, 1, hours, minutes));
}

export function formatTime(date: Date): string {
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export interface ZonedParts {
  /** Fecha local "YYYY-MM-DD". */
  date: string;
  /** Día de la semana local: 0 = domingo … 6 = sábado. */
  dayOfWeek: number;
  /** Segundos transcurridos desde la medianoche local. */
  secondsOfDay: number;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function toZonedParts(instant: Date, timeZone: string): ZonedParts {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(instant)
      .map(({ type, value }) => [type, value]),
  );

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    dayOfWeek: WEEKDAYS.indexOf(parts.weekday),
    secondsOfDay:
      Number(parts.hour) * 3600 + Number(parts.minute) * 60 + Number(parts.second),
  };
}

export function timeToSeconds(time: Date): number {
  return time.getUTCHours() * 3600 + time.getUTCMinutes() * 60 + time.getUTCSeconds();
}

/** Día de la semana de una fecha "YYYY-MM-DD" (0 = domingo … 6 = sábado), sin depender de la zona. */
export function dayOfWeekOf(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

/** Desfase de `timeZone` respecto de UTC en `instant`, en milisegundos (El Salvador: -6 h). */
function offsetMs(instant: Date, timeZone: string): number {
  const { date, secondsOfDay } = toZonedParts(instant, timeZone);
  return Date.parse(`${date}T00:00:00Z`) + secondsOfDay * 1000 - instant.getTime();
}

/**
 * Instante que corresponde a una fecha ("YYYY-MM-DD") y hora ("HH:mm") locales de `timeZone`:
 * "2026-11-14" + "18:00" en America/El_Salvador → 2026-11-15T00:00:00Z.
 */
export function zonedDateTimeToInstant(date: string, time: string, timeZone: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const wallClock = Date.UTC(year, month - 1, day, hours, minutes);

  // La segunda pasada corrige el desfase si la primera cayó del otro lado de un cambio de
  // horario de verano (El Salvador no tiene, pero APP_TIMEZONE es configurable).
  const firstGuess = wallClock - offsetMs(new Date(wallClock), timeZone);
  return new Date(wallClock - offsetMs(new Date(firstGuess), timeZone));
}
