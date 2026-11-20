import { Injectable } from '@nestjs/common';
import { FiltrosReportesDto } from '@Reportes/dto';

@Injectable()
export class ReporteParticipacionService {
  async obtenerDetalle(_filtros: FiltrosReportesDto) {
    return { estado: 'no_disponible' as const };
  }
}
