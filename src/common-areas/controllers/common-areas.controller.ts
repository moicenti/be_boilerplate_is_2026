import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseFilters,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Role, type User } from '@PrismaClient';
import { CurrentUser, Roles } from '@Auth/decorators';
import { ApiException } from '@Common/errors';
import { ApiExceptionFilter } from '@Common/filters';
import { CommonAreaAvailabilityService, CommonAreasService } from '../services/index.js';
import {
  AvailabilityQueryDto,
  AvailabilityResponseDto,
  CommonAreaResponseDto,
  SaveCommonAreaDto,
} from '../dto/index.js';

const ParseAreaIdPipe = new ParseIntPipe({
  exceptionFactory: () =>
    new ApiException(
      HttpStatus.BAD_REQUEST,
      'SOLICITUD_INVALIDA',
      'El id del área debe ser un número entero.',
    ),
});

@ApiTags('areas')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'NO_AUTENTICADO: sin sesión o token vencido.' })
@UseFilters(ApiExceptionFilter)
@Controller('areas')
export class CommonAreasController {
  constructor(
    private readonly commonAreasService: CommonAreasService,
    private readonly availabilityService: CommonAreaAvailabilityService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista las áreas comunes activas' })
  @ApiOkResponse({ type: [CommonAreaResponseDto] })
  async findAll(): Promise<CommonAreaResponseDto[]> {
    const areas = await this.commonAreasService.findAll();
    return areas.map((area) => CommonAreaResponseDto.fromEntity(area));
  }

  // Tiene que declararse antes de GET :id; si no, "disponibilidad" se toma como un id.
  @Get('disponibilidad')
  @ApiOperation({
    summary: 'Consulta qué áreas están disponibles en una fecha y hora',
    description:
      'Fecha y hora en hora local del condominio. Cuentan el horario semanal, los bloqueos ' +
      'y las reservas CONFIRMADAS. Duración por defecto: 60 minutos.',
  })
  @ApiOkResponse({ type: AvailabilityResponseDto })
  @ApiBadRequestResponse({ description: 'SOLICITUD_INVALIDA: formato inválido o fecha pasada' })
  @ApiNotFoundResponse({ description: 'AREA_INEXISTENTE: areaId no existe' })
  async checkAvailability(@Query() query: AvailabilityQueryDto): Promise<AvailabilityResponseDto> {
    const results = await this.availabilityService.check(query);
    return AvailabilityResponseDto.from(query.fecha, query.hora, results);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta un área común activa' })
  @ApiOkResponse({ type: CommonAreaResponseDto })
  @ApiNotFoundResponse({ description: 'AREA_INEXISTENTE' })
  async findOne(@Param('id', ParseAreaIdPipe) id: number): Promise<CommonAreaResponseDto> {
    const area = await this.commonAreasService.findOne(id);
    return CommonAreaResponseDto.fromEntity(area);
  }

  @Post()
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Crea un área común con sus horarios' })
  @ApiCreatedResponse({ type: CommonAreaResponseDto })
  @ApiBadRequestResponse({ description: 'SOLICITUD_INVALIDA' })
  @ApiForbiddenResponse({ description: 'ROL_NO_PERMITIDO' })
  @ApiConflictResponse({ description: 'AREA_DUPLICADA: nombre repetido' })
  @ApiUnprocessableEntityResponse({ description: 'DATOS_INVALIDOS' })
  async create(@Body() dto: SaveCommonAreaDto): Promise<CommonAreaResponseDto> {
    const area = await this.commonAreasService.create(dto);
    return CommonAreaResponseDto.fromEntity(area, { includeStatus: true });
  }

  @Put(':id')
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Reemplaza los datos y horarios de un área' })
  @ApiOkResponse({ type: CommonAreaResponseDto })
  @ApiBadRequestResponse({ description: 'SOLICITUD_INVALIDA' })
  @ApiForbiddenResponse({ description: 'ROL_NO_PERMITIDO' })
  @ApiNotFoundResponse({ description: 'AREA_INEXISTENTE' })
  @ApiConflictResponse({ description: 'AREA_DUPLICADA: nombre repetido' })
  @ApiUnprocessableEntityResponse({ description: 'DATOS_INVALIDOS' })
  async update(
    @Param('id', ParseAreaIdPipe) id: number,
    @Body() dto: SaveCommonAreaDto,
    @CurrentUser() user: User,
  ): Promise<CommonAreaResponseDto> {
    const area = await this.commonAreasService.update(id, dto, user);
    return CommonAreaResponseDto.fromEntity(area, { includeStatus: true });
  }

  @Delete(':id')
  @Roles(Role.ADMINISTRADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina (lógicamente) un área común' })
  @ApiNoContentResponse({ description: 'Área eliminada' })
  @ApiForbiddenResponse({ description: 'ROL_NO_PERMITIDO' })
  @ApiNotFoundResponse({ description: 'AREA_INEXISTENTE' })
  @ApiConflictResponse({
    description: 'AREA_DUPLICADA: el área tiene reservas pendientes o confirmadas por realizarse',
  })
  async remove(
    @Param('id', ParseAreaIdPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<void> {
    await this.commonAreasService.remove(id, user);
  }
}
