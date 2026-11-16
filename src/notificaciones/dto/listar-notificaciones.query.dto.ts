import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

/** GET /notificaciones?page=1&size=20. El tope de 20 por página se aplica en el servicio. */
export class ListarNotificacionesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  size?: number;
}
