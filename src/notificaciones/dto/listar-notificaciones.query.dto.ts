import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional } from 'class-validator';
import {
  MODULOS_NOTIFICACION,
  type ModuloNotificacion,
} from './modulos-notificacion.js';

/** GET /notificaciones?page=1&size=20&modulo=pagos&leidas=false. El tope de 20 por página se aplica en el servicio. */
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
  @IsIn(MODULOS_NOTIFICACION, { message: 'modulo no es un módulo válido.' })
  modulo?: ModuloNotificacion;

  // En la query llega como texto; solo 'true'/'false' son válidos.
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean({ message: 'leidas debe ser true o false.' })
  leidas?: boolean;
}
