import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, type User } from '@PrismaClient';
import { RolesGuard } from './roles.guard.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

function contextWithUser(user?: Partial<User>): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

function reflectorWith(metadata: Record<string, unknown>): Reflector {
  return {
    getAllAndOverride: (key: string) => metadata[key],
  } as unknown as Reflector;
}

describe('RolesGuard', () => {
  it('permite la ruta si no tiene @Roles()', () => {
    const guard = new RolesGuard(reflectorWith({}));
    expect(guard.canActivate(contextWithUser({ role: Role.RESIDENTE }))).toBe(
      true,
    );
  });

  it('permite la ruta pública aunque no haya usuario', () => {
    const guard = new RolesGuard(
      reflectorWith({ [IS_PUBLIC_KEY]: true, [ROLES_KEY]: [Role.SEGURIDAD] }),
    );
    expect(guard.canActivate(contextWithUser(undefined))).toBe(true);
  });

  it('permite al usuario con un rol requerido', () => {
    const guard = new RolesGuard(
      reflectorWith({ [ROLES_KEY]: [Role.SEGURIDAD, Role.ADMINISTRADOR] }),
    );
    expect(guard.canActivate(contextWithUser({ role: Role.SEGURIDAD }))).toBe(
      true,
    );
  });

  it('responde 403 al residente en una ruta de seguridad', () => {
    const guard = new RolesGuard(
      reflectorWith({ [ROLES_KEY]: [Role.SEGURIDAD] }),
    );
    expect(() =>
      guard.canActivate(contextWithUser({ role: Role.RESIDENTE })),
    ).toThrow(ForbiddenException);
  });

  it('responde 403 si no hay usuario en el request', () => {
    const guard = new RolesGuard(
      reflectorWith({ [ROLES_KEY]: [Role.SEGURIDAD] }),
    );
    expect(() => guard.canActivate(contextWithUser(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
