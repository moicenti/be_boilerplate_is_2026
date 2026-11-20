import { Controller, Get, HttpStatus, Param, ParseUUIDPipe, UseFilters } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role, type User } from '@PrismaClient';
import type { EnvConfig } from '@Config';
import { CurrentUser, Roles } from '@Auth/decorators';
import { ApiException } from '@Common/errors';
import { ApiExceptionFilter } from '@Common/filters';
import { PaymentsService } from '../services/index.js';
import { AccountStatementResponseDto } from '../dto/index.js';

const ParseUnitIdPipe = new ParseUUIDPipe({
  exceptionFactory: () =>
    new ApiException(
      HttpStatus.BAD_REQUEST,
      'SOLICITUD_INVALIDA',
      'El id de la unidad debe ser un UUID.',
    ),
});

@ApiTags('pagos')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'NO_AUTENTICADO' })
@UseFilters(ApiExceptionFilter)
@Controller('unidades')
export class AccountStatementController {
  private readonly timeZone: string;

  constructor(
    private readonly paymentsService: PaymentsService,
    configService: ConfigService<EnvConfig, true>,
  ) {
    this.timeZone = configService.get('APP_TIMEZONE', { infer: true });
  }

  @Get(':unidadId/estado-de-cuenta')
  @Roles(Role.RESIDENTE, Role.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Estado de cuenta de una unidad: saldo, cuotas y pagos',
    description:
      'El residente solo puede consultar su unidad; el administrador, cualquiera. ' +
      'Los saldos se calculan en cada consulta. Una unidad sin cuotas devuelve listas vacías.',
  })
  @ApiOkResponse({ type: AccountStatementResponseDto })
  @ApiBadRequestResponse({ description: 'SOLICITUD_INVALIDA: el id no es un UUID' })
  @ApiForbiddenResponse({ description: 'ROL_NO_PERMITIDO / RECURSO_AJENO: la unidad no es suya' })
  @ApiNotFoundResponse({ description: 'UNIDAD_INEXISTENTE' })
  async getAccountStatement(
    @Param('unidadId', ParseUnitIdPipe) unitId: string,
    @CurrentUser() user: User,
  ): Promise<AccountStatementResponseDto> {
    const statement = await this.paymentsService.getAccountStatement(unitId, user);
    return AccountStatementResponseDto.fromStatement(statement, this.timeZone);
  }
}
