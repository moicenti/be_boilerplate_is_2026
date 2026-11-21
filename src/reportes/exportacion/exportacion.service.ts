import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '@Prisma/services';
import type { ResumenQueryDto } from '@Reportes/dto';
import { ReporteIncidenciasService, ResumenService } from '@Reportes/services';
import { esFechaValida, hoyEnElSalvador, primerDiaDelMes } from '../services/filtros-resumen.js';
import { formatearFecha, formatearFechaHora, formatearMonto } from './formato-fecha.js';
import {
  MENSAJE_SIN_DATOS,
  ReportePdfRenderer,
  TITULOS_REPORTE,
  esTipoReporte,
  type ReporteDocumento,
  type TipoReporte,
} from './exportacion.types.js';

export interface ArchivoExportado {
  buffer: Buffer;
  nombreArchivo: string;
}

interface Periodo {
  desde: string;
  hasta: string;
}

const noDisponible = (v: unknown): boolean =>
  typeof v === 'object' && v !== null && (v as { estado?: string }).estado === 'no_disponible';

@Injectable()
export class ReporteExportacionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resumen: ResumenService,
    private readonly incidencias: ReporteIncidenciasService,
    private readonly renderer: ReportePdfRenderer,
  ) {}

  async exportar(
    tipo: string,
    query: ResumenQueryDto,
    sesion: { id: string },
  ): Promise<ArchivoExportado> {
    if (!esTipoReporte(tipo)) {
      throw new NotFoundException({
        codigo: 'REPORTE_INEXISTENTE',
        mensaje: `El reporte '${tipo}' no existe`,
      });
    }

    // Los mismos servicios que usa la pantalla: validan los filtros y devuelven los mismos datos.
    const cuerpo = await this.cuerpo(tipo, query);
    const periodo = this.periodo(query);
    const administrador = await this.nombreAdministrador(sesion.id);

    const documento: ReporteDocumento = {
      titulo: TITULOS_REPORTE[tipo],
      periodo: `${formatearFecha(periodo.desde)} al ${formatearFecha(periodo.hasta)}`,
      ...(typeof query.seccion === 'string' && query.seccion.trim() !== ''
        ? { seccion: query.seccion.trim() }
        : {}),
      generadoEn: formatearFechaHora(new Date()),
      administrador,
      mensajeVacio: MENSAJE_SIN_DATOS,
      ...cuerpo,
    };

    return {
      buffer: await this.renderer.render(documento),
      nombreArchivo: `reporte-${tipo}-${periodo.desde}_${periodo.hasta}.pdf`,
    };
  }

  private async cuerpo(
    tipo: TipoReporte,
    query: ResumenQueryDto,
  ): Promise<Pick<ReporteDocumento, 'resumen' | 'columnas' | 'filas'>> {
    switch (tipo) {
      case 'resumen':
        return this.cuerpoResumen(query);
      case 'incidencias':
        return this.cuerpoIncidencias(query);
      default:
        // Su servicio de consulta aún no existe: se exporta cuando la historia dueña lo conecte.
        throw new ServiceUnavailableException({
          codigo: 'REPORTE_NO_DISPONIBLE',
          mensaje: `El reporte '${tipo}' aún no está disponible para exportar`,
        });
    }
  }

  private async cuerpoResumen(query: ResumenQueryDto) {
    const r = await this.resumen.obtener(query);
    const valor = (v: unknown, f: () => string) => (noDisponible(v) ? 'No disponible' : f());
    const mor = r.morosidad as { porcentaje: number; monto: number };
    const ocu = r.ocupacion as { porcentaje: number };
    const inc = r.incidencias as { cantidad: number };
    const par = r.participacion as { porcentaje: number };
    return {
      resumen: [],
      columnas: [
        { titulo: 'Indicador', ancho: 3 },
        { titulo: 'Valor', ancho: 3, alinear: 'right' as const },
      ],
      filas: [
        ['Morosidad', valor(mor, () => `${mor.porcentaje} % · adeudado ${formatearMonto(mor.monto)}`)],
        ['Ocupación de áreas comunes', valor(ocu, () => `${ocu.porcentaje} %`)],
        ['Incidencias abiertas', valor(inc, () => String(inc.cantidad))],
        ['Participación en votaciones', valor(par, () => `${par.porcentaje} %`)],
      ],
    };
  }

  private async cuerpoIncidencias(query: ResumenQueryDto) {
    const r = await this.incidencias.obtenerReporte(query);
    return {
      resumen:
        r.total === 0
          ? []
          : [
              `Total: ${r.total} · Abiertas: ${r.porEstado['ABIERTO'] ?? 0} · En proceso: ${r.porEstado['EN_PROCESO'] ?? 0}`,
            ],
      columnas: [
        { titulo: 'Folio', ancho: 2 },
        { titulo: 'Título', ancho: 4 },
        { titulo: 'Categoría', ancho: 2 },
        { titulo: 'Unidad', ancho: 1.5 },
        { titulo: 'Estado', ancho: 1.8 },
        { titulo: 'Prioridad', ancho: 1.8 },
        { titulo: 'Creada', ancho: 2 },
        { titulo: 'Días', ancho: 1, alinear: 'right' as const },
      ],
      filas: r.lista.map((i) => [
        i.folio,
        i.titulo,
        i.categoria,
        i.unidad,
        i.estado,
        i.prioridad,
        formatearFecha(hoyEnElSalvador(new Date(i.fechaCreacion))),
        String(i.diasAbierta),
      ]),
    };
  }

  /** Ya validados por el servicio de consulta; aquí solo se completan los valores por defecto. */
  private periodo(query: ResumenQueryDto): Periodo {
    const hoy = hoyEnElSalvador();
    const tomar = (v: unknown, defecto: string) =>
      typeof v === 'string' && esFechaValida(v) ? v : defecto;
    return {
      desde: tomar(query.desde, primerDiaDelMes(hoy)),
      hasta: tomar(query.hasta, hoy),
    };
  }

  /** User no tiene campo de nombre: se identifica al administrador por su correo. */
  private async nombreAdministrador(id: string): Promise<string> {
    const usuario = await this.prisma.user.findUnique({
      where: { id },
      select: { email: true },
    });
    return usuario?.email ?? id;
  }
}
