import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { IncidenciasService } from '@Incidencias/services';
import { IncidenciaRepository } from '@Incidencias/repositories';
import { CreateIncidenciaDto } from '@Incidencias/dto';

describe('IncidenciasService - H7', () => {
  let service: IncidenciasService;
  let repo: { create: any; findAllByUser: any; findOneByIdAndUser: any };

  const user = {
    id: 'user-uuid',
    unit: {
      id: 'unit-uuid',
      code: 'A-19',
      tower: 'Torre A',
      description: 'Torre A, departamento 19',
      type: 'DEPARTAMENTO' as const,
      active: true,
      createdAt: new Date('2026-01-01T00:00:00-06:00'),
      historyStartsAt: null,
    },
  };

  const validDto: CreateIncidenciaDto = {
    title: 'Luminaria apagada en pasillo',
    description: 'La luminaria no enciende desde anoche y el pasillo queda oscuro al salir.',
    category: 'Mantenimiento',
    location: 'Torre A · Piso 3',
  };

  beforeEach(async () => {
    repo = {
      create: vi.fn(),
      findAllByUser: vi.fn(),
      findOneByIdAndUser: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidenciasService,
        { provide: IncidenciaRepository, useValue: repo },
      ],
    }).compile();

    service = module.get<IncidenciasService>(IncidenciasService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // H7-AC1
  it('H7-AC1: crea el reporte con folio único, estado Abierto y unidad del usuario', async () => {
    repo.create.mockResolvedValue({
      id: 'report-uuid',
      folio: 'INC-2026-0001',
      status: 'Abierto',
      unit: 'A-19',
      photos: [],
      events: [],
    });

    const result = await service.create(user, validDto, []);

    expect(repo.create).toHaveBeenCalledTimes(1);
    const [userId, unitCode, folio, dto, photos] = repo.create.mock.calls[0];
    expect(userId).toBe(user.id);
    expect(unitCode).toBe('A-19');
    expect(folio).toMatch(/^INC-\d{4}-\d{4}$/);
    expect(dto).toEqual(validDto);
    expect(photos).toEqual([]);
    expect(result).toBeDefined();
  });

  // H7-AC2
  it('H7-AC2: rechaza un título menor a 5 caracteres', async () => {
    const invalidDto = { ...validDto, title: 'abc' };
    console.log(invalidDto);
    await expect(service.create(user, invalidDto, [])).rejects.toThrow();
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('H7-AC2: rechaza una descripción menor a 20 caracteres', async () => {
    const invalidDto: CreateIncidenciaDto = { ...validDto, description: 'muy corta' };
    await expect(service.create(user, invalidDto, [])).rejects.toThrow();
    expect(repo.create).not.toHaveBeenCalled();
  });

  // H7-AC4
  it('H7-AC4: usa la unidad del JWT, no la del body', async () => {
    repo.create.mockResolvedValue({ id: 'x', folio: 'INC-2026-0002' });
    await service.create(user, validDto, []);
    expect(repo.create.mock.calls[0][0]).toBe(user.id);
    expect(repo.create.mock.calls[0][1]).toBe('A-19');
  });

  // H7-AC1 (negativo)
  it('H7-AC1: rechaza si el usuario no tiene unidad asignada', async () => {
    const userWithoutUnit = { id: 'user-uuid', unit: null };
    await expect(
      service.create(userWithoutUnit as any, validDto, []),
    ).rejects.toThrow(BadRequestException);
    expect(repo.create).not.toHaveBeenCalled();
  });
});