import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';
import { UserRepository } from '@Users/repositories';
import { EmailAlreadyTakenError, UnitNotFoundError } from '@Users/errors';
import type { CreateUserDto, ListUsersQueryDto } from '@Users/dto';
import type { EnvConfig } from '@Config';
import { Role, type User } from '@PrismaClient';

@Injectable()
export class UsersService {
  private readonly saltRounds: number;

  constructor(
    private readonly userRepository: UserRepository,
    configService: ConfigService<EnvConfig, true>,
  ) {
    this.saltRounds = configService.get('BCRYPT_SALT_ROUNDS', { infer: true });
  }

  async create({ email, password, role, unitId }: CreateUserDto): Promise<User> {
    if (role === Role.SEGURIDAD && unitId !== undefined) {
      throw new BadRequestException(
        'El personal de seguridad no pertenece a una unidad: no envíes unitId.',
      );
    }

    const passwordHash = await this.hashPassword(password);

    try {
      return await this.userRepository.create({
        email,
        passwordHash,
        role,
        unitId: unitId ?? null,
      });
    } catch (error) {
      if (error instanceof EmailAlreadyTakenError) {
        throw new ConflictException('El email ya está registrado.');
      }
      if (error instanceof UnitNotFoundError) {
        throw new NotFoundException('La unidad indicada no existe en el condominio.');
      }
      throw error;
    }
  }

  list({ role, activo }: ListUsersQueryDto): Promise<User[]> {
    return this.userRepository.findManageable({ role, isActive: activo });
  }

  async deactivate(id: string): Promise<User> {
    const target = await this.userRepository.findById(id);
    if (!target) {
      throw new NotFoundException('El usuario no existe.');
    }
    if (target.role === Role.ADMINISTRADOR) {
      throw new ForbiddenException(
        'Solo se pueden desactivar cuentas de residentes o de seguridad.',
      );
    }

    const deactivated = await this.userRepository.deactivate(id, new Date());
    if (!deactivated) {
      throw new ConflictException('La cuenta ya está desactivada.');
    }
    return deactivated;
  }

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  verifyPassword(password: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }
}