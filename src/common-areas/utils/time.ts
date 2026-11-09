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
