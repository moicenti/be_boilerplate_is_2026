import { HttpStatus } from '@nestjs/common';
import { Prisma, type User } from '@PrismaClient';
import { ApiException } from '@Common/errors';
import { FeeRulesService } from './fee-rules.service.js';
import type {
  FeeRuleRepository,
  FeeRuleWithConfig,
} from '../repositories/index.js';
import { FeeRuleDuplicateError } from '../errors/index.js';
import type { CreateFeeRuleDto } from '../dto/index.js';

const admin = { id: 'admin-id' } as User;

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

function stored(overrides: Partial<FeeRuleWithConfig> = {}): FeeRuleWithConfig {
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
    createdById: admin.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    units: [],
    typeAmounts: [],
    ...overrides,
  };
}

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

describe('FeeRulesService', () => {
  let repository: { [K in keyof FeeRuleRepository]: ReturnType<typeof vi.fn> };
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

  describe('create', () => {
    it('crea la regla ACTIVA por defecto, con el usuario que la crea', async () => {
      const view = await service.create(dto(), admin);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          concept: 'Mantenimiento',
          amount: new Prisma.Decimal(100),
          inactivePolicy: 'OMITIR',
          unitIds: [],
        }),
        'ACTIVA',
        admin.id,
      );
      expect(view.applicableUnits).toBe(48);
    });

    it('permite guardar un borrador INACTIVO sin monto', async () => {
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
    ])('rechaza %s con 400', async (_caso, overrides) => {
      await expectApiError(
        service.create(dto(overrides), admin),
        HttpStatus.BAD_REQUEST,
        'SOLICITUD_INVALIDA',
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('rechaza unidades inexistentes con 400', async () => {
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

    it('activar sin monto da 422', async () => {
      const { mensaje } = await expectApiError(
        service.create(dto({ monto: null }), admin),
        HttpStatus.UNPROCESSABLE_ENTITY,
        'REGLA_INCOMPLETA',
      );
      expect(mensaje).toContain('monto');
    });

    it('activar sin unidades aplicables da 422', async () => {
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

    it('POR_TIPO_UNIDAD sin monto para un tipo presente da 422 y dice cuál', async () => {
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

    it('mismo concepto y alcance da 409', async () => {
      repository.findDuplicate.mockResolvedValue({ id: 1 });
      await expectApiError(
        service.create(dto(), admin),
        HttpStatus.CONFLICT,
        'REGLA_DUPLICADA',
      );
    });

    it('convierte la violación del índice único (carrera) en 409', async () => {
      repository.create.mockRejectedValue(new FeeRuleDuplicateError());
      await expectApiError(
        service.create(dto(), admin),
        HttpStatus.CONFLICT,
        'REGLA_DUPLICADA',
      );
    });
  });

  describe('update', () => {
    it('regla inexistente da 404', async () => {
      repository.findById.mockResolvedValue(null);
      await expectApiError(
        service.update(9, dto(), admin),
        HttpStatus.NOT_FOUND,
        'REGLA_INEXISTENTE',
      );
    });

    it('excluye la propia regla al buscar duplicados', async () => {
      await service.update(4, dto({ monto: 120 }), admin);
      expect(repository.findDuplicate).toHaveBeenCalledWith(
        expect.anything(),
        4,
      );
      expect(repository.update).toHaveBeenCalled();
    });

    it('una regla ACTIVA no puede quedar incompleta', async () => {
      await expectApiError(
        service.update(4, dto({ monto: null }), admin),
        HttpStatus.UNPROCESSABLE_ENTITY,
        'REGLA_INCOMPLETA',
      );
    });

    it('una regla INACTIVA sí puede editarse incompleta', async () => {
      repository.findById.mockResolvedValue(stored({ status: 'INACTIVA' }));
      await service.update(4, dto({ monto: null }), admin);
      expect(repository.update).toHaveBeenCalled();
    });
  });

  describe('changeStatus', () => {
    it('pausa una regla activa', async () => {
      const rule = await service.changeStatus(4, 'PAUSADA', admin);
      expect(rule.status).toBe('PAUSADA');
      expect(repository.changeStatus).toHaveBeenCalledWith(
        expect.objectContaining({ id: 4 }),
        'PAUSADA',
        admin.id,
      );
    });

    it('mismo estado da 409 TRANSICION_INVALIDA', async () => {
      await expectApiError(
        service.changeStatus(4, 'ACTIVA', admin),
        HttpStatus.CONFLICT,
        'TRANSICION_INVALIDA',
      );
    });

    it('activar una INACTIVA incompleta da 422', async () => {
      repository.findById.mockResolvedValue(
        stored({ status: 'INACTIVA', amount: null }),
      );
      await expectApiError(
        service.changeStatus(4, 'ACTIVA', admin),
        HttpStatus.UNPROCESSABLE_ENTITY,
        'REGLA_INCOMPLETA',
      );
    });

    it('reactivar una INACTIVA cuyo concepto ya tomó otra regla da 409', async () => {
      repository.findById.mockResolvedValue(stored({ status: 'INACTIVA' }));
      repository.findDuplicate.mockResolvedValue({ id: 7 });
      await expectApiError(
        service.changeStatus(4, 'ACTIVA', admin),
        HttpStatus.CONFLICT,
        'REGLA_DUPLICADA',
      );
    });
  });
});
