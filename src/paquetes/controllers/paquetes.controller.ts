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
import { AvisosPaqueteService, PaquetesService } from '@Paquetes/services';
import {
  CreatePackageDto,
  DeliverPackageDto,
  ListPackagesQueryDto,
  MyPackagePageResponseDto,
  MyPackagesQueryDto,
  PackagePageResponseDto,
  PackageResponseDto,
} from '@Paquetes/dto';
import { Role, type User } from '@PrismaClient';

@ApiTags('paquetes')
@ApiBearerAuth()
@Controller('paquetes')
export class PaquetesController {
  constructor(
    private readonly paquetesService: PaquetesService,
    private readonly avisosPaqueteService: AvisosPaqueteService,
  ) {}

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

  @Get('mis-paquetes')
  @Roles(Role.RESIDENTE)
  @ApiOperation({ summary: 'Historial de paquetes de la unidad del residente' })
  @ApiOkResponse({ type: MyPackagePageResponseDto })
  @ApiBadRequestResponse({ description: 'Filtros inválidos.' })
  @ApiForbiddenResponse({ description: 'Solo residentes.' })
  async listMine(
    @Query() query: MyPackagesQueryDto,
    @CurrentUser() user: User,
  ): Promise<MyPackagePageResponseDto> {
    const page = await this.paquetesService.listForResident(user, query);
    return {
      ...page,
      items: page.items.map((pkg) => PackageResponseDto.fromEntity(pkg)),
    };
  }

  @Get(':id')
  @Roles(Role.SEGURIDAD, Role.ADMINISTRADOR, Role.RESIDENTE)
  @ApiOperation({
    summary: 'Detalle de un paquete',
    description:
      'Un residente solo accede a los paquetes de su unidad y ve el código de retiro mientras el paquete está pendiente.',
  })
  @ApiOkResponse({ type: PackageResponseDto })
  @ApiNotFoundResponse({
    description: 'El paquete no existe o es de otra unidad.',
  })
  @ApiForbiddenResponse({ description: 'El rol no tiene acceso.' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<PackageResponseDto> {
    const pkg = await this.paquetesService.findOne(id, user);
    return PackageResponseDto.fromEntity(pkg, {
      includePickupCode: this.paquetesService.canSeePickupCode(pkg, user),
    });
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
    await this.avisosPaqueteService.notifyArrival(pkg, user);
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
