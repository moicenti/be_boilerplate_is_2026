import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser, Roles } from '@Auth/decorators';
import { Role, type User } from '@PrismaClient';
import { VisitaService } from '../services/index.js';
import { PreautorizacionService } from '../services/index.js';
import { RegistrarEntradaDto, BuscarPreautorizacionDto } from '../dto/index.js';

@ApiTags('visitas')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'NO_AUTENTICADO: sin sesión o token vencido.' })
@Controller('visitas')
export class VisitaController {
  constructor(
    private readonly visitaService: VisitaService,
    private readonly preService: PreautorizacionService,
  ) {}

  @Get('buscar')
  @Roles(Role.SEGURIDAD, Role.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Buscar pre-autorización por código, documento o nombre',
    description: 'Solo seguridad y administración. Devuelve hasta 20 resultados vigentes.',
  })
  @ApiResponse({ status: 200, description: 'Pre-autorizaciones encontradas.' })
  @ApiResponse({ status: 403, description: 'Solo seguridad y administración.' })
  async buscar(@Query() dto: BuscarPreautorizacionDto) {
    return this.preService.buscar(dto.query);
  }

  @Post('entrada')
  @Roles(Role.SEGURIDAD, Role.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Registrar entrada de visitante',
    description:
      'Con pre-autorización: usa sus datos y la marca como USADA. ' +
      'Sin pre-autorización: requiere nombre, documento, unidad y motivo (10-200).',
  })
  @ApiResponse({ status: 201, description: 'Entrada registrada.' })
  @ApiResponse({
    status: 400,
    description:
      'Datos inválidos, pre-autorización no vigente o documento ya dentro.',
  })
  @ApiResponse({ status: 403, description: 'Solo seguridad y administración.' })
  async registrarEntrada(
    @CurrentUser() user: User,
    @Body() dto: RegistrarEntradaDto,
  ) {
    return this.visitaService.registrarEntrada(user, dto);
  }

  @Patch(':id/salida')
  @Roles(Role.SEGURIDAD, Role.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Registrar salida de visitante',
    description: 'Solo si la visita está activa. La marca como SALIO.',
  })
  @ApiResponse({ status: 200, description: 'Salida registrada.' })
  @ApiResponse({ status: 400, description: 'La visita ya tiene salida registrada.' })
  @ApiResponse({ status: 404, description: 'Visita activa no encontrada.' })
  async registrarSalida(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.visitaService.registrarSalida(user, id);
  }

  @Get('activas')
  @Roles(Role.SEGURIDAD, Role.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Listar visitantes dentro del condominio',
    description:
      'Devuelve la lista de visitantes activos con su unidad, autorización, ' +
      'hora de entrada y hora esperada de salida. Solo seguridad y administración.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de visitantes activos + total.',
    schema: {
      example: {
        total: 2,
        visitas: [
          {
            id: 'uuid',
            nombreVisitante: 'Juan Pérez',
            documento: '12345678',
            acompanantes: 2,
            estado: 'DENTRO',
            entrada: '2026-11-18T10:30:00.000Z',
            salidaEsperada: '2026-11-18T18:00:00.000Z',
            motivo: null,
            unidad: { id: 'uuid', code: 'A-19', tower: 'Torre A', label: 'Torre A · A-19' },
            preautorizacion: {
              id: 'uuid',
              codigo: 'AB3K9XZ2',
              estado: 'USADA',
              fin: '2026-11-18T18:00:00.000Z',
            },
            registradoPor: { id: 'uuid', email: 'ricardo.soto@example.com' },
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Solo seguridad y administración.' })
  async activas() {
    return this.visitaService.findActivas();
  }

  @Get('activas/count')
  @Roles(Role.SEGURIDAD, Role.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Contador de visitantes dentro (para polling ligero)',
    description:
      'Devuelve solo el total de visitantes activos. Útil para polling cada 30s ' +
      'sin traer toda la lista.',
  })
  @ApiResponse({ status: 200, description: 'Total de visitantes activos.' })
  async countActivas() {
    return this.visitaService.countActivas();
  }
}
