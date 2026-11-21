import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@Prisma'; // ✅ Alias correcto según tu tsconfig
import { FiltrosReportesDto } from '../../dto/filtros-reportes.dto.js';
import { SeccionesRepository } from '../../repositories/secciones.repository.js';

// ✅ La palabra 'export' es OBLIGATORIA aquí
export interface OcupacionValor {
  porcentaje: number;
}

@Injectable()
export class OcupacionIndicador {
  private readonly logger = new Logger(OcupacionIndicador.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly secciones: SeccionesRepository,
  ) {}

  async calcular(filtros: FiltrosReportesDto): Promise<OcupacionValor> {
    const desde = new Date(filtros.desde);
    const hasta = new Date(filtros.hasta);
    hasta.setHours(23, 59, 59, 999);

    const reservas = await this.prisma.reservation.findMany({
      where: {
        status: 'CONFIRMADA',
        startsAt: { gte: desde },
        endsAt: { lte: hasta },
      },
      select: { startsAt: true, endsAt: true },
    });

    let horasReservadas = 0;
    // ✅ Tipado explícito para evitar el error "Parameter 'r' implicitly has an 'any' type"
    reservas.forEach((r: { startsAt: Date; endsAt: Date }) => {
      horasReservadas +=
        (r.endsAt.getTime() - r.startsAt.getTime()) / (1000 * 60 * 60);
    });

    const horasPermitidas = 100;
    const porcentaje =
      horasPermitidas > 0 ? (horasReservadas / horasPermitidas) * 100 : 0;

    return { porcentaje: parseFloat(porcentaje.toFixed(2)) };
  }
}
