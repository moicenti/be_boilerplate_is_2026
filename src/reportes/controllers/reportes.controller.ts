import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@Auth/decorators';
import { Role } from '@PrismaClient';
import { ResumenQueryDto } from '@Reportes/dto';
import {
  ReporteIncidenciasService,
  ReporteParticipacionService,
  ResumenService,
} from '@Reportes/services';

@ApiTags('reportes')
@ApiBearerAuth()
@Roles(Role.ADMINISTRADOR)
@Controller('reportes')
export class ReportesController {
  constructor(
    private readonly resumen: ResumenService,
    private readonly reporteIncidencias: ReporteIncidenciasService,
    private readonly reporteParticipacion: ReporteParticipacionService,
  ) {}

  @Get('resumen')
  @ApiOperation({
    summary: 'Los 4 indicadores del panel (morosidad, ocupación, incidencias abiertas y participación)',
  })
  obtener(@Query() query: ResumenQueryDto) {
    return this.resumen.obtener(query);
  }

  @Get('incidencias')
  @ApiOperation({
    summary: 'H28: Reporte de incidencias abiertas agrupado por estado y prioridad',
  })
  obtenerIncidencias(@Query() query: ResumenQueryDto) {
    return this.reporteIncidencias.obtenerReporte(query);
  }

  @Get('votaciones')
  @ApiOperation({
    summary: 'H29: Reporte de participación en votaciones cerradas (sin sentido del voto)',
  })
  obtenerVotaciones(@Query() query: ResumenQueryDto) {
    return this.reporteParticipacion.obtenerReporte(query);
  }
}