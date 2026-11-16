import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles } from '@Auth/decorators';
import { Role } from '@PrismaClient';
import {
  ListarNotificacionesQueryDto,
  MarcarLeidaDto,
} from '@Notificaciones/dto';
import type { SesionResidente } from '@Notificaciones/dto';
import { CentroNotificacionesService } from '@Notificaciones/services';

/**
 * H24. Centro de notificaciones del residente.
 * El residente sale siempre de la sesión: ningún endpoint recibe un ID de residente.
 * 401 y 403 (ROL_NO_PERMITIDO) los resuelven los guards globales.
 */
@ApiTags('notificaciones')
@ApiBearerAuth()
@Roles(Role.RESIDENTE)
@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly centro: CentroNotificacionesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar mis notificaciones, de la más reciente a la más antigua' })
  listar(
    @CurrentUser() sesion: SesionResidente,
    @Query() query: ListarNotificacionesQueryDto,
  ) {
    return this.centro.listar(sesion, query);
  }

  // Va antes de ':id/...' por claridad; no choca porque ese es PATCH.
  @Get('no-leidas/conteo')
  @ApiOperation({ summary: 'Número de notificaciones sin leer (indicador del encabezado)' })
  contarNoLeidas(@CurrentUser() sesion: SesionResidente) {
    return this.centro.contarNoLeidas(sesion);
  }

  @Patch(':id/leida')
  @ApiOperation({ summary: 'Marcar o desmarcar una notificación como leída' })
  marcarLeida(
    @CurrentUser() sesion: SesionResidente,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MarcarLeidaDto,
  ) {
    return this.centro.cambiarLeida(sesion, id, dto.leida);
  }
}
