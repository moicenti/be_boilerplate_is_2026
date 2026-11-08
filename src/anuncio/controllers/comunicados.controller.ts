import {
  Controller,
  Post,
  Put,
  Patch,
  Delete,
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

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FilesInterceptor('archivos', 2, {
      limits: { fileSize: MAX_FILE_SIZE, files: 2 },
      fileFilter: (_req: Request, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => {
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
        destination: './public/uploads/anuncios',
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
    if (user.rol && user.rol !== 'ADMINISTRADOR') {
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

  // Criterio 4: Inmutabilidad oficial
  @Put(':id')
  @Patch(':id')
  @Delete(':id')
  bloquearEdicion() {
    throw new MethodNotAllowedException(
      'Los comunicados publicados son inmutables para preservar la integridad del historial oficial.',
    );
  }
}