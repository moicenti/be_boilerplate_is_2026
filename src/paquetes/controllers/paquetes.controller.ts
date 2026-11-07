import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles } from '@Auth/decorators';
import { PaquetesService } from '@Paquetes/services';
import { CreatePackageDto, PackageResponseDto } from '@Paquetes/dto';
import { Role, type User } from '@PrismaClient';

@ApiTags('paquetes')
@ApiBearerAuth()
@Controller('paquetes')
export class PaquetesController {
  constructor(private readonly paquetesService: PaquetesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.SEGURIDAD)
  @ApiOperation({ summary: 'Registra la llegada de un paquete a la caseta' })
  @ApiCreatedResponse({ type: PackageResponseDto })
  @ApiBadRequestResponse({ description: 'Datos incompletos o inválidos.' })
  @ApiNotFoundResponse({ description: 'La unidad no existe.' })
  @ApiForbiddenResponse({ description: 'Solo el personal de seguridad.' })
  async register(
    @Body() dto: CreatePackageDto,
    @CurrentUser() user: User,
  ): Promise<PackageResponseDto> {
    const pkg = await this.paquetesService.register(dto, user);
    return PackageResponseDto.fromEntity(pkg);
  }
}
