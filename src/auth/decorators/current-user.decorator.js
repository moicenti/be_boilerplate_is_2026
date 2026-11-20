import { createParamDecorator } from '@nestjs/common';
/**
 * Extrae el usuario que JwtAuthGuard adjuntó al request.
 * Solo tiene sentido en rutas protegidas por el guard.
 */
export const CurrentUser = createParamDecorator((_data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
});
