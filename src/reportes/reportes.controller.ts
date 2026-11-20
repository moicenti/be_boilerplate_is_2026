import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
// Ajusta estas rutas si tus guards están en otro lugar
import { Roles } from '@Auth/decorators';
import { RolesGuard } from '@Auth/guards';
import { ResumenService } from './resumen.service.js';
import { FiltrosReportesDto } from './dto/filtros-reportes.dto.js';

@ApiTags('reportes')
@ApiBearerAuth()
@Controller('reportes')
@UseGuards(RolesGuard)
export class ReportesController {
  constructor(private readonly resumenService: ResumenService) {}

  @Get('resumen')
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'H26: Panel general de indicadores' })
  obtenerResumen(@Query() filtros: FiltrosReportesDto) {
    return this.resumenService.obtenerResumen(filtros);
  }
}
