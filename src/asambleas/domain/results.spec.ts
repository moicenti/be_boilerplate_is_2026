import { percent, tally } from './results.js';

const options = [
  { id: 'a', text: 'A favor' },
  { id: 'b', text: 'En contra' },
  { id: 'c', text: 'Abstención' },
];

describe('tally', () => {
  it('cuenta votos, porcentajes con 2 decimales, participación y ganador', () => {
    const result = tally(
      options,
      new Map([
        ['a', 27],
        ['b', 6],
        ['c', 3],
      ]),
      36,
      48,
    );

    expect(result.options.map((o) => [o.text, o.votes, o.percentage])).toEqual([
      ['A favor', 27, 75],
      ['En contra', 6, 16.67],
      ['Abstención', 3, 8.33],
    ]);
    expect(result).toMatchObject({
      totalVotes: 36,
      participation: 75,
      outcome: 'GANADOR',
      winner: { optionId: 'a', text: 'A favor' },
      consistent: true,
    });
  });

  it('indica Empate cuando dos opciones comparten el máximo', () => {
    const result = tally(
      options,
      new Map([
        ['a', 4],
        ['b', 4],
        ['c', 1],
      ]),
      9,
      12,
    );

    expect(result.outcome).toBe('EMPATE');
    expect(result.winner).toBeNull();
    expect(result.tiedOptions).toEqual(['A favor', 'En contra']);
  });

  it('sin votos no hay ganador y la participación es 0', () => {
    const result = tally(options, new Map(), 0, 10);

    expect(result).toMatchObject({
      outcome: 'SIN_VOTOS',
      winner: null,
      participation: 0,
      totalVotes: 0,
    });
    expect(result.options.every((o) => o.percentage === 0)).toBe(true);
  });

  it('detecta si la suma de votos no coincide con las unidades que votaron', () => {
    expect(tally(options, new Map([['a', 2]]), 3, 10).consistent).toBe(false);
  });
});

describe('percent', () => {
  it('redondea a 2 decimales y evita dividir entre cero', () => {
    expect(percent(1, 3)).toBe(33.33);
    expect(percent(2, 3)).toBe(66.67);
    expect(percent(5, 0)).toBe(0);
  });
});
