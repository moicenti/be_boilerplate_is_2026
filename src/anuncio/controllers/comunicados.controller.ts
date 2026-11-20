import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
  Body,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  MethodNotAllowedException,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Request } from 'express';
import { extname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { ComunicadosService } from '../services/index.js';
import { CrearComunicadoDto } from '../dto/index.js';
import { CurrentUser } from '../../auth/decorators/index.js';

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

@Controller('anuncios')
export class ComunicadosController {
  constructor(private readonly comunicadosService: ComunicadosService) {}

  // H20 (BE-20.1): Muro segmentado por torre/sección del residente
  @Get('muro')
  async obtenerMuro(@CurrentUser() user: any) {
    return this.comunicadosService.obtenerMuro(user);
  }

  // H20 (Criterio 4): Consulta directa con validación 403 si es de torre/sección ajena
  @Get(':id')
  async obtenerDetalle(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.comunicadosService.obtenerDetalle(id, user);
  }

  // H20 (BE-20.2): Registrar acuse de recibo
  @Post(':id/leer')
  @HttpCode(HttpStatus.OK)
  async marcarComoLeido(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.comunicadosService.marcarComoLeido(id, user);
  }

  // H19 (BE-19.1): Publicar comunicado oficial
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FilesInterceptor('archivos', 2, {
      limits: { fileSize: MAX_FILE_SIZE, files: 2 },
      fileFilter: (
        _req: Request,
        file: Express.Multer.File,
        callback: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              `Tipo de archivo no permitido: ${file.mimetype}. Solo se admite PDF, JPG y PNG.`,
            ),
            false,
          );
        }
        callback(null, true);
      },
      storage: diskStorage({
        destination: './uploads/anuncios',
        filename: (
          _req: Request,
          file: Express.Multer.File,
          cb: (error: Error | null, filename: string) => void,
        ) => {
          const extension = extname(file.originalname);
          cb(null, `${randomUUID()}${extension}`);
        },
      }),
    }),
  )
  async crear(
    @CurrentUser() user: any,
    @Body() dto: CrearComunicadoDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (user.role !== 'ADMINISTRADOR') {
      throw new ForbiddenException('Solo el administrador puede publicar comunicados.');
    }

    if (files && files.length > 2) {
      throw new BadRequestException('Se permite adjuntar un máximo de 2 archivos.');
    }

    if (files) {
      for (const f of files) {
        if (f.size > MAX_FILE_SIZE) {
          throw new BadRequestException(`El archivo ${f.originalname} excede el límite de 5 MB.`);
        }
      }
    }

    return this.comunicadosService.publicarComunicado(user.id, dto, files || []);
  }

  // H19 (Criterio 4): Inmutabilidad oficial (métodos separados para evitar sobrescritura de metadata en NestJS)
  @Put(':id')
  bloquearPut() {
    throw new MethodNotAllowedException(
      'Los comunicados publicados son inmutables para preservar la integridad del historial oficial.',
    );
  }

  @Patch(':id')
  bloquearPatch() {
    throw new MethodNotAllowedException(
      'Los comunicados publicados son inmutables para preservar la integridad del historial oficial.',
    );
  }

  @Delete(':id')
  bloquearDelete() {
    throw new MethodNotAllowedException(
      'Los comunicados publicados son inmutables para preservar la integridad del historial oficial.',
    );
  }
}