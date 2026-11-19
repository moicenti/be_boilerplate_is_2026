import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@Auth/decorators';
import type { User } from '@PrismaClient';
import { DirectorioService } from '../services/index.js';
import { ActualizarPrivacidadDto } from '../dto/index.js';

@ApiTags('directorio')
@ApiBearerAuth()
@Controller('directorio')
export class DirectorioController {
  constructor(private readonly directorioService: DirectorioService) {}

  // H21 (BE-21.1): Consultar estado actual de privacidad del residente autenticado
  @Get('preferencias')
  @ApiOperation({ summary: 'Consulta las preferencias de privacidad del residente en el directorio' })
  async obtenerPreferencias(@CurrentUser() user: User) {
    return this.directorioService.obtenerPreferencias(user.id);
  }

  // H21 (BE-21.2): Actualizar preferencias de privacidad
  @Put('preferencias')
  @ApiOperation({ summary: 'Actualiza las preferencias de privacidad del perfil vecinal' })
  async actualizarPreferencias(
    @CurrentUser() user: User,
    @Body() dto: ActualizarPrivacidadDto,
  ) {
    return this.directorioService.actualizarPreferencias(user.id, dto);
  }
}