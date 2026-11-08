import { SetMetadata } from '@nestjs/common';
import type { Role } from '@PrismaClient';

export const ROLES_KEY = 'roles';

/**
 * Restringe una ruta (o un controlador entero) a los roles indicados.
 * Lo hace cumplir RolesGuard; sin este decorador, cualquier usuario
 * autenticado puede acceder.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
