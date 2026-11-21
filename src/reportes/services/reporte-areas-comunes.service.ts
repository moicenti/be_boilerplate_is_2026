import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@Prisma/services';
import { FiltrosReportesDto } from '../dto/filtros-reportes.dto.js';
import { AreaComunesResponseDto } from '../dto/area-comunes-response.dto.js';
import { SeccionesRepository } from '../repositories/secciones.repository.js';

/** Horas de un rango [inicio, fin] en fracciones decimales. */
function horasEntre(inicio: Date, fin: Date): number {
  return (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60);
}

/** Intersección de dos rangos [a1,a2] ∩ [b1,b2], o null si no se solapan. */
function interseccion(
  a1: Date,
  a2: Date,
  b1: Date,
  b2: Date,
): [Date, Date] | null {
  const inicio = a1 > b1 ? a1 : b1;
  const fin = a2 < b2 ? a2 : b2;
  return inicio < fin ? [inicio, fin] : null;
}

@Injectable()
export class ReporteAreasComunesService {
  private readonly logger = new Logger(ReporteAreasComunesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly secciones: SeccionesRepository,
  ) {}

  async obtener(
    filtros: FiltrosReportesDto,
  ): Promise<AreaComunesResponseDto[]> {
    filtros.validar();

    const desde = new Date(`${filtros.desde}T00:00:00.000Z`);
    const hasta = new Date(`${filtros.hasta}T23:59:59.999Z`);

    // 1. Resolvió el filtro de sección → userIds de residentes en esa torre.
    let userIdsFiltro: string[] | null = null;
    if (filtros.seccion) {
      const secciones = await this.secciones.listar();
      const target = secciones.find((s) => s.id === filtros.seccion);
      if (!target) {
        return []; // sección inexistente ya lo cubre validar() en resumen; aquí devolvemos vacío.
      }
      const unidades = await this.prisma.unit.findMany({
        where: { tower: target.torre },
        select: { code: true },
      });
      const codigos = unidades.map((u) => u.code);
      const residentes = await this.prisma.user.findMany({
        where: { unit: { in: codigos } },
        select: { id: true },
      });
      userIdsFiltro = residentes.map((r) => r.id);
      if (userIdsFiltro.length === 0) return [];
    }

    // 2. Áreas ACTIVAS con sus horarios, bloqueos y reservas confirmadas.
    const areas = await this.prisma.commonArea.findMany({
      where: { status: 'ACTIVA' },
      select: {
        id: true,
        name: true,
        schedules: {
          select: { dayOfWeek: true, opensAt: true, closesAt: true },
        },
        blocks: {
          where: { startsAt: { lte: hasta }, endsAt: { gte: desde } },
          select: { startsAt: true, endsAt: true },
        },
        reservations: {
          where: {
            status: 'CONFIRMADA',
            startsAt: { gte: desde },
            endsAt: { lte: hasta },
            ...(userIdsFiltro ? { userId: { in: userIdsFiltro } } : {}),
          },
          select: { startsAt: true, endsAt: true },
        },
      },
    });

    // 3. Días del periodo por día de semana (0=domingo … 6=sábado, estándar JS).
    const diasPorSemana = this.contarDiasPorSemana(desde, hasta);

    const resultado: AreaComunesResponseDto[] = [];

    for (const area of areas) {
      // 3a. Horas reservadas = suma de duración de reservas confirmadas.
      const horasReservadas = area.reservations.reduce(
        (acc, r) => acc + horasEntre(r.startsAt, r.endsAt),
        0,
      );

      // 3b. Horas disponibles = Σ (horas de horario × días de ese weekday) − horas de bloqueos en el periodo.
      let horasBrutas = 0;
      for (const s of area.schedules) {
        const horasDia = horasEntre(s.opensAt, s.closesAt);
        horasBrutas += horasDia * (diasPorSemana[s.dayOfWeek] ?? 0);
      }

      // Bloqueos: solo la parte que cae dentro del periodo.
      let horasBloqueadas = 0;
      for (const b of area.blocks) {
        const seg = interseccion(b.startsAt, b.endsAt, desde, hasta);
        if (seg) horasBloqueadas += horasEntre(seg[0], seg[1]);
      }

      const horasDisponibles = Math.max(0, horasBrutas - horasBloqueadas);

      // 3c. Regla: sin reservas → el área no aparece en la lista.
      if (area.reservations.length === 0) continue;

      const porcentaje =
        horasDisponibles > 0 ? (horasReservadas / horasDisponibles) * 100 : 0;

      resultado.push(
        AreaComunesResponseDto.fromEntity({
          areaId: area.id,
          nombre: area.name,
          reservas: area.reservations.length,
          horasReservadas,
          porcentaje,
        }),
      );
    }

    // 4. Orden por porcentaje descendente (área más usada primero).
    resultado.sort((a, b) => b.porcentaje - a.porcentaje);

    this.logger.debug(
      `H27: ${resultado.length} áreas con reservas en ${filtros.desde}→${filtros.hasta}`,
    );

    return resultado;
  }

  /** Cuenta cuántos días de cada weekday caen en [desde, hasta] (inclusive). */
  private contarDiasPorSemana(desde: Date, hasta: Date): number[] {
    const dias = new Array(7).fill(0);
    const cursor = new Date(desde);
    cursor.setUTCHours(12, 0, 0, 0); // mediodía UTC para evitar problemas de DST
    while (cursor <= hasta) {
      dias[cursor.getUTCDay()] += 1;
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return dias;
  }
}
