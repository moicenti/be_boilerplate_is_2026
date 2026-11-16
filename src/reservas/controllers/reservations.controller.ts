import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
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
import { ReservationsService } from '../services/index.js';
import { CreateReservationDto, ReservationResponseDto } from '../dto/index.js';

const parseId = new ParseIntPipe({
  exceptionFactory: () =>
    new ApiException(
      HttpStatus.BAD_REQUEST,
      'SOLICITUD_INVALIDA',
      'El id de la reserva debe ser un número entero.',
    ),
});

@ApiTags('reservas')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'NO_AUTENTICADO' })
@ApiForbiddenResponse({ description: 'ROL_NO_PERMITIDO / UNIDAD_NO_ASIGNADA' })
@UseFilters(ApiExceptionFilter)
@Roles(Role.RESIDENTE)
@Controller('reservas')
export class ReservationsController {
  private readonly timeZone: string;

  constructor(
    private readonly reservationsService: ReservationsService,
    configService: ConfigService<EnvConfig, true>,
  ) {
    this.timeZone = configService.get('APP_TIMEZONE', { infer: true });
  }

  @Post()
  @ApiOperation({ summary: 'Reserva un área común para la unidad del residente' })
  @ApiCreatedResponse({ type: ReservationResponseDto })
  @ApiBadRequestResponse({ description: 'SOLICITUD_INVALIDA' })
  @ApiNotFoundResponse({ description: 'AREA_INEXISTENTE' })
  @ApiConflictResponse({ description: 'RESERVA_CRUZADA' })
  @ApiUnprocessableEntityResponse({ description: 'FUERA_DE_HORARIO: horario, bloqueo o fecha pasada' })
  async create(
    @Body() dto: CreateReservationDto,
    @CurrentUser() user: User,
  ): Promise<ReservationResponseDto> {
    const reservation = await this.reservationsService.create(dto, user);
    return ReservationResponseDto.fromEntity(reservation, this.timeZone);
  }

  @Get()
  @ApiOperation({ summary: 'Lista las reservas de la unidad del residente' })
  @ApiOkResponse({ type: [ReservationResponseDto] })
  async findMine(@CurrentUser() user: User): Promise<ReservationResponseDto[]> {
    const reservations = await this.reservationsService.findMine(user);
    return reservations.map((r) => ReservationResponseDto.fromEntity(r, this.timeZone));
  }

  @Patch(':id/cancelar')
  @ApiOperation({ summary: 'Cancela una reserva de la unidad que aún no termina' })
  @ApiOkResponse({ type: ReservationResponseDto })
  @ApiNotFoundResponse({ description: 'RESERVA_INEXISTENTE' })
  @ApiForbiddenResponse({ description: 'RECURSO_AJENO' })
  @ApiConflictResponse({ description: 'TRANSICION_INVALIDA' })
  async cancel(
    @Param('id', parseId) id: number,
    @CurrentUser() user: User,
  ): Promise<ReservationResponseDto> {
    const reservation = await this.reservationsService.cancel(id, user);
    return ReservationResponseDto.fromEntity(reservation, this.timeZone);
  }
}
