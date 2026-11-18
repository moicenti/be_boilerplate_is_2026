import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
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
import { ApiExceptionFilter } from '@Common/filters';
import { ManualFeeGenerationService } from '../services/index.js';
import {
  GenerationExecutionResponseDto,
  GenerationPeriodDto,
  GenerationPreviewResponseDto,
  GenerationRunItemDto,
  GenerationRunPageResponseDto,
  ListGenerationRunsQueryDto,
} from '../dto/index.js';
import { parseRuleId } from './rule-id.pipe.js';

/** H34: generación manual de cuotas de una regla, con vista previa e historial. */
@ApiTags('reglas-cuota')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'NO_AUTENTICADO' })
@ApiForbiddenResponse({ description: 'ROL_NO_PERMITIDO' })
@ApiNotFoundResponse({ description: 'REGLA_INEXISTENTE' })
@UseFilters(ApiExceptionFilter)
@Roles(Role.ADMINISTRADOR)
@Controller('reglas-cuota')
export class FeeGenerationController {
  private readonly timeZone: string;

  constructor(
    private readonly manualService: ManualFeeGenerationService,
    configService: ConfigService<EnvConfig, true>,
  ) {
    this.timeZone = configService.get('APP_TIMEZONE', { infer: true });
  }

  @Post(':id/generacion/vista-previa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Simula la generación del periodo sin escribir en la base',
  })
  @ApiOkResponse({ type: GenerationPreviewResponseDto })
  @ApiBadRequestResponse({ description: 'SOLICITUD_INVALIDA' })
  @ApiUnprocessableEntityResponse({
    description: 'REGLA_INACTIVA (regla no ACTIVA o periodo futuro)',
  })
  async preview(
    @Param('id', parseRuleId) id: number,
    @Body() dto: GenerationPeriodDto,
  ): Promise<GenerationPreviewResponseDto> {
    return GenerationPreviewResponseDto.fromView(
      await this.manualService.preview(id, dto.periodo),
    );
  }

  @Post(':id/generacion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Genera las cuotas faltantes del periodo (mismo motor que la tarea automática)',
  })
  @ApiOkResponse({ type: GenerationExecutionResponseDto })
  @ApiBadRequestResponse({ description: 'SOLICITUD_INVALIDA' })
  @ApiConflictResponse({ description: 'EJECUCION_EN_CURSO' })
  @ApiUnprocessableEntityResponse({
    description: 'REGLA_INACTIVA (regla no ACTIVA o periodo futuro)',
  })
  async execute(
    @Param('id', parseRuleId) id: number,
    @Body() dto: GenerationPeriodDto,
    @CurrentUser() user: User,
  ): Promise<GenerationExecutionResponseDto> {
    return GenerationExecutionResponseDto.fromView(
      await this.manualService.execute(id, dto.periodo, user),
    );
  }

  @Get(':id/ejecuciones')
  @ApiOperation({
    summary: 'Historial de ejecuciones automáticas y manuales de la regla',
  })
  @ApiOkResponse({ type: GenerationRunPageResponseDto })
  @ApiBadRequestResponse({ description: 'SOLICITUD_INVALIDA' })
  async listRuns(
    @Param('id', parseRuleId) id: number,
    @Query() query: ListGenerationRunsQueryDto,
  ): Promise<GenerationRunPageResponseDto> {
    const page = await this.manualService.listRuns(
      id,
      query.pagina,
      query.tamano,
    );
    return {
      total: page.total,
      pagina: page.page,
      tamano: page.pageSize,
      items: page.items.map((run) =>
        GenerationRunItemDto.fromEntity(run, this.timeZone),
      ),
    };
  }
}
