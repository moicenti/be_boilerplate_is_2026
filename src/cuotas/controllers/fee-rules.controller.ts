import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseFilters,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Role, type User } from '@PrismaClient';
import type { EnvConfig } from '@Config';
import { CurrentUser, Roles } from '@Auth/decorators';
import { ApiException } from '@Common/errors';
import { ApiExceptionFilter } from '@Common/filters';
import { FeeRulesService, type FeeRuleView } from '../services/index.js';
import {
  ChangeFeeRuleStatusDto,
  CreateFeeRuleDto,
  FeeRuleChangeResponseDto,
  FeeRuleResponseDto,
  FeeRuleStatusResponseDto,
  ListFeeRulesQueryDto,
  SaveFeeRuleDto,
} from '../dto/index.js';

const parseId = new ParseIntPipe({
  exceptionFactory: () =>
    new ApiException(
      HttpStatus.BAD_REQUEST,
      'SOLICITUD_INVALIDA',
      'El id de la regla debe ser un número entero.',
    ),
});

@ApiTags('reglas-cuota')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'NO_AUTENTICADO' })
@ApiForbiddenResponse({ description: 'ROL_NO_PERMITIDO' })
@UseFilters(ApiExceptionFilter)
@Roles(Role.ADMINISTRADOR)
@Controller('reglas-cuota')
export class FeeRulesController {
  private readonly timeZone: string;

  constructor(
    private readonly rulesService: FeeRulesService,
    configService: ConfigService<EnvConfig, true>,
  ) {
    this.timeZone = configService.get('APP_TIMEZONE', { infer: true });
  }

  @Post()
  @ApiOperation({ summary: 'Crea una regla de cuota (ACTIVA por defecto)' })
  @ApiCreatedResponse({ type: FeeRuleResponseDto })
  @ApiBadRequestResponse({ description: 'SOLICITUD_INVALIDA' })
  @ApiConflictResponse({ description: 'REGLA_DUPLICADA' })
  @ApiUnprocessableEntityResponse({ description: 'REGLA_INCOMPLETA' })
  async create(
    @Body() dto: CreateFeeRuleDto,
    @CurrentUser() user: User,
  ): Promise<FeeRuleResponseDto> {
    return this.toResponse(await this.rulesService.create(dto, user));
  }

  @Get()
  @ApiOperation({ summary: 'Lista las reglas de cuota' })
  @ApiOkResponse({ type: [FeeRuleResponseDto] })
  async findAll(
    @Query() query: ListFeeRulesQueryDto,
  ): Promise<FeeRuleResponseDto[]> {
    const views = await this.rulesService.findAll(query.estado);
    return views.map((view) => this.toResponse(view));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta una regla de cuota' })
  @ApiOkResponse({ type: FeeRuleResponseDto })
  @ApiNotFoundResponse({ description: 'REGLA_INEXISTENTE' })
  async findOne(@Param('id', parseId) id: number): Promise<FeeRuleResponseDto> {
    return this.toResponse(await this.rulesService.findOne(id));
  }

  @Put(':id')
  @ApiOperation({
    summary:
      'Reemplaza la configuración de la regla; las cuotas ya generadas no cambian',
  })
  @ApiOkResponse({ type: FeeRuleResponseDto })
  @ApiBadRequestResponse({ description: 'SOLICITUD_INVALIDA' })
  @ApiNotFoundResponse({ description: 'REGLA_INEXISTENTE' })
  @ApiConflictResponse({ description: 'REGLA_DUPLICADA' })
  @ApiUnprocessableEntityResponse({
    description: 'REGLA_INCOMPLETA (regla ACTIVA)',
  })
  async update(
    @Param('id', parseId) id: number,
    @Body() dto: SaveFeeRuleDto,
    @CurrentUser() user: User,
  ): Promise<FeeRuleResponseDto> {
    return this.toResponse(await this.rulesService.update(id, dto, user));
  }

  @Patch(':id/estado')
  @ApiOperation({ summary: 'Activa, pausa o desactiva una regla' })
  @ApiOkResponse({ type: FeeRuleStatusResponseDto })
  @ApiNotFoundResponse({ description: 'REGLA_INEXISTENTE' })
  @ApiConflictResponse({ description: 'TRANSICION_INVALIDA / REGLA_DUPLICADA' })
  @ApiUnprocessableEntityResponse({ description: 'REGLA_INCOMPLETA' })
  async changeStatus(
    @Param('id', parseId) id: number,
    @Body() dto: ChangeFeeRuleStatusDto,
    @CurrentUser() user: User,
  ): Promise<FeeRuleStatusResponseDto> {
    const rule = await this.rulesService.changeStatus(id, dto.estado, user);
    return { id: rule.id, estado: rule.status };
  }

  @Get(':id/historial')
  @ApiOperation({
    summary:
      'Historial de auditoría de la regla (creación, ediciones y estados)',
  })
  @ApiOkResponse({ type: [FeeRuleChangeResponseDto] })
  @ApiNotFoundResponse({ description: 'REGLA_INEXISTENTE' })
  async findChanges(
    @Param('id', parseId) id: number,
  ): Promise<FeeRuleChangeResponseDto[]> {
    const changes = await this.rulesService.findChanges(id);
    return changes.map((change) =>
      FeeRuleChangeResponseDto.fromEntity(change, this.timeZone),
    );
  }

  private toResponse({
    rule,
    applicableUnits,
  }: FeeRuleView): FeeRuleResponseDto {
    return FeeRuleResponseDto.fromEntity(rule, applicableUnits, this.timeZone);
  }
}
