import { Body, Controller, Get, Patch } from '@nestjs/common';
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

  // H21 (BE-21.1): Obtener configuración de privacidad del residente autenticado
  @Get('privacidad')
  @ApiOperation({ summary: 'Obtiene las preferencias de privacidad del residente en el directorio' })
  async obtenerPrivacidad(@CurrentUser() user: User) {
    return this.directorioService.obtenerMiPrivacidad(user.id);
  }

  // H21 (BE-21.2): Actualizar visibilidad global y de contacto
  @Patch('privacidad')
  @ApiOperation({ summary: 'Actualiza la configuración de privacidad del perfil vecinal' })
  async actualizarPrivacidad(
    @CurrentUser() user: User,
    @Body() dto: ActualizarPrivacidadDto,
  ) {
    return this.directorioService.actualizarMiPrivacidad(user.id, dto);
  }
}