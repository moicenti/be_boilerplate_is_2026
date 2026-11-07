import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { IncidenciasService } from '../services/index.js';
import { CreateIncidenciaDto } from '../dto/index.js';
import { CurrentUser } from '@Auth/decorators'; // Ajusta según tu path

@Controller('incidencias')
export class IncidenciasController {
  constructor(private readonly incidenciasService: IncidenciasService) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('photos', 3, {
      storage: diskStorage({
        destination: './uploads', // Asegúrate de crear esta carpeta
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Validación: Solo JPG o PNG
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return cb(new BadRequestException('Solo se permiten archivos JPG o PNG'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
      },
    }),
  )
  async create(
    @CurrentUser() user: {id: string}, 
    @Body() createIncidenciaDto: CreateIncidenciaDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const photoUrls = files ? files.map((file) => `/uploads/${file.filename}`) : [];
    return this.incidenciasService.create(user.id, createIncidenciaDto, photoUrls);
  }

  @Get()
  async findAll(@CurrentUser() user: {id: string}) {
    console.log(user.id + " Id??????");
    return this.incidenciasService.findAll(user.id);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: {id: string},
  ) {
    return this.incidenciasService.findOne(id, user.id);
  }
}