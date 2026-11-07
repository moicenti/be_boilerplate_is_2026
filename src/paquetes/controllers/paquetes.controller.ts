import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { CurrentUser, Roles } from '@Auth/decorators';
import { PaquetesService } from '@Paquetes/services';
import {
  CreatePackageDto,
  DeliverPackageDto,
  ListPackagesQueryDto,
  PackagePageResponseDto,
  PackageResponseDto,
} from '@Paquetes/dto';
import { Role, type User } from '@PrismaClient';

@ApiTags('paquetes')
@ApiBearerAuth()
@Controller('paquetes')
export class PaquetesController {
  constructor(private readonly paquetesService: PaquetesService) {}

  @Get()
  @Roles(Role.SEGURIDAD)
  @ApiOperation({ summary: 'Lista los paquetes para la caseta de seguridad' })
  @ApiOkResponse({ type: PackagePageResponseDto })
  @ApiBadRequestResponse({ description: 'Filtros inválidos.' })
  @ApiForbiddenResponse({ description: 'Solo el personal de seguridad.' })
  async list(
    @Query() query: ListPackagesQueryDto,
  ): Promise<PackagePageResponseDto> {
    const page = await this.paquetesService.list(query);
    return {
      ...page,
      items: page.items.map((pkg) => PackageResponseDto.fromEntity(pkg)),
    };
  }

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

  @Patch(':id/entrega')
  @Roles(Role.SEGURIDAD)
  @ApiOperation({
    summary: 'Registra la entrega de un paquete con su código de retiro',
  })
  @ApiOkResponse({ type: PackageResponseDto })
  @ApiBadRequestResponse({ description: 'Datos incompletos o inválidos.' })
  @ApiNotFoundResponse({ description: 'El paquete no existe.' })
  @ApiConflictResponse({ description: 'El paquete ya fue entregado.' })
  @ApiUnprocessableEntityResponse({
    description: 'El código de retiro no coincide.',
  })
  @ApiForbiddenResponse({ description: 'Solo el personal de seguridad.' })
  async deliver(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DeliverPackageDto,
    @CurrentUser() user: User,
  ): Promise<PackageResponseDto> {
    const pkg = await this.paquetesService.deliver(id, dto, user);
    return PackageResponseDto.fromEntity(pkg);
  }
}
