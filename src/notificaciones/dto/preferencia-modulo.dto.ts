import { IsBoolean, IsOptional, IsString } from 'class-validator';

/**
 * Un elemento del cuerpo de PUT /notificaciones/preferencias.
 * El residente sale siempre de la sesión. `residenteId` se acepta solo para poder
 * rechazar con 403 RECURSO_AJENO a quien intente escribir las preferencias de otro.
 */
export class PreferenciaModuloDto {
  @IsString()
  modulo!: string;

  @IsBoolean()
  activo!: boolean;

  @IsOptional()
  @IsString()
  residenteId?: string;
}
