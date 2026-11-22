import type { ConfigService } from '@nestjs/config';
import { Prisma, type User } from '@PrismaClient';
import type { EnvConfig } from '@Config';
import { ApiException } from '@Common/errors';
import type {
  FeeGenerationRepository,
  FeeRuleWithConfig,
  ScopeUnit,
} from '../repositories/index.js';
import { GenerationInProgressError } from '../errors/index.js';
import type {
  FeeGenerationService,
  GenerationPlan,
  GenerationResult,
} from './fee-generation.service.js';
import { ManualFeeGenerationService } from './manual-fee-generation.service.js';

// 18 nov 2026, 02:00 en El Salvador (UTC-6): el periodo actual es 2026-11.
const NOW = new Date('2026-11-18T08:00:00Z');

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

const unit = (n: number): ScopeUnit => ({
  id: `unit-${n}`,
  code: `A-${n}`,
  type: 'DEPARTAMENTO',
  active: true,
  hasResident: true,
});

const admin = { id: 'admin-id' } as User;

async function apiError(promise: Promise<unknown>) {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ApiException);
  const exception = error as ApiException;
  return {
    status: exception.getStatus(),
    ...(exception.getResponse() as object),
  };
}

describe('H34. Generación manual de cuotas con vista previa y resumen de resultados', () => {
  let repository: {
    findRuleById: ReturnType<typeof vi.fn>;
    findRunErrors: ReturnType<typeof vi.fn>;
    findRunsPage: ReturnType<typeof vi.fn>;
  };
  let engine: {
    plan: ReturnType<typeof vi.fn>;
    generate: ReturnType<typeof vi.fn>;
  };
  let service: ManualFeeGenerationService;

  beforeEach(() => {
    repository = {
      findRuleById: vi.fn().mockResolvedValue(rule()),
      findRunErrors: vi.fn().mockResolvedValue([]),
      findRunsPage: vi.fn().mockResolvedValue({ total: 0, items: [] }),
    };
    engine = { plan: vi.fn(), generate: vi.fn() };
    const config = {
      get: () => 'America/El_Salvador',
    } as unknown as ConfigService<EnvConfig, true>;
    service = new ManualFeeGenerationService(
      repository as unknown as FeeGenerationRepository,
      engine as unknown as FeeGenerationService,
      config,
    );
  });

  describe('validaciones comunes', () => {
    it('AC1: 404 REGLA_INEXISTENTE si la regla no existe', async () => {
      repository.findRuleById.mockResolvedValue(null);
      expect(await apiError(service.preview(99, '2026-11', NOW))).toEqual({
        status: 404,
        codigo: 'REGLA_INEXISTENTE',
        mensaje: expect.any(String),
      });
      expect(await apiError(service.listRuns(99, 1, 20))).toMatchObject({
        status: 404,
      });
    });

    it.each(['PAUSADA', 'INACTIVA'] as const)(
      'AC2: no genera ni muestra vista previa si la regla está %s (422 REGLA_INACTIVA)',
      async (status) => {
        repository.findRuleById.mockResolvedValue(rule({ status }));
        for (const call of [
          service.preview(4, '2026-11', NOW),
          service.execute(4, '2026-11', admin, NOW),
        ]) {
          expect(await apiError(call)).toMatchObject({
            status: 422,
            codigo: 'REGLA_INACTIVA',
            mensaje: expect.stringContaining(status),
          });
        }
        expect(engine.plan).not.toHaveBeenCalled();
        expect(engine.generate).not.toHaveBeenCalled();
      },
    );

    it('AC2: rechaza un periodo futuro, en la zona del condominio (422 REGLA_INACTIVA)', async () => {
      // 1 dic 03:00 UTC sigue siendo 30 nov en El Salvador.
      const lateNovember = new Date('2026-12-01T03:00:00Z');
      expect(
        await apiError(service.preview(4, '2026-12', lateNovember)),
      ).toMatchObject({
        status: 422,
        codigo: 'REGLA_INACTIVA',
        mensaje: expect.stringContaining('futuro'),
      });
      expect(engine.plan).not.toHaveBeenCalled();
    });

    it('AC2: acepta el periodo actual y los anteriores que no corrieron', async () => {
      engine.plan.mockResolvedValue({
        units: [],
        outcomes: [],
        dueDate: new Date(),
      } satisfies GenerationPlan);
      await service.preview(4, '2026-11', NOW);
      await service.preview(4, '2025-01', NOW);
      expect(engine.plan).toHaveBeenCalledTimes(2);
    });
  });

  describe('vista previa', () => {
    it('AC1: resume las cuotas por crear, el monto total, las ya generadas y las excepciones, sin generar nada', async () => {
      engine.plan.mockResolvedValue({
        units: [unit(1), unit(2), unit(3), unit(4), unit(5)],
        outcomes: [
          {
            kind: 'fee',
            fee: { unitId: 'unit-1', amount: new Prisma.Decimal(100) },
          },
          {
            kind: 'fee',
            fee: { unitId: 'unit-2', amount: new Prisma.Decimal(250.5) },
          },
          { kind: 'existing', unitId: 'unit-3' },
          { kind: 'omit', unitId: 'unit-4', reason: 'UNIDAD_INACTIVA' },
          {
            kind: 'error',
            unitId: 'unit-5',
            reason: 'SIN_RESPONSABLE',
            cause: 'Unidad sin responsable: requiere revisión.',
          },
        ],
        dueDate: new Date('2026-11-10T00:00:00Z'),
      } satisfies GenerationPlan);

      const view = await service.preview(4, '2026-11', NOW);

      expect(view).toMatchObject({
        period: '2026-11',
        feeCount: 2,
        alreadyGenerated: 1,
        exceptions: [
          {
            unitId: 'unit-4',
            unitCode: 'A-4',
            reason: 'UNIDAD_INACTIVA',
            result: 'OMITIDA',
          },
          {
            unitId: 'unit-5',
            unitCode: 'A-5',
            reason: 'SIN_RESPONSABLE',
            result: 'ERROR',
          },
        ],
      });
      expect(view.totalAmount.toFixed(2)).toBe('350.50');
      expect(engine.generate).not.toHaveBeenCalled();
    });
  });

  describe('ejecución', () => {
    it('AC2: genera las cuotas faltantes con el motor de H3, con origen MANUAL y el usuario', async () => {
      const run = {
        id: 31,
        created: 2,
        totalAmount: new Prisma.Decimal(200),
      } as GenerationResult;
      engine.generate.mockResolvedValue(run);
      const errors = [{ unitId: 'unit-5', cause: 'x', unit: { code: 'A-5' } }];
      repository.findRunErrors.mockResolvedValue(errors);

      const result = await service.execute(4, '2026-10', admin, NOW);

      expect(engine.generate).toHaveBeenCalledWith(
        expect.objectContaining({ id: 4 }),
        '2026-10',
        'MANUAL',
        'admin-id',
        NOW,
      );
      expect(result.run).toBe(run);
    });

    it('AC3: el resumen trae las cuotas creadas, omitidas y con error, y la causa de cada fallo', async () => {
      const run = {
        id: 31,
        created: 16,
        omitted: 1,
        failed: 1,
        totalAmount: new Prisma.Decimal(1360),
      } as GenerationResult;
      engine.generate.mockResolvedValue(run);
      const errors = [
        {
          unitId: 'unit-5',
          cause: 'Unidad sin responsable: requiere revisión.',
          unit: { code: 'A-5' },
        },
      ];
      repository.findRunErrors.mockResolvedValue(errors);

      const result = await service.execute(4, '2026-10', admin, NOW);

      expect(repository.findRunErrors).toHaveBeenCalledWith(31);
      expect(result).toEqual({ run, errors });
      expect(result.run).toMatchObject({ created: 16, omitted: 1, failed: 1 });
    });

    it('AC2: 409 EJECUCION_EN_CURSO si ya hay una ejecución en curso', async () => {
      engine.generate.mockRejectedValue(
        new GenerationInProgressError(4, '2026-11'),
      );
      expect(
        await apiError(service.execute(4, '2026-11', admin, NOW)),
      ).toMatchObject({ status: 409, codigo: 'EJECUCION_EN_CURSO' });
    });

    it('AC2: los errores inesperados no se ocultan', async () => {
      engine.generate.mockRejectedValue(new Error('base caída'));
      await expect(service.execute(4, '2026-11', admin, NOW)).rejects.toThrow(
        'base caída',
      );
    });
  });

  describe('historial', () => {
    it('AC4: lista cada ejecución, automática o manual, con su fecha, periodo, usuario y totales', async () => {
      const items = [
        {
          id: 32,
          origin: 'MANUAL',
          period: '2026-10',
          startedAt: NOW,
          user: { email: 'admin@x.com' },
          created: 2,
          omitted: 0,
          failed: 0,
        },
        {
          id: 30,
          origin: 'AUTOMATICA',
          period: '2026-11',
          startedAt: NOW,
          user: null,
          created: 18,
          omitted: 0,
          failed: 2,
        },
      ];
      repository.findRunsPage.mockResolvedValue({ total: 2, items });

      const page = await service.listRuns(4, 1, 20);

      expect(page.items).toBe(items);
      expect(repository.findRunsPage).toHaveBeenCalledWith(4, 0, 20);
    });

    it('AC4: pagina el historial con pagina y tamano', async () => {
      repository.findRunsPage.mockResolvedValue({ total: 45, items: [] });
      expect(await service.listRuns(4, 3, 20)).toEqual({
        total: 45,
        page: 3,
        pageSize: 20,
        items: [],
      });
      expect(repository.findRunsPage).toHaveBeenCalledWith(4, 40, 20);
    });
  });
});
