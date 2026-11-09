import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@PrismaClient';
import { ApiException } from '@Common/errors';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import type { RequestWithUser } from '../decorators/current-user.decorator.js';

/**
 * Verifica que el usuario autenticado tenga alguno de los roles exigidos con
 * `@Roles(...)`. Corre después de JwtAuthGuard (global), así que el usuario
 * ya está cargado en el request. El rol sale siempre de la base, nunca del
 * cuerpo de la petición.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<RequestWithUser>();
    if (user && requiredRoles.includes(user.role)) return true;

    throw new ApiException(
      HttpStatus.FORBIDDEN,
      'ROL_NO_PERMITIDO',
      'Tu rol no tiene permiso para usar este endpoint.',
    );
  }
}
