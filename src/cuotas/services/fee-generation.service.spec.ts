import { HttpStatus } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { Prisma, type GenerationRun, type User } from '@PrismaClient';
import { ApiException } from '@Common/errors';
import { FeeGenerationService } from './fee-generation.service.js';
import { FeeGenerationScheduler } from './fee-generation.scheduler.js';
import { FeeRulesService } from './fee-rules.service.js';
import type {
  BatchInput,
  FeeGenerationRepository,
  FeeRuleRepository,
  FeeRuleWithConfig,
  ScopeUnit,
} from '../repositories/index.js';
import {
  FeeRuleDuplicateError,
  GenerationInProgressError,
} from '../errors/index.js';
import type { CreateFeeRuleDto } from '../dto/index.js';
import { dueDateOf, periodOf } from '../utils/period.js';

const admin = { id: 'admin-id' } as User;

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

const sumOf = (input: BatchInput) =>
  input.fees.reduce((sum, f) => sum.add(f.amount), new Prisma.Decimal(0));

const dto = (overrides: Partial<CreateFeeRuleDto> = {}): CreateFeeRuleDto => ({
  concepto: 'Mantenimiento',
  tipoMonto: 'FIJO',
  monto: 100,
  diaGeneracion: 1,
  diaVencimiento: 10,
  alcance: 'TODAS',
  unidadIds: [],
  politicaInactivas: 'OMITIR',
  ...overrides,
});

async function expectApiError(
  promise: Promise<unknown>,
  status: HttpStatus,
  codigo: string,
) {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(ApiException);
  expect((error as ApiException).getStatus()).toBe(status);
  expect((error as ApiException).getResponse()).toMatchObject({ codigo });
  return (error as ApiException).getResponse() as { mensaje: string };
}

describe('H3. Generación automática de cuotas nuevas mensualmente', () => {
  describe('generación de cuotas', () => {
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
        findGeneratedUnitIds: vi.fn().mockResolvedValue(new Set()),
        findRunErrors: vi.fn(),
        findRunsPage: vi.fn(),
        saveBatch: vi.fn().mockImplementation((input: BatchInput) => {
          batches.push(input);
          return Promise.resolve(sumOf(input));
        }),
        finishRun: vi
          .fn()
          .mockResolvedValue({ id: 9, created: 0, omitted: 0, failed: 0 }),
      };
      service = new FeeGenerationService(
        repository as unknown as FeeGenerationRepository,
      );
    });

    it('AC1: genera las cuotas del periodo en lotes de 100, con su monto y la fecha de vencimiento', async () => {
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
      expect(batches[0].fees[0]).toEqual({
        unitId: 'unit-0',
        amount: new Prisma.Decimal(100),
      });
      expect(repository.startRun).toHaveBeenCalledWith(
        4,
        '2026-11',
        'AUTOMATICA',
        null,
      );
      expect(repository.finishRun).toHaveBeenCalledWith(9);
    });

    it('AC1: devuelve la ejecución con el monto total de lo creado', async () => {
      repository.findScopeUnits.mockResolvedValue(
        Array.from({ length: 150 }, (_, i) => unit(i)),
      );

      const result = await service.generate(
        rule(),
        '2026-11',
        'MANUAL',
        'admin-id',
      );

      expect(result).toMatchObject({ id: 9 });
      expect(result.totalAmount.toFixed(2)).toBe('15000.00');
      expect(repository.startRun).toHaveBeenCalledWith(
        4,
        '2026-11',
        'MANUAL',
        'admin-id',
      );
    });

    it.each([
      ['inactiva', { active: false }, 'UNIDAD_INACTIVA'],
      ['sin responsable', { hasResident: false }, 'SIN_RESPONSABLE'],
    ])(
      'AC1: con la política OMITIR, una unidad %s no es aplicable y se omite',
      (_caso, overrides, reason) => {
        expect(
          service.classify(
            rule({ inactivePolicy: 'OMITIR' }),
            unit(1, overrides),
          ),
        ).toEqual({ kind: 'omit', unitId: 'unit-1', reason });
      },
    );

    it('AC1: con la política GENERAR, una unidad sin responsable también recibe su cuota', () => {
      expect(
        service.classify(
          rule({ inactivePolicy: 'GENERAR' }),
          unit(1, { hasResident: false }),
        ),
      ).toMatchObject({ kind: 'fee' });
    });

    it('AC1: lleva las omitidas y los errores de política en el mismo lote', async () => {
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

    it('AC2: la cuota usa el monto fijo de la regla', () => {
      expect(service.classify(rule(), unit(1))).toEqual({
        kind: 'fee',
        fee: { unitId: 'unit-1', amount: new Prisma.Decimal(100) },
      });
    });

    it('AC2: con monto por tipo de unidad, la cuota usa el monto de su tipo', () => {
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

    it('AC3: no escribe nada en la vista previa y marca como ya generadas las unidades con cuota', async () => {
      repository.findScopeUnits.mockResolvedValue([
        unit(1),
        unit(2, { active: false }),
        unit(3, { active: false }),
      ]);
      repository.findGeneratedUnitIds.mockResolvedValue(
        new Set(['unit-1', 'unit-2']),
      );

      const plan = await service.plan(
        rule({ inactivePolicy: 'REVISAR' }),
        '2026-11',
      );

      expect(plan.outcomes).toEqual([
        { kind: 'existing', unitId: 'unit-1' },
        { kind: 'existing', unitId: 'unit-2' },
        expect.objectContaining({ kind: 'error', unitId: 'unit-3' }),
      ]);
      expect(plan.dueDate).toEqual(new Date('2026-11-10T00:00:00Z'));
      expect(repository.findGeneratedUnitIds).toHaveBeenCalledWith(
        4,
        '2026-11',
      );
      expect(repository.startRun).not.toHaveBeenCalled();
      expect(repository.saveBatch).not.toHaveBeenCalled();
    });

    it('AC3: no vuelve a insertar las cuotas ya generadas y las cuenta como omitidas', async () => {
      repository.findScopeUnits.mockResolvedValue([unit(1), unit(2), unit(3)]);
      repository.findGeneratedUnitIds.mockResolvedValue(new Set(['unit-2']));

      await service.generate(rule(), '2026-11', 'AUTOMATICA');

      expect(batches[0].fees.map((f) => f.unitId)).toEqual([
        'unit-1',
        'unit-3',
      ]);
      expect(batches[0].omitted).toBe(1);
    });

    it('AC3: antes de empezar cierra las ejecuciones interrumpidas del mismo periodo', async () => {
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

    it('AC4: cada cuota guarda el monto vigente al generarse; cambiar la regla solo afecta los periodos siguientes', async () => {
      repository.findScopeUnits.mockResolvedValue([unit(1)]);

      await service.generate(rule(), '2026-11', 'AUTOMATICA');
      await service.generate(
        rule({ amount: new Prisma.Decimal(120) }),
        '2026-12',
        'AUTOMATICA',
      );

      expect(
        batches.map((b) => [b.period, b.fees[0].amount.toFixed(2)]),
      ).toEqual([
        ['2026-11', '100.00'],
        ['2026-12', '120.00'],
      ]);
    });

    it('AC5: registra el error con su causa si el tipo de unidad no tiene monto', () => {
      const r = rule({
        amountType: 'POR_TIPO_UNIDAD',
        amount: null,
        typeAmounts: [],
      });
      expect(service.classify(r, unit(1, { type: 'CASA' }))).toMatchObject({
        kind: 'error',
        reason: 'SIN_MONTO',
        cause: expect.stringContaining('CASA'),
      });
    });

    it('AC5: con la política REVISAR, una unidad inactiva queda registrada para revisión sin generar', () => {
      expect(
        service.classify(
          rule({ inactivePolicy: 'REVISAR' }),
          unit(1, { active: false }),
        ),
      ).toEqual({
        kind: 'error',
        unitId: 'unit-1',
        reason: 'UNIDAD_INACTIVA',
        cause: 'Unidad inactiva: requiere revisión.',
      });
    });

    it('AC5: si un lote falla, aísla la unidad con error, la registra con su causa y guarda las demás', async () => {
      repository.findScopeUnits.mockResolvedValue([unit(1), unit(2), unit(3)]);
      repository.saveBatch.mockImplementation((input: BatchInput) => {
        if (input.fees.some((f) => f.unitId === 'unit-2')) {
          return Promise.reject(
            new Error('Fallo simulado\nviolates check constraint'),
          );
        }
        batches.push(input);
        return Promise.resolve(sumOf(input));
      });

      const result = await service.generate(rule(), '2026-11', 'AUTOMATICA');
      expect(result.totalAmount.toFixed(2)).toBe('200.00');

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

    it('AC5: si falla un lote sin cuotas, propaga el error y la ejecución queda para reanudarse', async () => {
      repository.findScopeUnits.mockResolvedValue([unit(1, { active: false })]);
      repository.saveBatch.mockRejectedValue(new Error('base caída'));
      await expect(
        service.generate(rule(), '2026-11', 'AUTOMATICA'),
      ).rejects.toThrow('base caída');
      expect(repository.finishRun).not.toHaveBeenCalled();
    });
  });

  describe('proceso programado', () => {
    const ruleWithId = (id: number) => ({ id }) as FeeRuleWithConfig;
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

    it('AC1: el día de generación toma las reglas del día local y el periodo del mes actual', async () => {
      // 00:05 del 1 de diciembre en El Salvador.
      await scheduler.runDaily(new Date('2026-12-01T06:05:00Z'));
      expect(repository.findActiveRulesByDay).toHaveBeenCalledWith(1);
      expect(repository.findActiveRulesWithStaleRuns).toHaveBeenCalledWith(
        '2026-12',
        expect.any(Date),
      );
    });

    it('AC1: el proceso corre solo, a las 00:xx hora local', async () => {
      const spy = vi.spyOn(scheduler, 'runDaily').mockResolvedValue([]);
      vi.useFakeTimers();

      vi.setSystemTime(new Date('2026-12-01T00:05:00Z')); // 18:05 local del día anterior
      await scheduler.onTick();
      expect(spy).not.toHaveBeenCalled();

      vi.setSystemTime(new Date('2026-12-01T06:05:00Z')); // 00:05 local
      await scheduler.onTick();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('AC1: el periodo y el día usan la fecha local del condominio, no la UTC', () => {
      // 1 dic 2026 03:00 UTC = 30 nov 21:00 en El Salvador.
      expect(
        periodOf(new Date('2026-12-01T03:00:00Z'), 'America/El_Salvador'),
      ).toEqual({ period: '2026-11', day: 30 });
      // A las 00:05 locales ya es el día nuevo.
      expect(
        periodOf(new Date('2026-12-01T06:05:00Z'), 'America/El_Salvador'),
      ).toEqual({ period: '2026-12', day: 1 });
    });

    it('AC2: la fecha de vencimiento es el día de vencimiento de la regla en el mes del periodo', () => {
      expect(dueDateOf('2026-02', 28).toISOString()).toBe(
        '2026-02-28T00:00:00.000Z',
      );
      expect(dueDateOf('2026-11', 5).toISOString()).toBe(
        '2026-11-05T00:00:00.000Z',
      );
    });

    it('AC3: genera cada regla una sola vez aunque llegue por el día y por una ejecución interrumpida', async () => {
      repository.findActiveRulesByDay.mockResolvedValue([
        ruleWithId(1),
        ruleWithId(2),
      ]);
      repository.findActiveRulesWithStaleRuns.mockResolvedValue([
        ruleWithId(2),
        ruleWithId(3),
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

    it('AC5: una regla que falla no detiene a las demás', async () => {
      repository.findActiveRulesByDay.mockResolvedValue([
        ruleWithId(1),
        ruleWithId(2),
        ruleWithId(3),
      ]);
      generation.generate
        .mockRejectedValueOnce(new GenerationInProgressError(1, '2026-12'))
        .mockRejectedValueOnce(new Error('falla inesperada'));
      const runs = await scheduler.runDaily(new Date('2026-12-01T06:05:00Z'));
      expect(generation.generate).toHaveBeenCalledTimes(3);
      expect(runs).toEqual([{ ruleId: 3 }]);
    });
  });

  describe('reglas de cuota', () => {
    function stored(
      overrides: Partial<FeeRuleWithConfig> = {},
    ): FeeRuleWithConfig {
      return rule({ createdById: admin.id, ...overrides });
    }

    let repository: {
      [K in keyof FeeRuleRepository]: ReturnType<typeof vi.fn>;
    };
    let service: FeeRulesService;

    beforeEach(() => {
      repository = {
        findAll: vi.fn().mockResolvedValue([]),
        findById: vi.fn().mockResolvedValue(stored()),
        findDuplicate: vi.fn().mockResolvedValue(null),
        findExistingUnitIds: vi
          .fn()
          .mockImplementation((ids: string[]) => Promise.resolve(ids)),
        countScopeUnits: vi.fn().mockResolvedValue(48),
        scopeUnitTypes: vi.fn().mockResolvedValue(['DEPARTAMENTO']),
        create: vi
          .fn()
          .mockImplementation((data, status) =>
            Promise.resolve(stored({ status, amount: data.amount })),
          ),
        update: vi.fn().mockImplementation(() => Promise.resolve(stored())),
        changeStatus: vi
          .fn()
          .mockImplementation((prev, status) =>
            Promise.resolve(stored({ status })),
          ),
        findChanges: vi.fn().mockResolvedValue([]),
      };
      service = new FeeRulesService(repository as unknown as FeeRuleRepository);
    });

    it('AC1: activar una regla sin monto da 422', async () => {
      const { mensaje } = await expectApiError(
        service.create(dto({ monto: null }), admin),
        HttpStatus.UNPROCESSABLE_ENTITY,
        'REGLA_INCOMPLETA',
      );
      expect(mensaje).toContain('monto');
    });

    it('AC1: activar una regla sin unidades aplicables da 422', async () => {
      repository.countScopeUnits.mockResolvedValue(0);
      const { mensaje } = await expectApiError(
        service.create(
          dto({ alcance: 'TORRE', alcanceValor: 'Torre Z' }),
          admin,
        ),
        HttpStatus.UNPROCESSABLE_ENTITY,
        'REGLA_INCOMPLETA',
      );
      expect(mensaje).toContain('unidades aplicables');
    });

    it('AC1: con monto por tipo, activar sin el monto de un tipo presente da 422 y dice cuál', async () => {
      repository.scopeUnitTypes.mockResolvedValue(['DEPARTAMENTO', 'LOCAL']);
      const { mensaje } = await expectApiError(
        service.create(
          dto({
            tipoMonto: 'POR_TIPO_UNIDAD',
            monto: null,
            montosPorTipo: [{ tipo: 'DEPARTAMENTO', monto: 100 }],
          }),
          admin,
        ),
        HttpStatus.UNPROCESSABLE_ENTITY,
        'REGLA_INCOMPLETA',
      );
      expect(mensaje).toContain('LOCAL');
    });

    it('AC1: una regla ACTIVA no puede quedar incompleta al editarla', async () => {
      await expectApiError(
        service.update(4, dto({ monto: null }), admin),
        HttpStatus.UNPROCESSABLE_ENTITY,
        'REGLA_INCOMPLETA',
      );
    });

    it('AC1: pausa una regla activa', async () => {
      const paused = await service.changeStatus(4, 'PAUSADA', admin);
      expect(paused.status).toBe('PAUSADA');
      expect(repository.changeStatus).toHaveBeenCalledWith(
        expect.objectContaining({ id: 4 }),
        'PAUSADA',
        admin.id,
      );
    });

    it('AC1: cambiar a su mismo estado da 409 TRANSICION_INVALIDA', async () => {
      await expectApiError(
        service.changeStatus(4, 'ACTIVA', admin),
        HttpStatus.CONFLICT,
        'TRANSICION_INVALIDA',
      );
    });

    it('AC1: activar una regla INACTIVA incompleta da 422', async () => {
      repository.findById.mockResolvedValue(
        stored({ status: 'INACTIVA', amount: null }),
      );
      await expectApiError(
        service.changeStatus(4, 'ACTIVA', admin),
        HttpStatus.UNPROCESSABLE_ENTITY,
        'REGLA_INCOMPLETA',
      );
    });

    it('AC2: guarda la regla ACTIVA con su concepto, monto, días y el usuario que la crea', async () => {
      const view = await service.create(dto(), admin);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          concept: 'Mantenimiento',
          amount: new Prisma.Decimal(100),
          generationDay: 1,
          dueDay: 10,
          inactivePolicy: 'OMITIR',
          unitIds: [],
        }),
        'ACTIVA',
        admin.id,
      );
      expect(view.applicableUnits).toBe(48);
    });

    it('AC2: permite guardar un borrador INACTIVO sin monto', async () => {
      await service.create(
        dto({ monto: undefined, estado: 'INACTIVA' }),
        admin,
      );
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ amount: null }),
        'INACTIVA',
        admin.id,
      );
      expect(repository.findDuplicate).not.toHaveBeenCalled();
    });

    it.each([
      [
        'vencimiento antes de la generación',
        { diaGeneracion: 10, diaVencimiento: 5 },
      ],
      [
        'montosPorTipo con monto FIJO',
        { montosPorTipo: [{ tipo: 'LOCAL' as const, monto: 5 }] },
      ],
      [
        'monto con POR_TIPO_UNIDAD',
        { tipoMonto: 'POR_TIPO_UNIDAD' as const, monto: 5 },
      ],
      [
        'tipo repetido',
        {
          tipoMonto: 'POR_TIPO_UNIDAD' as const,
          monto: null,
          montosPorTipo: [
            { tipo: 'LOCAL' as const, monto: 5 },
            { tipo: 'LOCAL' as const, monto: 6 },
          ],
        },
      ],
      ['TORRE sin alcanceValor', { alcance: 'TORRE' as const }],
      [
        'TIPO con un tipo inexistente',
        { alcance: 'TIPO' as const, alcanceValor: 'OFICINA' },
      ],
      ['alcanceValor con TODAS', { alcanceValor: 'Torre A' }],
      [
        'unidadIds sin SELECCION',
        { unidadIds: ['6f1c2a4e-1b2c-4d5e-8f90-123456789abc'] },
      ],
    ])('AC2: rechaza %s con 400', async (_caso, overrides) => {
      await expectApiError(
        service.create(dto(overrides), admin),
        HttpStatus.BAD_REQUEST,
        'SOLICITUD_INVALIDA',
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('AC2: rechaza unidades inexistentes con 400', async () => {
      repository.findExistingUnitIds.mockResolvedValue([]);
      const { mensaje } = await expectApiError(
        service.create(
          dto({ alcance: 'SELECCION', unidadIds: ['u-1'] }),
          admin,
        ),
        HttpStatus.BAD_REQUEST,
        'SOLICITUD_INVALIDA',
      );
      expect(mensaje).toContain('u-1');
    });

    it('AC2: una regla INACTIVA sí puede editarse incompleta', async () => {
      repository.findById.mockResolvedValue(stored({ status: 'INACTIVA' }));
      await service.update(4, dto({ monto: null }), admin);
      expect(repository.update).toHaveBeenCalled();
    });

    it('AC2: editar una regla inexistente da 404', async () => {
      repository.findById.mockResolvedValue(null);
      await expectApiError(
        service.update(9, dto(), admin),
        HttpStatus.NOT_FOUND,
        'REGLA_INEXISTENTE',
      );
    });

    it('AC3: no permite dos reglas con el mismo concepto y alcance (409)', async () => {
      repository.findDuplicate.mockResolvedValue({ id: 1 });
      await expectApiError(
        service.create(dto(), admin),
        HttpStatus.CONFLICT,
        'REGLA_DUPLICADA',
      );
    });

    it('AC3: convierte la violación del índice único por una carrera en 409', async () => {
      repository.create.mockRejectedValue(new FeeRuleDuplicateError());
      await expectApiError(
        service.create(dto(), admin),
        HttpStatus.CONFLICT,
        'REGLA_DUPLICADA',
      );
    });

    it('AC3: reactivar una regla INACTIVA cuyo concepto ya tomó otra da 409', async () => {
      repository.findById.mockResolvedValue(stored({ status: 'INACTIVA' }));
      repository.findDuplicate.mockResolvedValue({ id: 7 });
      await expectApiError(
        service.changeStatus(4, 'ACTIVA', admin),
        HttpStatus.CONFLICT,
        'REGLA_DUPLICADA',
      );
    });

    it('AC4: cambiar el monto actualiza solo la regla, sin chocar consigo misma como duplicada', async () => {
      await service.update(4, dto({ monto: 120 }), admin);
      expect(repository.findDuplicate).toHaveBeenCalledWith(
        expect.anything(),
        4,
      );
      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: 4 }),
        expect.objectContaining({ amount: new Prisma.Decimal(120) }),
        admin.id,
      );
    });
  });
});
