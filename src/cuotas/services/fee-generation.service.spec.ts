import { Prisma, type GenerationRun } from '@PrismaClient';
import { FeeGenerationService } from './fee-generation.service.js';
import type {
  BatchInput,
  FeeGenerationRepository,
  FeeRuleWithConfig,
  ScopeUnit,
} from '../repositories/index.js';

function rule(overrides: Partial<FeeRuleWithConfig> = {}): FeeRuleWithConfig {
  return {
    id: 4,
    concept: 'Mantenimiento',
    amountType: 'FIJO',
    amount: new Prisma.Decimal(100),
    generationDay: 1,
    dueDay: 10,
    scope: 'TODAS',
    scopeValue: null,
    inactivePolicy: 'OMITIR',
    status: 'ACTIVA',
    createdById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    units: [],
    typeAmounts: [],
    ...overrides,
  };
}

const unit = (n: number, overrides: Partial<ScopeUnit> = {}): ScopeUnit => ({
  id: `unit-${n}`,
  code: `A-${n}`,
  type: 'DEPARTAMENTO',
  active: true,
  hasResident: true,
  ...overrides,
});

describe('FeeGenerationService', () => {
  let repository: {
    [K in keyof FeeGenerationRepository]: ReturnType<typeof vi.fn>;
  };
  let service: FeeGenerationService;
  let batches: BatchInput[];

  beforeEach(() => {
    batches = [];
    repository = {
      findActiveRulesByDay: vi.fn(),
      findActiveRulesWithStaleRuns: vi.fn(),
      findRuleById: vi.fn(),
      closeStaleRuns: vi.fn().mockResolvedValue(0),
      startRun: vi.fn().mockResolvedValue({ id: 9 } as GenerationRun),
      findScopeUnits: vi.fn().mockResolvedValue([]),
      saveBatch: vi.fn().mockImplementation((input: BatchInput) => {
        batches.push(input);
        return Promise.resolve();
      }),
      finishRun: vi
        .fn()
        .mockResolvedValue({ id: 9, created: 0, omitted: 0, failed: 0 }),
    };
    service = new FeeGenerationService(
      repository as unknown as FeeGenerationRepository,
    );
  });

  describe('classify', () => {
    it('genera la cuota con el monto fijo', () => {
      expect(service.classify(rule(), unit(1))).toEqual({
        kind: 'fee',
        fee: { unitId: 'unit-1', amount: new Prisma.Decimal(100) },
      });
    });

    it('usa el monto del tipo de unidad', () => {
      const r = rule({
        amountType: 'POR_TIPO_UNIDAD',
        amount: null,
        typeAmounts: [
          { ruleId: 4, unitType: 'LOCAL', amount: new Prisma.Decimal(250) },
        ],
      });
      expect(service.classify(r, unit(1, { type: 'LOCAL' }))).toMatchObject({
        kind: 'fee',
        fee: { amount: new Prisma.Decimal(250) },
      });
    });

    it('registra error si el tipo de unidad no tiene monto', () => {
      const r = rule({
        amountType: 'POR_TIPO_UNIDAD',
        amount: null,
        typeAmounts: [],
      });
      expect(service.classify(r, unit(1, { type: 'CASA' }))).toMatchObject({
        kind: 'error',
        cause: expect.stringContaining('CASA'),
      });
    });

    it.each([
      ['inactiva', { active: false }],
      ['sin responsable', { hasResident: false }],
    ])('unidad %s: OMITIR la omite', (_caso, overrides) => {
      expect(
        service.classify(
          rule({ inactivePolicy: 'OMITIR' }),
          unit(1, overrides),
        ),
      ).toEqual({
        kind: 'omit',
      });
    });

    it('unidad inactiva: REVISAR la registra para revisión sin generar', () => {
      expect(
        service.classify(
          rule({ inactivePolicy: 'REVISAR' }),
          unit(1, { active: false }),
        ),
      ).toEqual({
        kind: 'error',
        unitId: 'unit-1',
        cause: 'Unidad inactiva: requiere revisión.',
      });
    });

    it('unidad sin responsable: GENERAR crea la cuota', () => {
      expect(
        service.classify(
          rule({ inactivePolicy: 'GENERAR' }),
          unit(1, { hasResident: false }),
        ),
      ).toMatchObject({ kind: 'fee' });
    });
  });

  describe('generate', () => {
    it('procesa en lotes de 100 con la fecha de vencimiento del periodo', async () => {
      repository.findScopeUnits.mockResolvedValue(
        Array.from({ length: 250 }, (_, i) => unit(i)),
      );

      await service.generate(rule(), '2026-11', 'AUTOMATICA');

      expect(batches.map((b) => b.fees.length)).toEqual([100, 100, 50]);
      expect(batches[0]).toMatchObject({
        runId: 9,
        ruleId: 4,
        concept: 'Mantenimiento',
        period: '2026-11',
        dueDate: new Date('2026-11-10T00:00:00Z'),
      });
      expect(repository.startRun).toHaveBeenCalledWith(
        4,
        '2026-11',
        'AUTOMATICA',
        null,
      );
      expect(repository.finishRun).toHaveBeenCalledWith(9);
    });

    it('cierra antes las ejecuciones interrumpidas del mismo periodo', async () => {
      await service.generate(rule(), '2026-11', 'AUTOMATICA');
      expect(repository.closeStaleRuns).toHaveBeenCalledWith(
        4,
        '2026-11',
        expect.any(Date),
      );
      expect(
        repository.closeStaleRuns.mock.invocationCallOrder[0],
      ).toBeLessThan(repository.startRun.mock.invocationCallOrder[0]);
    });

    it('lleva omitidas y errores de política en el mismo lote', async () => {
      repository.findScopeUnits.mockResolvedValue([
        unit(1),
        unit(2, { active: false }),
        unit(3, { hasResident: false }),
      ]);
      await service.generate(
        rule({ inactivePolicy: 'OMITIR' }),
        '2026-11',
        'AUTOMATICA',
      );
      expect(batches).toHaveLength(1);
      expect(batches[0]).toMatchObject({ omitted: 2, errors: [] });
      expect(batches[0].fees.map((f) => f.unitId)).toEqual(['unit-1']);
    });

    it('si un lote falla, aísla la unidad con error y guarda las demás', async () => {
      repository.findScopeUnits.mockResolvedValue([unit(1), unit(2), unit(3)]);
      repository.saveBatch.mockImplementation((input: BatchInput) => {
        if (input.fees.some((f) => f.unitId === 'unit-2')) {
          return Promise.reject(
            new Error('Fallo simulado\nviolates check constraint'),
          );
        }
        batches.push(input);
        return Promise.resolve();
      });

      await service.generate(rule(), '2026-11', 'AUTOMATICA');

      const saved = batches.flatMap((b) => b.fees.map((f) => f.unitId));
      expect(saved).toEqual(['unit-1', 'unit-3']);
      const errors = batches.flatMap((b) => b.errors);
      expect(errors).toEqual([
        {
          unitId: 'unit-2',
          cause: 'Error al crear la cuota: violates check constraint',
        },
      ]);
      expect(repository.finishRun).toHaveBeenCalled();
    });

    it('si falla un lote sin cuotas, propaga el error (la ejecución queda para reanudar)', async () => {
      repository.findScopeUnits.mockResolvedValue([unit(1, { active: false })]);
      repository.saveBatch.mockRejectedValue(new Error('base caída'));
      await expect(
        service.generate(rule(), '2026-11', 'AUTOMATICA'),
      ).rejects.toThrow('base caída');
      expect(repository.finishRun).not.toHaveBeenCalled();
    });
  });
});
