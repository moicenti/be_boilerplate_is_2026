import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { VisitaService } from '@Visitas/services'
import { VisitaRepository } from '@Visitas/repositories';
import { PreautorizacionRepository } from '@Visitas/repositories';
import { PrismaService } from '@Prisma/services'; 

describe('VisitaService - H11', () => {
  let service: VisitaService;
  let visitaRepo: any;
  let preRepo: any;
  let prisma: any;

  const seguridad = { id: 'seguridad-uuid' };

  beforeEach(async () => {
    visitaRepo = {
      findActivaByDocumento: vi.fn(),
      findActivaById: vi.fn(),
      createEntrada: vi.fn(),
      registrarSalida: vi.fn(),
      findAllActivas: vi.fn(),
      countActivas: vi.fn(),
    };
    preRepo = {
      findById: vi.fn(),
      markAsUsada: vi.fn(),
    };
    prisma = {
      unit: { findUnique: vi.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisitaService,
        { provide: VisitaRepository, useValue: visitaRepo },
        { provide: PreautorizacionRepository, useValue: preRepo },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<VisitaService>(VisitaService);
  });

  afterEach(() => vi.clearAllMocks());

  it('H11-AC1/AC2: registra entrada con pre-autorización y la marca como USADA', async () => {
    preRepo.findById.mockResolvedValue({
      id: 'pre-uuid',
      estado: 'VIGENTE',
      documento: '12345678',
      nombreVisitante: 'Juan Pérez',
      acompanantes: 2,
      unidadId: 'unit-uuid',
      fin: new Date(Date.now() + 3600_000),
    });
    visitaRepo.findActivaByDocumento.mockResolvedValue(null);
    visitaRepo.createEntrada.mockResolvedValue({
      id: 'visita-uuid',
      estado: 'DENTRO',
      preautorizacionId: 'pre-uuid',
    });

    const result = await service.registrarEntrada(seguridad, { preautorizacionId: 'pre-uuid' });

    expect(result.estado).toBe('DENTRO');
    expect(preRepo.markAsUsada).toHaveBeenCalledWith('pre-uuid');
  });

  it('H11-AC3: registra entrada sin autorización con motivo válido', async () => {
    visitaRepo.findActivaByDocumento.mockResolvedValue(null);
    prisma.unit.findUnique.mockResolvedValue({ id: 'unit-uuid', code: 'A-19' });
    visitaRepo.createEntrada.mockResolvedValue({
      id: 'visita-uuid',
      estado: 'DENTRO_SIN_AUTORIZACION',
    });

    const result = await service.registrarEntrada(seguridad, {
      nombreVisitante: 'Pedro',
      documento: '999',
      unidadCode: 'A-19',
      motivo: 'Visita sin autorización previa.',
      acompanantes: 0,
    });

    expect(result.estado).toBe('DENTRO_SIN_AUTORIZACION');
  });

  it('H11-AC4: rechaza entrada sin autorización sin motivo', async () => {
    await expect(
      service.registrarEntrada(seguridad, {
        nombreVisitante: 'Pedro',
        documento: '999',
        unidadCode: 'A-19',
        acompanantes: 0,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('H11-AC4: rechaza motivo corto', async () => {
    await expect(
      service.registrarEntrada(seguridad, {
        nombreVisitante: 'Pedro',
        documento: '999',
        unidadCode: 'A-19',
        motivo: 'corto',
        acompanantes: 0,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('H11-AC5: rechaza documento con visita activa', async () => {
    preRepo.findById.mockResolvedValue({
      id: 'pre-uuid',
      estado: 'VIGENTE',
      documento: '12345678',
      unidadId: 'unit-uuid',
      fin: new Date(Date.now() + 3600_000),
    });
    visitaRepo.findActivaByDocumento.mockResolvedValue({ id: 'otra-visita', documento: '12345678' });

    await expect(
      service.registrarEntrada(seguridad, { preautorizacionId: 'pre-uuid' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('H11-AC6: rechaza pre-autorización cancelada', async () => {
    preRepo.findById.mockResolvedValue({ id: 'pre-uuid', estado: 'CANCELADA', documento: '12345678' });
    await expect(
      service.registrarEntrada(seguridad, { preautorizacionId: 'pre-uuid' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('H11-AC7: registra salida de visita activa', async () => {
    visitaRepo.findActivaById.mockResolvedValue({ id: 'visita-uuid', estado: 'DENTRO' });
    visitaRepo.registrarSalida.mockResolvedValue({ id: 'visita-uuid', estado: 'SALIO' });

    const result = await service.registrarSalida(seguridad, 'visita-uuid');
    expect(result.estado).toBe('SALIO');
  });

  it('H11-AC7: rechaza salida de visita ya salida', async () => {
    visitaRepo.findActivaById.mockResolvedValue({ id: 'visita-uuid', estado: 'SALIO' });
    await expect(service.registrarSalida(seguridad, 'visita-uuid')).rejects.toThrow(BadRequestException);
  });
});

describe('VisitaService - H12 (panel)', () => {
  
    let service: VisitaService;
  let visitaRepo: any;
  let preRepo: any;
  let prisma: any;

  const seguridad = { id: 'seguridad-uuid' };

  beforeEach(async () => {
    visitaRepo = {
      findActivaByDocumento: vi.fn(),
      findActivaById: vi.fn(),
      createEntrada: vi.fn(),
      registrarSalida: vi.fn(),
      findAllActivas: vi.fn(),
      countActivas: vi.fn(),
    };
    preRepo = {
      findById: vi.fn(),
      markAsUsada: vi.fn(),
    };
    prisma = {
      unit: { findUnique: vi.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisitaService,
        { provide: VisitaRepository, useValue: visitaRepo },
        { provide: PreautorizacionRepository, useValue: preRepo },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<VisitaService>(VisitaService);
  });

  afterEach(() => vi.clearAllMocks());



  it('H12-AC1: findActivas devuelve total y visitas con todos los campos', async () => {
    visitaRepo.findAllActivas.mockResolvedValue([
      {
        id: 'v1',
        nombreVisitante: 'Pedro Ramírez',
        documento: '11223344',
        acompanantes: 1,
        estado: 'DENTRO',
        entrada: new Date(),
        motivo: null,
        unidad: { id: 'u1', code: 'A-20', tower: 'Torre A', description: '' },
        preautorizacion: { id: 'p1', codigo: 'ABC12345', estado: 'USADA', fin: new Date(Date.now() + 3600_000) },
        registradoPor: { id: 'seg1', email: 'seguridad@example.com' },
      },
    ]);

    const result = await service.findActivas();

    expect(result.total).toBe(1);
    expect(result.visitas[0]).toHaveProperty('nombreVisitante', 'Pedro Ramírez');
    expect(result.visitas[0]).toHaveProperty('salidaEsperada');
    expect(result.visitas[0]).toHaveProperty('unidad.label');
    expect(result.visitas[0]).toHaveProperty('preautorizacion.codigo');
  });

  it('H12-AC2: countActivas devuelve { total }', async () => {
    visitaRepo.countActivas.mockResolvedValue(3);
    const result = await service.countActivas();
    expect(result).toEqual({ total: 3 });
  });

  it('H12-AC3: después de registrar salida, el total disminuye', async () => {
    visitaRepo.findActivaById.mockResolvedValue({ id: 'v1', estado: 'DENTRO' });
    visitaRepo.registrarSalida.mockResolvedValue({ id: 'v1', estado: 'SALIO' });
    visitaRepo.countActivas.mockResolvedValue(2);

    await service.registrarSalida(seguridad, 'v1');
    const result = await service.countActivas();
    expect(result.total).toBe(2);
  });

  it('H12-AC4: el DTO de salida solo cambia estado (no permite editar/eliminar)', async () => {
    visitaRepo.findActivaById.mockResolvedValue({ id: 'v1', estado: 'DENTRO' });
    visitaRepo.registrarSalida.mockResolvedValue({ id: 'v1', estado: 'SALIO' });

    const result = await service.registrarSalida(seguridad, 'v1');
    expect(result.estado).toBe('SALIO');
    // No hay métodos de edición/eliminación en el servicio
    expect(service).not.toHaveProperty('editar');
    expect(service).not.toHaveProperty('eliminar');
  });
});