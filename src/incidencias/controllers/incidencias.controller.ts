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

import { ApiBearerAuth
  ,ApiUnauthorizedResponse
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
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return cb(
            new BadRequestException('Solo se permiten archivos JPG o PNG'),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateIncidenciaDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const photoUrls = files ? files.map((f) => `/uploads/${f.filename}`) : [];
    return this.incidenciasService.create(user, dto, photoUrls);
  }

  @Get()
  async findAll(@CurrentUser() user: User) {
    return this.incidenciasService.findAll(user.id);
  }

  @Get('admin/list')
  @Roles(Role.ADMINISTRADOR)
  async adminList(@Query() filters: FilterIncidenciaDto) {
    return this.incidenciasService.findAllForAdmin(filters);
  }

  @Get('responsables')
  @Roles(Role.ADMINISTRADOR)
  async responsables() {
    return this.incidenciasService.findMaintenanceUsers();
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.incidenciasService.findOne(id, user.id);
  }

  @Patch(':id/asignar')
  @Roles(Role.ADMINISTRADOR)
  async assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AsignarIncidenciaDto,
    @CurrentUser() user: User,
  ) {
    return this.incidenciasService.assignReport(id, dto, user);
  }

  @Patch(':id/resolver')
  @Roles(Role.ADMINISTRADOR, Role.MANTENIMIENTO)
  async resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolverIncidenciaDto,
    @CurrentUser() user: User,
  ) {
    return this.incidenciasService.resolveReport(id, dto, user);
  }

  @Patch(':id/confirmar')
async confirm(
  @Param('id', ParseUUIDPipe) id: string,
  @CurrentUser() user: User,
) {
  return this.incidenciasService.confirmResolution(id, user.id);
}

@Patch(':id/rechazar')
async reject(
  @Param('id', ParseUUIDPipe) id: string,
  @Body() dto: RechazarResolucionDto,
  @CurrentUser() user: User,
) {
  return this.incidenciasService.rejectResolution(id, user.id, dto.comment);
}
  
}