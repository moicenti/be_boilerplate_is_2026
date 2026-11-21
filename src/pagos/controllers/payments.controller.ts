import { Body, Controller, Post, UseFilters } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiPaymentRequiredResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Role, type User } from '@PrismaClient';
import type { EnvConfig } from '@Config';
import { CurrentUser, Roles } from '@Auth/decorators';
import { ApiExceptionFilter } from '@Common/filters';
import { PaymentsService } from '../services/index.js';
import { CreatePaymentDto, PaymentResponseDto } from '../dto/index.js';

@ApiTags('pagos')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'NO_AUTENTICADO' })
@UseFilters(ApiExceptionFilter)
@Controller('pagos')
export class PaymentsController {
  private readonly timeZone: string;

  constructor(
    private readonly paymentsService: PaymentsService,
    configService: ConfigService<EnvConfig, true>,
  ) {
    this.timeZone = configService.get('APP_TIMEZONE', { infer: true });
  }

  @Post()
  @Roles(Role.RESIDENTE)
  @ApiOperation({
    summary: 'Paga una o varias cuotas de la unidad del residente',
    description:
      'El monto se aplica por fecha de vencimiento ascendente: la cuota queda PAGADA si su ' +
      'saldo llega a 0 o PARCIAL si le queda saldo. Todo ocurre en una sola transacción.',
  })
  @ApiCreatedResponse({ type: PaymentResponseDto })
  @ApiBadRequestResponse({ description: 'SOLICITUD_INVALIDA: lista vacía o monto menor o igual a 0' })
  @ApiPaymentRequiredResponse({ description: 'PAGO_RECHAZADO: la tarjeta de prueba termina en 2000' })
  @ApiForbiddenResponse({ description: 'ROL_NO_PERMITIDO / RECURSO_AJENO: unidad ajena' })
  @ApiNotFoundResponse({ description: 'CUOTA_INEXISTENTE' })
  @ApiConflictResponse({ description: 'CUOTA_YA_PAGADA: cuota pagada o anulada, o referencia repetida' })
  @ApiUnprocessableEntityResponse({ description: 'MONTO_EXCEDE_DEUDA' })
  async pay(@Body() dto: CreatePaymentDto, @CurrentUser() user: User): Promise<PaymentResponseDto> {
    const record = await this.paymentsService.pay(dto, user);
    return PaymentResponseDto.fromRecord(record, this.timeZone);
  }
}
