import { Controller, Get, Query, UseFilters } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '@PrismaClient';
import { Roles } from '@Auth/decorators';
import { ApiExceptionFilter } from '@Common/filters';
import { DelinquencyService } from '../services/index.js';
import {
  DelinquentUnitsPageResponseDto,
  ListDelinquentUnitsQueryDto,
} from '../dto/index.js';

@ApiTags('pagos')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'NO_AUTENTICADO' })
@ApiForbiddenResponse({ description: 'ROL_NO_PERMITIDO' })
@UseFilters(ApiExceptionFilter)
@Roles(Role.ADMINISTRADOR)
@Controller('unidades')
export class DelinquencyController {
  constructor(private readonly delinquencyService: DelinquencyService) {}

  @Get('mora')
  @ApiOperation({
    summary: 'Unidades en mora (H2)',
    description:
      'Una unidad está en mora si tiene al menos una cuota PENDIENTE o PARCIAL con saldo y ' +
      'vencimiento anterior a hoy (APP_TIMEZONE). Se calcula en cada consulta: al pagar todo ' +
      'lo vencido la unidad deja de aparecer.',
  })
  @ApiOkResponse({ type: DelinquentUnitsPageResponseDto })
  @ApiBadRequestResponse({ description: 'SOLICITUD_INVALIDA' })
  async list(
    @Query() query: ListDelinquentUnitsQueryDto,
  ): Promise<DelinquentUnitsPageResponseDto> {
    return DelinquentUnitsPageResponseDto.fromPage(
      await this.delinquencyService.list({
        tower: query.torre,
        minDaysLate: query.antiguedadMinDias,
        page: query.pagina,
        pageSize: query.tamano,
        sort: query.orden,
      }),
    );
  }
}
