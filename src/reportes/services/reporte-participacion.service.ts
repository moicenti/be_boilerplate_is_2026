import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services';
import type { FiltrosResumen, ResumenQueryDto } from '@Reportes/dto';
import { SeccionesRepository } from '@Reportes/repositories';
import { esFechaValida, hoyEnElSalvador, primerDiaDelMes } from './filtros-resumen.js';

export interface ParticipacionVotacionRow {
  tema_id: string;
  folio_asamblea: string;
  asamblea_titulo: string;
  titulo: string;
  apertura: Date;
  cierre: Date;
  fecha: string;
  unidades_habilitadas: number;
  votantes: number;
  participacion: number | string;
}

const filtrosInvalidos = (mensaje: string) =>
  new BadRequestException({ codigo: 'FILTROS_INVALIDOS', mensaje });

@Injectable()
export class ReporteParticipacionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly secciones: SeccionesRepository,
  ) {}

  async obtenerReporte(query: ResumenQueryDto) {
    const filtros = await this.validarFiltros(query);

    const inicioUtc = new Date(`${filtros.desde}T00:00:00-06:00`);
    const finUtc = new Date(`${filtros.hasta}T23:59:59.999-06:00`);

    let listaMapeada: {
      temaId: string;
      folio: string;
      asambleaTitulo: string;
      titulo: string;
      fecha: string;
      fechaCierre: Date;
      unidadesHabilitadas: number;
      votantes: number;
      participacion: number;
    }[] = [];

    if (filtros.seccion) {
      // Filtrado por sección/torre: unidades activas de esa torre y votos únicos de unidades de esa torre
      const rows = await this.prisma.$queryRaw<ParticipacionVotacionRow[]>`
        SELECT
          t.id AS tema_id,
          a.folio AS folio_asamblea,
          a.title AS asamblea_titulo,
          t.title AS titulo,
          t.opens_at AS apertura,
          t.closes_at AS cierre,
          TO_CHAR((t.closes_at AT TIME ZONE 'America/El_Salvador')::date, 'YYYY-MM-DD') AS fecha,
          GREATEST(
            1,
            (SELECT COUNT(*)::int FROM units u WHERE u.activa = true AND u.tower = ${filtros.seccion})
          ) AS unidades_habilitadas,
          COUNT(DISTINCT u_voto.id)::int AS votantes,
          ROUND(
            (
              COUNT(DISTINCT u_voto.id)::numeric
              / GREATEST(1, (SELECT COUNT(*) FROM units u WHERE u.activa = true AND u.tower = ${filtros.seccion}))::numeric
            ) * 100,
            2
          )::numeric(5,2) AS participacion
        FROM temas_votacion t
        INNER JOIN asambleas a ON a.id = t.assembly_id
        LEFT JOIN participacion_votacion pv ON pv.tema_id = t.id
        LEFT JOIN units u_voto ON u_voto.id = pv.unidad_id AND u_voto.tower = ${filtros.seccion}
        WHERE a.published_at IS NOT NULL
          AND t.closes_at <= NOW()
          AND t.closes_at >= ${inicioUtc}
          AND t.closes_at <= ${finUtc}
        GROUP BY t.id, a.folio, a.title, t.title, t.opens_at, t.closes_at
        ORDER BY t.closes_at DESC
      `;

      listaMapeada = rows.map((r) => ({
        temaId: r.tema_id,
        folio: r.folio_asamblea,
        asambleaTitulo: r.asamblea_titulo,
        titulo: r.titulo,
        fecha: r.fecha,
        fechaCierre: r.cierre,
        unidadesHabilitadas: Number(r.unidades_habilitadas),
        votantes: Number(r.votantes),
        participacion: Number(Number(r.participacion).toFixed(2)),
      }));
    } else {
      const rows = await this.prisma.$queryRaw<ParticipacionVotacionRow[]>`
        SELECT
          tema_id,
          folio_asamblea,
          asamblea_titulo,
          titulo,
          apertura,
          cierre,
          fecha,
          unidades_habilitadas,
          votantes,
          participacion
        FROM vw_participacion_votaciones
        WHERE cierre >= ${inicioUtc}
          AND cierre <= ${finUtc}
        ORDER BY cierre DESC
      `;

      listaMapeada = rows.map((r) => ({
        temaId: r.tema_id,
        folio: r.folio_asamblea,
        asambleaTitulo: r.asamblea_titulo,
        titulo: r.titulo,
        fecha: r.fecha,
        fechaCierre: r.cierre,
        unidadesHabilitadas: Number(r.unidades_habilitadas),
        votantes: Number(r.votantes),
        participacion: Number(Number(r.participacion).toFixed(2)),
      }));
    }

    // Promedio de participación del periodo (2 decimales)
    const promedio =
      listaMapeada.length === 0
        ? 0
        : Number(
            (
              listaMapeada.reduce((acc, item) => acc + item.participacion, 0) /
              listaMapeada.length
            ).toFixed(2),
          );

    const totalOportunidades = listaMapeada.reduce(
      (acc, item) => acc + item.unidadesHabilitadas,
      0,
    );
    const totalParticipaciones = listaMapeada.reduce((acc, item) => acc + item.votantes, 0);

    // Convocatorias fuera del recuento (programadas, abiertas o en borrador)
    const fueraRecuento = await this.prisma.assembly.findMany({
      where: {
        OR: [
          { publishedAt: null },
          { topics: { some: { closesAt: { gt: new Date() } } } },
        ],
      },
      select: {
        folio: true,
        title: true,
        publishedAt: true,
      },
      take: 5,
    });

    return {
      promedio,
      resumenAcumulado: {
        totalVotacionesCerradas: listaMapeada.length,
        totalOportunidades,
        totalParticipaciones,
        sinParticipacion: Math.max(0, totalOportunidades - totalParticipaciones),
      },
      convocatoriasFueraRecuento: fueraRecuento.map((a) => ({
        folio: a.folio,
        titulo: a.title,
        estado: a.publishedAt ? 'PUBLICADA_PROGRAMADA' : 'BORRADOR',
      })),
      lista: listaMapeada,
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