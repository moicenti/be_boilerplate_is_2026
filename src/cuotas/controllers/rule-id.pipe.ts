import { HttpStatus, ParseIntPipe } from '@nestjs/common';
import { ApiException } from '@Common/errors';

/** `:id` de una regla de cuota; si no es entero responde 400 SOLICITUD_INVALIDA. */
export const parseRuleId = new ParseIntPipe({
  exceptionFactory: () =>
    new ApiException(
      HttpStatus.BAD_REQUEST,
      'SOLICITUD_INVALIDA',
      'El id de la regla debe ser un número entero.',
    ),
});
