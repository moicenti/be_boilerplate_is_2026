import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CambioLeida,
  ConteoNoLeidas,
  ListadoNotificaciones,
  ListarNotificacionesQueryDto,
  SesionResidente,
} from '@Notificaciones/dto';
import { CentroNotificacionesRepository } from '@Notificaciones/repositories';

export const TAMANO_MAXIMO_PAGINA = 20;
const PAGINA_MAXIMA = 100_000;

function acotar(valor: unknown, defecto: number, min: number, max: number) {
  const n = Number(valor);
  if (valor === undefined || valor === null || !Number.isInteger(n)) {
    return defecto;
  }
  return Math.min(max, Math.max(min, n));
}

@Injectable()
export class CentroNotificacionesService {
  constructor(private readonly repo: CentroNotificacionesRepository) {}

  async listar(
    sesion: SesionResidente,
    query: ListarNotificacionesQueryDto,
  ): Promise<ListadoNotificaciones> {
    const page = acotar(query.page, 1, 1, PAGINA_MAXIMA);
    const size = acotar(
      query.size,
      TAMANO_MAXIMO_PAGINA,
      1,
      TAMANO_MAXIMO_PAGINA,
    );

    const { total, items } = await this.repo.listar(
      sesion.id,
      (page - 1) * size,
      size,
      query.modulo, // <-- NUEVO: Pasar filtro de módulo
      query.leidas, // <-- NUEVO: Pasar filtro de estado de lectura
    );

    return { total, page, size, items };
  }

  async contarNoLeidas(sesion: SesionResidente): Promise<ConteoNoLeidas> {
    return { count: await this.repo.contarNoLeidas(sesion.id) };
  }

  async cambiarLeida(
    sesion: SesionResidente,
    id: number,
    leida: boolean,
  ): Promise<CambioLeida> {
    const notificacion = await this.repo.buscarPropiedad(id);
    if (!notificacion) {
      throw new NotFoundException({
        codigo: 'NOTIFICACION_INEXISTENTE',
        mensaje: 'La notificación no existe',
      });
    }
    if (notificacion.residenteId !== sesion.id) {
      throw new ForbiddenException({
        codigo: 'RECURSO_AJENO',
        mensaje: 'La notificación no pertenece al usuario',
      });
    }
    if (notificacion.leida === leida) {
      return {
        id: notificacion.id,
        leida: notificacion.leida,
        fechaLectura: notificacion.fechaLectura,
      };
    }
    return this.repo.actualizarLeida(id, leida);
  }
}
