import { Controller, Get, Param, Query, StreamableFile } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles } from '@Auth/decorators';
import { Role } from '@PrismaClient';
import { ResumenQueryDto } from '@Reportes/dto';
import { ReporteExportacionService } from './exportacion.service.js';

/**
 * H31. Exportación de reportes a PDF. Solo ADMINISTRADOR.
 * 401 y 403 (ROL_NO_PERMITIDO) los resuelven los guards globales.
 */
@ApiTags('reportes')
@ApiBearerAuth()
@Roles(Role.ADMINISTRADOR)
@Controller('reportes')
export class ExportacionController {
  constructor(private readonly exportacion: ReporteExportacionService) {}

  @Get(':tipo/exportar')
  @ApiOperation({
    summary: 'Descarga un reporte en PDF con los mismos filtros y datos de la pantalla',
  })
  async exportar(
    @Param('tipo') tipo: string,
    @Query() query: ResumenQueryDto,
    @CurrentUser() sesion: { id: string },
  ): Promise<StreamableFile> {
    const { buffer, nombreArchivo } = await this.exportacion.exportar(tipo, query, sesion);
    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="${nombreArchivo}"`,
    });
  }
}
