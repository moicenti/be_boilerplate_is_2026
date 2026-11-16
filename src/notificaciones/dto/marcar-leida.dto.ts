import { IsBoolean } from 'class-validator';

/** PATCH /notificaciones/:id/leida. true = marcar como leída, false = desmarcar. */
export class MarcarLeidaDto {
  @IsBoolean()
  leida!: boolean;
}
