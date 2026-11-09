import { HttpException, HttpStatus } from '@nestjs/common';

/** Cuerpo de error común a toda la API: `{"codigo": "...", "mensaje": "..."}`. */
export interface ApiErrorBody {
  codigo: string;
  mensaje: string;
}

/**
 * Excepción HTTP con un código de error de negocio estable.
 *
 * El `codigo` es el contrato con el frontend (no cambia); el `mensaje` es
 * texto legible para mostrar al usuario.
 */
export class ApiException extends HttpException {
  constructor(status: HttpStatus, codigo: string, mensaje: string) {
    super({ codigo, mensaje } satisfies ApiErrorBody, status);
  }
}
