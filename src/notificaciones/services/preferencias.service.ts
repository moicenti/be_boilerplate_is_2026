import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {
  esModuloValido,
  MODULOS_NOTIFICACION,
} from '@Notificaciones/dto';
import type {
  PreferenciaModulo,
  PreferenciaModuloDto,
  SesionResidente,
} from '@Notificaciones/dto';
import {
  PreferenciasRepository,
  type FilaPreferencia,
} from '@Notificaciones/repositories';

@Injectable()
export class PreferenciasService {
  constructor(private readonly repo: PreferenciasRepository) {}

  /** Siempre devuelve los 7 módulos del catálogo; los que no tienen fila vienen activos. */
  async obtener(sesion: SesionResidente): Promise<PreferenciaModulo[]> {
    return this.completar(await this.repo.listar(sesion.id));
  }

  /** Guarda todo o nada. Devuelve la lista completa ya actualizada. */
  async guardar(
    sesion: SesionResidente,
    cambios: PreferenciaModuloDto[],
  ): Promise<PreferenciaModulo[]> {
    // Primero la propiedad: nunca se escriben preferencias de otro residente.
    if (cambios.some((c) => c.residenteId !== undefined && c.residenteId !== sesion.id)) {
      throw new ForbiddenException({
        codigo: 'RECURSO_AJENO',
        mensaje: 'No se pueden modificar las preferencias de otro residente',
      });
    }

    const invalido = cambios.find((c) => !esModuloValido(c.modulo));
    if (invalido) {
      throw new BadRequestException({
        codigo: 'MODULO_INVALIDO',
        mensaje: `El módulo '${invalido.modulo}' no existe en el catálogo`,
      });
    }

    // Si un módulo viene repetido, vale el último.
    const porModulo = new Map<string, boolean>();
    for (const c of cambios) porModulo.set(c.modulo, c.activo);

    const filas = await this.repo.guardar(
      sesion.id,
      [...porModulo].map(([modulo, activo]) => ({ modulo, activo })),
    );
    return this.completar(filas);
  }

  private completar(filas: FilaPreferencia[]): PreferenciaModulo[] {
    const guardadas = new Map(filas.map((f) => [f.moduloOrigen, f.activo]));
    return MODULOS_NOTIFICACION.map((modulo) => ({
      modulo,
      activo: guardadas.get(modulo) ?? true,
    }));
  }
}
