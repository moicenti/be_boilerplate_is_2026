import { NotFoundException } from '@nestjs/common';
import { PaquetesService } from './paquetes.service.js';
import type { PackageRepository } from '@Paquetes/repositories';
import type { UnidadesService } from '@Unidades/services';
import type { CreatePackageDto } from '@Paquetes/dto';
import type { Unit, User } from '@PrismaClient';

const unit: Unit = {
  id: '6f1c2a4e-1b2c-4d5e-8f90-123456789abc',
  code: 'A-202',
  tower: 'Torre A',
  description: 'Torre A, departamento 202',
  createdAt: new Date(),
};

const guard = { id: 'guard-id', email: 'ricardo.soto@example.com' } as User;

const dto: CreatePackageDto = {
  unitId: unit.id,
  recipientName: 'Carlos Mendoza',
  carrier: 'Estafeta',
  trackingReference: 'EST-629483715',
  description: '1 caja mediana de cartón, cerrada.',
};

function setup(foundUnit: Unit | null = unit) {
  const packageRepository = {
    nextNumber: vi.fn().mockResolvedValue(187),
    create: vi.fn().mockImplementation((data) => Promise.resolve(data)),
  };
  const unidadesService = {
    findById: vi.fn().mockResolvedValue(foundUnit),
  };
  const service = new PaquetesService(
    packageRepository as unknown as PackageRepository,
    unidadesService as unknown as UnidadesService,
  );
  return { service, packageRepository };
}

describe('PaquetesService.register', () => {
  it('guarda el paquete con folio, código de 6 dígitos y el guardia que lo recibió', async () => {
    const { service, packageRepository } = setup();

    await service.register(dto, guard);

    const data = packageRepository.create.mock.calls[0][0];
    expect(data.folio).toBe(`PAQ-${new Date().getFullYear()}-0187`);
    expect(data.number).toBe(187);
    expect(data.pickupCode).toMatch(/^\d{6}$/);
    expect(data.receivedById).toBe(guard.id);
    expect(data.unitId).toBe(unit.id);
    expect(data.recipientName).toBe(dto.recipientName);
  });

  it('responde 404 y no guarda si la unidad no existe', async () => {
    const { service, packageRepository } = setup(null);

    await expect(service.register(dto, guard)).rejects.toThrow(
      NotFoundException,
    );
    expect(packageRepository.nextNumber).not.toHaveBeenCalled();
    expect(packageRepository.create).not.toHaveBeenCalled();
  });
});

describe('PaquetesService helpers', () => {
  const { service } = setup();

  it('rellena el folio con ceros a 4 dígitos', () => {
    expect(service.buildFolio(7, new Date(2026, 10, 7))).toBe('PAQ-2026-0007');
    expect(service.buildFolio(12345, new Date(2026, 10, 7))).toBe(
      'PAQ-2026-12345',
    );
  });

  it('genera siempre códigos de exactamente 6 dígitos', () => {
    for (let i = 0; i < 500; i++) {
      expect(service.generatePickupCode()).toMatch(/^\d{6}$/);
    }
  });
});
