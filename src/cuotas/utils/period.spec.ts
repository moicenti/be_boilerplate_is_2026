import { dueDateOf, periodOf } from './period.js';

describe('periodOf', () => {
  it('usa la fecha local del condominio, no la UTC', () => {
    // 1 dic 2026 03:00 UTC = 30 nov 21:00 en El Salvador.
    expect(
      periodOf(new Date('2026-12-01T03:00:00Z'), 'America/El_Salvador'),
    ).toEqual({
      period: '2026-11',
      day: 30,
    });
  });

  it('a las 00:05 locales ya es el día nuevo', () => {
    expect(
      periodOf(new Date('2026-12-01T06:05:00Z'), 'America/El_Salvador'),
    ).toEqual({
      period: '2026-12',
      day: 1,
    });
  });
});

describe('dueDateOf', () => {
  it('arma la fecha de vencimiento del mismo mes', () => {
    expect(dueDateOf('2026-02', 28).toISOString()).toBe(
      '2026-02-28T00:00:00.000Z',
    );
    expect(dueDateOf('2026-11', 5).toISOString()).toBe(
      '2026-11-05T00:00:00.000Z',
    );
  });
});
