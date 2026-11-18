import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@Auth/decorators';
import { Role } from '@PrismaClient';
import { ResumenQueryDto } from '@Reportes/dto';
import { ResumenService } from '@Reportes/services';

/**
 * H26. Panel general de indicadores. Solo ADMINISTRADOR.
 * 401 y 403 (ROL_NO_PERMITIDO) los resuelven los guards globales.
 */
@ApiTags('reportes')
@ApiBearerAuth()
@Roles(Role.ADMINISTRADOR)
@Controller('reportes')
export class ReportesController {
  constructor(private readonly resumen: ResumenService) {}

  @Get('resumen')
  @ApiOperation({
    summary: 'Los 4 indicadores del panel (morosidad, ocupación, incidencias abiertas y participación)',
  })
  obtener(@Query() query: ResumenQueryDto) {
    return this.resumen.obtener(query);
  }
}
