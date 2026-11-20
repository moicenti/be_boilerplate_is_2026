import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsEnum } from 'class-validator';
import { MODULOS_NOTIFICACION } from './emitir-notificacion.dto.js'; // Reutiliza el catálogo de H23

export type FiltroLeidas = 'todas' | 'sin_leer' | 'leidas';

export class ListarNotificacionesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  size?: number;

  @IsOptional()
  @IsString()
  @IsEnum(MODULOS_NOTIFICACION, {
    message: `Módulo inválido. Debe ser uno de: ${MODULOS_NOTIFICACION.join(', ')}`,
  })
  modulo?: string;

  @IsOptional()
  @IsString()
  @IsEnum(['todas', 'sin_leer', 'leidas'], {
    message: "El filtro 'leidas' debe ser 'todas', 'sin_leer' o 'leidas'",
  })
  leidas?: FiltroLeidas;
}
