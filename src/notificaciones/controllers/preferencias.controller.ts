import { Body, Controller, Get, ParseArrayPipe, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles } from '@Auth/decorators';
import { Role } from '@PrismaClient';
import { PreferenciaModuloDto } from '@Notificaciones/dto';
import type { SesionResidente } from '@Notificaciones/dto';
import { PreferenciasService } from '@Notificaciones/services';

/**
 * H25. Preferencias de avisos del residente.
 * El residente sale siempre de la sesión.
 * 401 y 403 (ROL_NO_PERMITIDO) los resuelven los guards globales.
 */
@ApiTags('notificaciones')
@ApiBearerAuth()
@Roles(Role.RESIDENTE)
@Controller('notificaciones/preferencias')
export class PreferenciasController {
  constructor(private readonly preferencias: PreferenciasService) {}

  @Get()
  @ApiOperation({ summary: 'Consultar el interruptor de cada módulo (siempre los 7)' })
  obtener(@CurrentUser() sesion: SesionResidente) {
    return this.preferencias.obtener(sesion);
  }

  @Put()
  @ApiOperation({ summary: 'Guardar el estado de cada módulo y devolver la lista completa' })
  guardar(
    @CurrentUser() sesion: SesionResidente,
    @Body(
      new ParseArrayPipe({
        items: PreferenciaModuloDto,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    cambios: PreferenciaModuloDto[],
  ) {
    return this.preferencias.guardar(sesion, cambios);
  }
}
