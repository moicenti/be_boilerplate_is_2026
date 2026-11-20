import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

// ✅ Usa el alias exacto de tu tsconfig.json para el enum Role
import { Role } from '@prisma/client';

// ✅ Usa la ruta relativa directa al decorador para evitar fallos de alias
import { Roles } from '../auth/decorators/roles.decorator.js'; // Ajusta el nombre del archivo si es diferente

import { FiltrosReportesDto } from './dto/filtros-reportes.dto.js';
import { ResumenService } from './resumen.service.js';
import type { ResumenResponse } from './resumen.service.js';
import { SeccionesRepository } from './repositories/secciones.repository.js';

@ApiTags('reportes')
@ApiBearerAuth()
@Controller('reportes')
export class ReportesController {
  constructor(
    private readonly resumen: ResumenService,
    private readonly secciones: SeccionesRepository,
  ) {}

  @Get('resumen')
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({
    summary: 'H26: los 4 indicadores del panel en una sola consulta',
  })
  obtenerResumen(
    @Query() filtros: FiltrosReportesDto,
  ): Promise<ResumenResponse> {
    return this.resumen.obtenerResumen(filtros);
  }

  @Get('secciones')
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Listado de secciones para el filtro del panel' })
  listarSecciones() {
    return this.secciones.listar();
  }
}
