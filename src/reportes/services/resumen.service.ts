import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type {
  FiltrosResumen,
  NoDisponible,
  ResumenIndicadores,
  ResumenQueryDto,
} from '@Reportes/dto';
import { SeccionesRepository } from '@Reportes/repositories';
import {
  esFechaValida,
  hoyEnElSalvador,
  primerDiaDelMes,
} from './filtros-resumen.js';
import {
  FuenteNoDisponibleError,
  IncidenciasIndicador,
  MorosidadIndicador,
  OcupacionIndicador,
  ParticipacionIndicador,
} from './indicadores/index.js';

const NO_DISPONIBLE: NoDisponible = { estado: 'no_disponible' };

const filtrosInvalidos = (mensaje: string) =>
  new BadRequestException({ codigo: 'FILTROS_INVALIDOS', mensaje });

@Injectable()
export class ResumenService {
  private readonly logger = new Logger(ResumenService.name);

  constructor(
    private readonly secciones: SeccionesRepository,
    private readonly morosidad: MorosidadIndicador,
    private readonly ocupacion: OcupacionIndicador,
    private readonly incidencias: IncidenciasIndicador,
    private readonly participacion: ParticipacionIndicador,
  ) {}

  /** Los 4 indicadores en paralelo. Si uno falla, solo ese sale como no_disponible. */
  async obtener(query: ResumenQueryDto): Promise<ResumenIndicadores> {
    const filtros = await this.validarFiltros(query);

    const [morosidad, ocupacion, incidencias, participacion] = await Promise.all([
      this.aislar('morosidad', () => this.morosidad.calcular(filtros)),
      this.aislar('ocupacion', () => this.ocupacion.calcular(filtros)),
      this.aislar('incidencias', () => this.incidencias.calcular(filtros)),
      this.aislar('participacion', () => this.participacion.calcular(filtros)),
    ]);

    return { morosidad, ocupacion, incidencias, participacion };
  }

  /**
   * Sin fechas usa el mes en curso: desde = día 1, hasta = hoy (hora de El Salvador).
   * Esos valores por defecto no vienen en el diseño; hay que confirmarlos con el equipo.
   */
  private async validarFiltros(query: ResumenQueryDto): Promise<FiltrosResumen> {
    const hoy = hoyEnElSalvador();
    const desde = this.fecha('desde', query.desde, primerDiaDelMes(hoy));
    const hasta = this.fecha('hasta', query.hasta, hoy);
    if (desde > hasta) {
      throw filtrosInvalidos("La fecha 'desde' no puede ser mayor que 'hasta'");
    }

    const seccion = this.seccion(query.seccion);
    if (seccion !== undefined && !(await this.secciones.existe(seccion))) {
      throw filtrosInvalidos(`La sección '${seccion}' no existe`);
    }

    return seccion === undefined ? { desde, hasta } : { desde, hasta, seccion };
  }

  private fecha(nombre: string, valor: unknown, porDefecto: string): string {
    if (valor === undefined) return porDefecto;
    if (typeof valor !== 'string' || !esFechaValida(valor)) {
      throw filtrosInvalidos(`'${nombre}' debe ser una fecha válida con formato AAAA-MM-DD`);
    }
    return valor;
  }

  private seccion(valor: unknown): string | undefined {
    if (valor === undefined) return undefined;
    if (typeof valor !== 'string' || valor.trim() === '') {
      throw filtrosInvalidos("'seccion' no puede estar vacía");
    }
    return valor.trim();
  }

  /** try/catch propio de cada indicador: el error se registra y no llega al cliente. */
  private async aislar<T>(
    nombre: string,
    calcular: () => Promise<T>,
  ): Promise<T | NoDisponible> {
    try {
      return await calcular();
    } catch (error) {
      if (error instanceof FuenteNoDisponibleError) {
        this.logger.warn(error.message);
      } else {
        this.logger.error(
          `Falló el indicador '${nombre}': ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      return NO_DISPONIBLE;
    }
  }
}
