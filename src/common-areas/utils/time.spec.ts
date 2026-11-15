import { dayOfWeekOf, toZonedIso, zonedDateTimeToInstant } from './time.js';

describe('zonedDateTimeToInstant', () => {
  it('convierte hora local de El Salvador (UTC-6) a UTC', () => {
    expect(zonedDateTimeToInstant('2026-11-14', '18:00', 'America/El_Salvador')).toEqual(
      new Date('2026-11-15T00:00:00Z'),
    );
  });

  it('usa el desfase vigente en zonas con horario de verano', () => {
    // Nueva York: UTC-4 en julio, UTC-5 en diciembre.
    expect(zonedDateTimeToInstant('2026-07-01', '10:00', 'America/New_York')).toEqual(
      new Date('2026-07-01T14:00:00Z'),
    );
    expect(zonedDateTimeToInstant('2026-12-01', '10:00', 'America/New_York')).toEqual(
      new Date('2026-12-01T15:00:00Z'),
    );
    // El día del cambio (8 de marzo de 2026, 02:00 → 03:00), ya pasado el salto.
    expect(zonedDateTimeToInstant('2026-03-08', '12:00', 'America/New_York')).toEqual(
      new Date('2026-03-08T16:00:00Z'),
    );
  });
});

describe('dayOfWeekOf', () => {
  it('devuelve 0 para domingo y 6 para sábado', () => {
    expect(dayOfWeekOf('2026-11-15')).toBe(0);
    expect(dayOfWeekOf('2026-11-14')).toBe(6);
  });
});

describe('toZonedIso', () => {
  it('formatea el instante en hora local con su desfase', () => {
    expect(toZonedIso(new Date('2026-11-13T00:00:00Z'), 'America/El_Salvador')).toBe(
      '2026-11-12T18:00:00-06:00',
    );
  });

  it('usa +00:00 en UTC', () => {
    expect(toZonedIso(new Date('2026-11-13T00:30:15Z'), 'UTC')).toBe('2026-11-13T00:30:15+00:00');
  });
});
