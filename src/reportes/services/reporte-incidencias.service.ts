import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services';
import type { FiltrosResumen, ResumenQueryDto } from '@Reportes/dto';
import { SeccionesRepository } from '@Reportes/repositories';
import { esFechaValida, hoyEnElSalvador, primerDiaDelMes } from './filtros-resumen.js';

export interface IncidenciaAbiertaRow {
  id: string;
  folio: string;
  titulo: string;
  categoria: string;
  ubicacion: string;
  unidad: string;
  seccion: string;
  estado: string;
  prioridad: string;
  fecha_creacion: Date;
  dias_abierta: number;
}

const filtrosInvalidos = (mensaje: string) =>
  new BadRequestException({ codigo: 'FILTROS_INVALIDOS', mensaje });

@Injectable()
export class ReporteIncidenciasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly secciones: SeccionesRepository,
  ) {}

  async obtenerReporte(query: ResumenQueryDto) {
    const filtros = await this.validarFiltros(query);

    const inicioUtc = new Date(`${filtros.desde}T00:00:00-06:00`);
    const finUtc = new Date(`${filtros.hasta}T23:59:59.999-06:00`);

    const filas = filtros.seccion
      ? await this.prisma.$queryRaw<IncidenciaAbiertaRow[]>`
          SELECT id, folio, titulo, categoria, ubicacion, unidad, seccion, estado, prioridad, fecha_creacion, dias_abierta
          FROM vw_incidencias_abiertas
          WHERE fecha_creacion >= ${inicioUtc}
            AND fecha_creacion <= ${finUtc}
            AND seccion = ${filtros.seccion}
          ORDER BY fecha_creacion ASC
        `
      : await this.prisma.$queryRaw<IncidenciaAbiertaRow[]>`
          SELECT id, folio, titulo, categoria, ubicacion, unidad, seccion, estado, prioridad, fecha_creacion, dias_abierta
          FROM vw_incidencias_abiertas
          WHERE fecha_creacion >= ${inicioUtc}
            AND fecha_creacion <= ${finUtc}
          ORDER BY fecha_creacion ASC
        `;

    const porEstado: Record<string, number> = {
      ABIERTO: 0,
      EN_PROCESO: 0,
    };

    const porPrioridad: Record<string, number> = {
      BAJA: 0,
      MEDIA: 0,
      ALTA: 0,
      CRITICA: 0,
      SIN_PRIORIDAD: 0,
    };

    for (const item of filas) {
      porEstado[item.estado] = (porEstado[item.estado] ?? 0) + 1;
      porPrioridad[item.prioridad] = (porPrioridad[item.prioridad] ?? 0) + 1;
    }

    return {
      total: filas.length,
      porEstado,
      porPrioridad,
      lista: filas.map((item) => ({
        id: item.id,
        folio: item.folio,
        titulo: item.titulo,
        categoria: item.categoria,
        ubicacion: item.ubicacion,
        unidad: item.unidad,
        seccion: item.seccion,
        estado: item.estado,
        prioridad: item.prioridad,
        fechaCreacion: item.fecha_creacion,
        diasAbierta: Number(item.dias_abierta),
      })),
    };
  }

  private async validarFiltros(query: ResumenQueryDto): Promise<FiltrosResumen> {
    const hoy = hoyEnElSalvador();
    const desde = this.validarFecha('desde', query.desde, primerDiaDelMes(hoy));
    const hasta = this.validarFecha('hasta', query.hasta, hoy);
    if (desde > hasta) {
      throw filtrosInvalidos("La fecha 'desde' no puede ser mayor que 'hasta'");
    }

    let seccion: string | undefined;
    if (query.seccion !== undefined) {
      if (typeof query.seccion !== 'string' || query.seccion.trim() === '') {
        throw filtrosInvalidos("'seccion' no puede estar vacía");
      }
      seccion = query.seccion.trim();
      if (!(await this.secciones.existe(seccion))) {
        throw filtrosInvalidos(`La sección '${seccion}' no existe`);
      }
    }

    return seccion ? { desde, hasta, seccion } : { desde, hasta };
  }

  private validarFecha(nombre: string, valor: unknown, defecto: string): string {
    if (valor === undefined) return defecto;
    if (typeof valor !== 'string' || !esFechaValida(valor)) {
      throw filtrosInvalidos(`'${nombre}' debe ser una fecha válida con formato AAAA-MM-DD`);
    }
    return valor;
  }
}