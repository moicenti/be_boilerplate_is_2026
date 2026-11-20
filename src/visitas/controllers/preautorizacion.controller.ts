import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '@Auth/decorators';
import { PreautorizacionService } from '@Visitas/services/';
import { CreatePreautorizacionDto } from '@Visitas/dto/';
import type { User } from '@PrismaClient';

@ApiTags('preautorizaciones')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'NO_AUTENTICADO: sin sesión o token vencido.' })
@Controller('preautorizaciones')
export class PreautorizacionController {
  constructor(private readonly service: PreautorizacionService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear pre-autorización de visitante',
    description:
      'Crea una pre-autorización con un código único de 8 caracteres. ' +
      'La unidad se toma del JWT del residente. ' +
      'Vigencia máxima: 24 horas. Acompañantes: 0 a 5. ' +
      'El estado inicial es "Vigente".',
  })
  @ApiResponse({
    status: 201,
    description: 'Pre-autorización creada con código único.',
    schema: {
      example: {
        id: '3e459034-e612-49e9-a921-4b98069e96b2',
        codigo: 'AB3K9XZ2',
        nombreVisitante: 'Juan Pérez',
        documento: '12345678',
        motivo: 'Entrega de paquetería',
        acompanantes: 2,
        inicio: '2026-11-15T10:00:00.000Z',
        fin: '2026-11-15T18:00:00.000Z',
        estado: 'VIGENTE',
        unidadId: '...',
        residenteId: '...',
        createdAt: '2026-11-15T09:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Datos inválidos: inicio en el pasado, fin ≤ inicio, vigencia > 24h, ' +
      'acompañantes fuera de 0-5, o unidad no asignada.',
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreatePreautorizacionDto,
  ) {
    return this.service.create(user, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar mis pre-autorizaciones',
    description: 'Devuelve las pre-autorizaciones del residente autenticado, ordenadas por fecha de creación.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de pre-autorizaciones del residente.',
    schema: {
      type: 'array',
      items: {
        example: {
          id: '...',
          codigo: 'AB3K9XZ2',
          nombreVisitante: 'Juan Pérez',
          documento: '12345678',
          inicio: '2026-11-15T10:00:00.000Z',
          fin: '2026-11-15T18:00:00.000Z',
          estado: 'VIGENTE',
          acompanantes: 2,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  async findAll(@CurrentUser() user: User) {
    return this.service.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle de una pre-autorización',
    description: 'Devuelve el detalle completo de una pre-autorización del residente autenticado.',
  })
  @ApiResponse({ status: 200, description: 'Detalle de la pre-autorización.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 404, description: 'No encontrada o no pertenece al usuario.' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.service.findOne(id, user.id);
  }
}