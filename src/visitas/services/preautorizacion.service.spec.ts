import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { PreautorizacionService } from './preautorizacion.service.js';
import { PreautorizacionRepository } from '../repositories/index.js';

describe('PreautorizacionService - H10', () => {
  let service: PreautorizacionService;
  let repo: { create: any; findAllByResidente: any; findByIdAndResidente: any; findByCodigo: any };

  const user = {
    id: 'user-uuid',
    unit: {
      id: 'unit-uuid',
      code: 'A-19',
      tower: 'Torre A',
      description: '',
      type: 'DEPARTAMENTO' as const,
      active: true,
      createdAt: new Date(),
      historyStartsAt: null,
    },
  };

  const validDto = {
    nombreVisitante: 'Juan Pérez',
    documento: '12345678',
    inicio: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    fin: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    acompanantes: 2,
    motivo: 'Entrega de paquetería',
  };

  beforeEach(async () => {
    repo = {
      create: vi.fn(),
      findAllByResidente: vi.fn(),
      findByIdAndResidente: vi.fn(),
      findByCodigo: vi.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PreautorizacionService,
        { provide: PreautorizacionRepository, useValue: repo },
      ],
    }).compile();

    service = module.get<PreautorizacionService>(PreautorizacionService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('H10-AC1: crea pre-autorización con código de 8 caracteres y estado VIGENTE', async () => {
    repo.create.mockImplementation((userId, unitId, codigo, data) => ({
      id: 'pre-uuid',
      codigo,
      estado: 'VIGENTE',
      unidadId: unitId,
      ...data,
    }));

    const result = await service.create(user, validDto);

    expect(repo.create).toHaveBeenCalledTimes(1);
    const [, unitId, codigo] = repo.create.mock.calls[0];
    expect(unitId).toBe('unit-uuid');
    expect(codigo).toMatch(/^[A-Z0-9]{8}$/);
    expect(result.estado).toBe('VIGENTE');
  });

  it('H10-AC2: findOne devuelve el código de la pre-autorización', async () => {
    repo.findByIdAndResidente.mockResolvedValue({
      id: 'pre-uuid',
      codigo: 'AB3K9XZ2',
      estado: 'VIGENTE',
    });

    const result = await service.findOne('pre-uuid', 'user-uuid');
    expect(result.codigo).toBe('AB3K9XZ2');
  });

  it('H10-AC3: rechaza inicio en el pasado', async () => {
    const dto = { ...validDto, inicio: new Date(Date.now() - 3600_000).toISOString() };
    await expect(service.create(user, dto)).rejects.toThrow(BadRequestException);
  });

  it('H10-AC3: rechaza fin ≤ inicio', async () => {
    const dto = { ...validDto, fin: validDto.inicio };
    await expect(service.create(user, dto)).rejects.toThrow(BadRequestException);
  });

  it('H10-AC3: rechaza vigencia > 24h', async () => {
    const dto = {
      ...validDto,
      inicio: new Date(Date.now() + 3600_000).toISOString(),
      fin: new Date(Date.now() + 26 * 3600_000).toISOString(),
    };
    await expect(service.create(user, dto)).rejects.toThrow(BadRequestException);
  });

  it('H10-AC3: rechaza más de 5 acompañantes', async () => {
    const dto = { ...validDto, acompanantes: 6 };
    await expect(service.create(user, dto)).rejects.toThrow(BadRequestException);
  });

  it('H10-AC4: usa la unidad del JWT, no la del body', async () => {
    repo.create.mockResolvedValue({ id: 'pre-uuid', codigo: 'ABC12345' });
    const dtoConUnidadFalsa = { ...validDto, unidadId: 'otra-unidad-uuid' };
    await service.create(user, dtoConUnidadFalsa as any);
    expect(repo.create.mock.calls[0][1]).toBe('unit-uuid');
  });
});