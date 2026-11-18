import { HttpException } from '@nestjs/common';
/**
 * Excepción HTTP con un código de error de negocio estable.
 *
 * El `codigo` es el contrato con el frontend (no cambia); el `mensaje` es
 * texto legible para mostrar al usuario.
 */
export class ApiException extends HttpException {
    constructor(status, codigo, mensaje) {
        super({ codigo, mensaje }, status);
    }
}
