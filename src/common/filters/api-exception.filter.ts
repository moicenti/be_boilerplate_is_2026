import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import type { ApiErrorBody } from '../errors/index.js';

/** Código por defecto para excepciones de Nest que no traen uno propio. */
const DEFAULT_CODES: Partial<Record<number, string>> = {
  [HttpStatus.BAD_REQUEST]: 'SOLICITUD_INVALIDA',
  [HttpStatus.UNAUTHORIZED]: 'NO_AUTENTICADO',
  [HttpStatus.FORBIDDEN]: 'ROL_NO_PERMITIDO',
  [HttpStatus.NOT_FOUND]: 'RECURSO_INEXISTENTE',
  [HttpStatus.CONFLICT]: 'CONFLICTO',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'DATOS_INVALIDOS',
};

/**
 * Normaliza cualquier HttpException al formato `{codigo, mensaje}`.
 *
 * - Si la excepción ya es una ApiException, su cuerpo se respeta tal cual.
 * - Si no (ValidationPipe, ParseIntPipe, el guard JWT...), se deriva el código
 *   del status y el mensaje del cuerpo original. Los errores de validación
 *   llegan como arreglo de mensajes y se unen en uno solo.
 *
 * Se aplica por controlador con `@UseFilters` para no cambiar el formato de
 * los endpoints que ya existen (auth, users, incidencias).
 */
@Catch(HttpException)
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception.getStatus();
    response.status(status).json(this.toBody(exception, status));
  }

  private toBody(exception: HttpException, status: number): ApiErrorBody {
    const original = exception.getResponse();

    if (typeof original === 'object' && original !== null && 'codigo' in original) {
      return original as ApiErrorBody;
    }

    const rawMessage =
      typeof original === 'string'
        ? original
        : (original as { message?: string | string[] }).message;

    return {
      codigo: DEFAULT_CODES[status] ?? 'ERROR',
      mensaje: Array.isArray(rawMessage)
        ? rawMessage.join('. ')
        : (rawMessage ?? exception.message),
    };
  }
}
