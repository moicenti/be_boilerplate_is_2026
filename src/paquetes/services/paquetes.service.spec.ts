import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PaquetesService } from './paquetes.service.js';
import type {
  PackageRepository,
  PackageWithRelations,
} from '@Paquetes/repositories';
import type { UnidadesService } from '@Unidades/services';
import type { CreatePackageDto, DeliverPackageDto } from '@Paquetes/dto';
import { PackageStatus, type Unit, type User } from '@PrismaClient';

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

const pending = {
  id: 'pkg-id',
  status: PackageStatus.PENDIENTE_RETIRO,
  pickupCode: '482913',
  deliveredAt: null,
  deliveredTo: null,
} as unknown as PackageWithRelations;

const delivered = {
  ...pending,
  status: PackageStatus.ENTREGADO,
  deliveredAt: new Date('2026-11-06T16:26:00Z'),
  deliveredTo: 'Ana Martínez',
} as unknown as PackageWithRelations;

const deliverDto: DeliverPackageDto = {
  pickupCode: '482913',
  deliveredTo: 'Ana Martínez',
};

function setup(
  foundUnit: Unit | null = unit,
  found: (PackageWithRelations | null)[] = [pending, delivered],
  marked = true,
) {
  const findById = vi.fn();
  found.forEach((value) => findById.mockResolvedValueOnce(value));
  const packageRepository = {
    nextNumber: vi.fn().mockResolvedValue(187),
    create: vi.fn().mockImplementation((data) => Promise.resolve(data)),
    findById,
    markDeliveredIfPending: vi.fn().mockResolvedValue(marked),
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

describe('PaquetesService.deliver', () => {
  it('marca el paquete como entregado con quien lo recoge y el guardia', async () => {
    const { service, packageRepository } = setup();

    const result = await service.deliver('pkg-id', deliverDto, guard);

    const [id, data] = packageRepository.markDeliveredIfPending.mock.calls[0];
    expect(id).toBe('pkg-id');
    expect(data.deliveredTo).toBe('Ana Martínez');
    expect(data.deliveredById).toBe(guard.id);
    expect(data.deliveredAt).toBeInstanceOf(Date);
    expect(result.status).toBe(PackageStatus.ENTREGADO);
  });

  it('responde 422 y no entrega si el código no coincide', async () => {
    const { service, packageRepository } = setup();

    await expect(
      service.deliver(
        'pkg-id',
        { pickupCode: '000000', deliveredTo: deliverDto.deliveredTo },
        guard,
      ),
    ).rejects.toThrow(
      new UnprocessableEntityException(
        'El código de retiro no corresponde a este paquete.',
      ),
    );
    expect(packageRepository.markDeliveredIfPending).not.toHaveBeenCalled();
  });

  it('responde 409 con la fecha y quién lo recibió si ya fue entregado', async () => {
    const { service, packageRepository } = setup(unit, [delivered]);

    const error = await service
      .deliver('pkg-id', deliverDto, guard)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ConflictException);
    const body = (error as ConflictException).getResponse() as Record<
      string,
      unknown
    >;
    expect(body.deliveredTo).toBe('Ana Martínez');
    expect(body.deliveredAt).toEqual(delivered.deliveredAt);
    expect(body.message).toContain('Ana Martínez');
    expect(packageRepository.markDeliveredIfPending).not.toHaveBeenCalled();
  });

  it('responde 409 si otro guardia lo entregó al mismo tiempo', async () => {
    const { service } = setup(unit, [pending, delivered], false);

    await expect(service.deliver('pkg-id', deliverDto, guard)).rejects.toThrow(
      ConflictException,
    );
  });

  it('responde 404 si el paquete no existe', async () => {
    const { service } = setup(unit, [null]);

    await expect(service.deliver('pkg-id', deliverDto, guard)).rejects.toThrow(
      NotFoundException,
    );
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
