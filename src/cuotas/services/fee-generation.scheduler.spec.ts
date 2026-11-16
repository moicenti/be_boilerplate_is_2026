import type { ConfigService } from '@nestjs/config';
import { FeeGenerationScheduler } from './fee-generation.scheduler.js';
import type { FeeGenerationService } from './fee-generation.service.js';
import type {
  FeeGenerationRepository,
  FeeRuleWithConfig,
} from '../repositories/index.js';
import { GenerationInProgressError } from '../errors/index.js';

const rule = (id: number) => ({ id }) as FeeRuleWithConfig;

describe('FeeGenerationScheduler', () => {
  let repository: {
    findActiveRulesByDay: ReturnType<typeof vi.fn>;
    findActiveRulesWithStaleRuns: ReturnType<typeof vi.fn>;
  };
  let generation: { generate: ReturnType<typeof vi.fn> };
  let scheduler: FeeGenerationScheduler;

  beforeEach(() => {
    repository = {
      findActiveRulesByDay: vi.fn().mockResolvedValue([]),
      findActiveRulesWithStaleRuns: vi.fn().mockResolvedValue([]),
    };
    generation = {
      generate: vi
        .fn()
        .mockImplementation((r) => Promise.resolve({ ruleId: r.id })),
    };
    const config = { get: vi.fn().mockReturnValue('America/El_Salvador') };
    scheduler = new FeeGenerationScheduler(
      repository as unknown as FeeGenerationRepository,
      generation as unknown as FeeGenerationService,
      config as unknown as ConfigService<any, true>,
    );
  });

  afterEach(() => vi.useRealTimers());

  it('toma las reglas del día local y el periodo del mes actual', async () => {
    // 00:05 del 1 de diciembre en El Salvador.
    await scheduler.runDaily(new Date('2026-12-01T06:05:00Z'));
    expect(repository.findActiveRulesByDay).toHaveBeenCalledWith(1);
    expect(repository.findActiveRulesWithStaleRuns).toHaveBeenCalledWith(
      '2026-12',
      expect.any(Date),
    );
  });

  it('genera cada regla una sola vez aunque venga por las dos vías', async () => {
    repository.findActiveRulesByDay.mockResolvedValue([rule(1), rule(2)]);
    repository.findActiveRulesWithStaleRuns.mockResolvedValue([
      rule(2),
      rule(3),
    ]);
    const runs = await scheduler.runDaily(new Date('2026-12-01T06:05:00Z'));
    expect(
      generation.generate.mock.calls.map(([r, period, origin, , now]) => [
        r.id,
        period,
        origin,
        now?.toISOString(),
      ]),
    ).toEqual([
      [1, '2026-12', 'AUTOMATICA', '2026-12-01T06:05:00.000Z'],
      [2, '2026-12', 'AUTOMATICA', '2026-12-01T06:05:00.000Z'],
      [3, '2026-12', 'AUTOMATICA', '2026-12-01T06:05:00.000Z'],
    ]);
    expect(runs).toHaveLength(3);
  });

  it('una regla que falla no detiene a las demás', async () => {
    repository.findActiveRulesByDay.mockResolvedValue([
      rule(1),
      rule(2),
      rule(3),
    ]);
    generation.generate
      .mockRejectedValueOnce(new GenerationInProgressError(1, '2026-12'))
      .mockRejectedValueOnce(new Error('falla inesperada'));
    const runs = await scheduler.runDaily(new Date('2026-12-01T06:05:00Z'));
    expect(generation.generate).toHaveBeenCalledTimes(3);
    expect(runs).toEqual([{ ruleId: 3 }]);
  });

  it('el cron solo trabaja a las 00:xx hora local', async () => {
    const spy = vi.spyOn(scheduler, 'runDaily').mockResolvedValue([]);
    vi.useFakeTimers();

    vi.setSystemTime(new Date('2026-12-01T00:05:00Z')); // 18:05 local del día anterior
    await scheduler.onTick();
    expect(spy).not.toHaveBeenCalled();

    vi.setSystemTime(new Date('2026-12-01T06:05:00Z')); // 00:05 local
    await scheduler.onTick();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
