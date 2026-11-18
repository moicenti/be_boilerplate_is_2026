import { IsOptional } from 'class-validator';

/**
 * GET /reportes/resumen?desde=2026-11-01&hasta=2026-11-30&seccion=3
 *
 * Los valores llegan sin validar a propósito: el servicio los revisa y responde
 * 400 FILTROS_INVALIDOS con { codigo, mensaje }, que es el formato del diseño.
 */
export class ResumenQueryDto {
  @IsOptional()
  desde?: unknown;

  @IsOptional()
  hasta?: unknown;

  @IsOptional()
  seccion?: unknown;
}
