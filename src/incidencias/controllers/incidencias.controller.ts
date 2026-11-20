import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Role, type User } from '@PrismaClient';
import { CurrentUser, Roles } from '@Auth/decorators';
import { IncidenciasService } from '@Incidencias/services';
import {
  AsignarIncidenciaDto,
  CreateIncidenciaDto,
  FilterIncidenciaDto,
  ResolverIncidenciaDto,
  RechazarResolucionDto,
} from '@Incidencias/dto';
import { ImageValidationInterceptor } from '../../common/interceptor/image-validation.interceptor.js'; 

@ApiTags('incidencias')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'NO_AUTENTICADO: sin sesión o token vencido.' })
@Controller('incidencias')
export class IncidenciasController {
  constructor(private readonly incidenciasService: IncidenciasService) {}

  @Post()
@UseInterceptors(
  FilesInterceptor('photos', 3, {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        // Extensión temporal; el interceptor la corrige después
        const ext = extname(file.originalname).toLowerCase();
        const safeExt = ['.jpg', '.jpeg', '.png'].includes(ext) ? ext : '.bin';
        cb(null, `${file.fieldname}-${uniqueSuffix}${safeExt}`);
      },
    }),
    // No validar mimetype aquí: el interceptor lo hace leyendo los bytes
    limits: { fileSize: 5 * 1024 * 1024 },
  }),
  ImageValidationInterceptor,
)
  @ApiOperation({
    summary: 'Crear un reporte de incidencia',
    description:
      'Crea un reporte con título, categoría, ubicación, descripción y hasta 3 fotos. ' +
      'El reporte queda en estado "Abierto" y a nombre de la unidad del usuario autenticado.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'category', 'location', 'description'],
      properties: {
        title: { type: 'string', example: 'Luminaria apagada en pasillo' },
        category: { type: 'string', example: 'Mantenimiento' },
        location: { type: 'string', example: 'Torre A · Piso 3' },
        description: {
          type: 'string',
          example: 'La luminaria no enciende desde anoche...',
        },
        photos: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Hasta 3 fotos JPG/PNG de máx 5 MB cada una',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Reporte creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o unidad no asignada.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  async create(
  @CurrentUser() user: User,
  @Body() dto: CreateIncidenciaDto,
  @UploadedFiles() files: Express.Multer.File[],
) {
 

  const photoUrls = files ? files.map((f) => `/uploads/${f.filename}`) : [];

  return this.incidenciasService.create(user, dto, photoUrls);
}

  @Get()
  @ApiOperation({ summary: 'Listar mis reportes' })
  @ApiResponse({ status: 200, description: 'Lista de reportes del usuario.' })
  async findAll(@CurrentUser() user: User) {
    return this.incidenciasService.findAll(user.id);
  }

  @Get('admin/list')
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Listar reportes (admin)',
    description:
      'Lista todos los reportes con filtros (estado, prioridad, unidad) y contadores por prioridad.',
  })
  @ApiResponse({ status: 200, description: 'Lista filtrada + contadores.' })
  @ApiResponse({ status: 403, description: 'Solo administradores.' })
  async adminList(@Query() filters: FilterIncidenciaDto) {
    return this.incidenciasService.findAllForAdmin(filters);
  }

  @Get('responsables')
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Listar responsables de mantenimiento activos' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios MANTENIMIENTO activos.' })
  @ApiResponse({ status: 403, description: 'Solo administradores.' })
  async responsables() {
    return this.incidenciasService.findMaintenanceUsers();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un reporte' })
  @ApiResponse({ status: 200, description: 'Detalle del reporte.' })
  @ApiResponse({ status: 404, description: 'Reporte no encontrado o no es del usuario.' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.incidenciasService.findOne(id, user.id);
  }

  @Patch(':id/asignar')
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Asignar prioridad, responsable y fecha (admin)',
    description:
      'Solo administradores. La prioridad CRITICA requiere justificación de 10-200 caracteres. ' +
      'El reporte pasa a "En atención" si estaba "Abierto" o "Rechazado".',
  })
  @ApiResponse({ status: 200, description: 'Reporte asignado.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o estado no asignable.' })
  @ApiResponse({ status: 403, description: 'Solo administradores.' })
  async assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AsignarIncidenciaDto,
    @CurrentUser() user: User,
  ) {
    return this.incidenciasService.assignReport(id, dto, user);
  }

  @Patch(':id/resolver')
  @Roles(Role.ADMINISTRADOR, Role.MANTENIMIENTO)
  @ApiOperation({
    summary: 'Marcar reporte como resuelto',
    description:
      'Solo admin o mantenimiento. Requiere comentario de 10-200 caracteres. ' +
      'El reporte debe estar en estado "En atención".',
  })
  @ApiResponse({ status: 200, description: 'Reporte resuelto.' })
  @ApiResponse({ status: 400, description: 'Estado no resoluble o comentario inválido.' })
  @ApiResponse({ status: 403, description: 'Solo admin o mantenimiento.' })
  async resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolverIncidenciaDto,
    @CurrentUser() user: User,
  ) {
    return this.incidenciasService.resolveReport(id, dto, user);
  }

  @Patch(':id/confirmar')
  @ApiOperation({
    summary: 'Confirmar resolución (residente dueño)',
    description:
      'Solo el dueño del reporte. El reporte debe estar en estado "Resuelto". ' +
      'Pasa a "Cerrado" y no se puede modificar.',
  })
  @ApiResponse({ status: 200, description: 'Reporte cerrado.' })
  @ApiResponse({ status: 400, description: 'El reporte no está en estado "Resuelto".' })
  @ApiResponse({ status: 403, description: 'No es el dueño del reporte.' })
  async confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.incidenciasService.confirmResolution(id, user.id);
  }

  @Patch(':id/rechazar')
  @ApiOperation({
    summary: 'Rechazar resolución (residente dueño)',
    description:
      'Solo el dueño del reporte. El reporte debe estar en estado "Resuelto". ' +
      'Pasa a "Rechazado" y requiere reasignación por parte del administrador.',
  })
  @ApiResponse({ status: 200, description: 'Resolución rechazada.' })
  @ApiResponse({ status: 400, description: 'Comentario inválido o estado incorrecto.' })
  @ApiResponse({ status: 403, description: 'No es el dueño del reporte.' })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RechazarResolucionDto,
    @CurrentUser() user: User,
  ) {
    return this.incidenciasService.rejectResolution(id, user.id, dto.comment);
  }
}