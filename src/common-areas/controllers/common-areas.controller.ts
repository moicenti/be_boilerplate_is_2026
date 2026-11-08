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
  UseFilters,
  UseGuards,
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
import { RolesGuard } from '@Auth/guards';
import { ApiException } from '@Common/errors';
import { ApiExceptionFilter } from '@Common/filters';
import { CommonAreasService } from '../services/index.js';
import { CommonAreaResponseDto, SaveCommonAreaDto } from '../dto/index.js';

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
@UseGuards(RolesGuard)
@Controller('areas')
export class CommonAreasController {
  constructor(private readonly commonAreasService: CommonAreasService) {}

  @Get()
  @ApiOperation({ summary: 'Lista las áreas comunes activas' })
  @ApiOkResponse({ type: [CommonAreaResponseDto] })
  async findAll(): Promise<CommonAreaResponseDto[]> {
    const areas = await this.commonAreasService.findAll();
    return areas.map((area) => CommonAreaResponseDto.fromEntity(area));
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
