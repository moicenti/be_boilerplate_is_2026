import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Role } from '@PrismaClient';
import { CreateUserDto } from '../dto/create-user.dto.js';
import { EmailAlreadyTakenError, UnitNotFoundError } from '../errors/index.js';
import type { UserRepository } from '../repositories/index.js';
import { UsersService } from './users.service.js';

const UNIT_ID = '0b6f1c2e-4a3d-4f8e-9c1b-2d3e4f5a6b7c';
const base = { email: 'nuevo@example.com', password: 'Str0ngPass' };

function serviceWith(create: UserRepository['create']) {
  const repository = { create } as unknown as UserRepository;
  const config = { get: () => 4 } as unknown as ConfigService;
  return new UsersService(repository, config as never);
}

async function errorsFor(body: object): Promise<string[]> {
  const errors = await validate(plainToInstance(CreateUserDto, body));
  return errors.map((e) => e.property);
}

describe('CreateUserDto', () => {
  it('acepta un residente con unidad y un guardia sin unidad', async () => {
    expect(await errorsFor({ ...base, role: Role.RESIDENTE, unitId: UNIT_ID })).toEqual([]);
    expect(await errorsFor({ ...base, role: Role.SEGURIDAD })).toEqual([]);
  });

  it('exige unitId para un residente', async () => {
    expect(await errorsFor({ ...base, role: Role.RESIDENTE })).toEqual(['unitId']);
  });

  it('rechaza crear administradores o roles inexistentes', async () => {
    expect(await errorsFor({ ...base, role: Role.ADMINISTRADOR })).toEqual(['role']);
    expect(await errorsFor({ ...base, role: 'MANTENIMIENTO' })).toEqual(['role']);
    expect(await errorsFor({ ...base })).toEqual(['role']);
  });
});

describe('UsersService.create', () => {
  it('crea el residente con su rol y su unidad', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'u1' });
    await serviceWith(create).create({ ...base, role: Role.RESIDENTE, unitId: UNIT_ID });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ role: Role.RESIDENTE, unitId: UNIT_ID }),
    );
  });

  it('crea el guardia sin unidad', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'u2' });
    await serviceWith(create).create({ ...base, role: Role.SEGURIDAD });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ role: Role.SEGURIDAD, unitId: null }),
    );
  });

  it('responde 400 si un guardia trae unidad', async () => {
    const create = vi.fn();
    await expect(
      serviceWith(create).create({ ...base, role: Role.SEGURIDAD, unitId: UNIT_ID }),
    ).rejects.toThrow(BadRequestException);
    expect(create).not.toHaveBeenCalled();
  });

  it('responde 404 si la unidad no existe', async () => {
    const create = vi.fn().mockRejectedValue(new UnitNotFoundError(UNIT_ID));
    await expect(
      serviceWith(create).create({ ...base, role: Role.RESIDENTE, unitId: UNIT_ID }),
    ).rejects.toThrow(NotFoundException);
  });

  it('responde 409 si el email ya está registrado', async () => {
    const create = vi.fn().mockRejectedValue(new EmailAlreadyTakenError(base.email));
    await expect(
      serviceWith(create).create({ ...base, role: Role.SEGURIDAD }),
    ).rejects.toThrow(ConflictException);
  });
});
