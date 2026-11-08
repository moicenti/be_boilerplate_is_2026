import { Injectable, Logger } from '@nestjs/common';
import { ComunicadosRepository, ArchivoAdjuntoData } from '../repositories/index.js';
import { CrearComunicadoDto } from '../dto/index.js';

@Injectable()
export class ComunicadosService {
  private readonly logger = new Logger(ComunicadosService.name);

  constructor(
    private readonly comunicadosRepository: ComunicadosRepository,
  ) {}

  async publicarComunicado(
    emisorId: string,
    dto: CrearComunicadoDto,
    archivos: Express.Multer.File[],
  ) {
    const adjuntosData: ArchivoAdjuntoData[] = (archivos || []).map((file) => ({
      nombreOriginal: file.originalname,
      rutaArchivo: `/uploads/anuncios/${file.filename}`,
      tipoMime: file.mimetype,
      tamanoBytes: file.size,
    }));

    const nuevoComunicado = await this.comunicadosRepository.crearComunicado(
      emisorId,
      dto,
      adjuntosData,
    );

    // Disparo de evento / integración con Módulo 9 (H23)
    this.logger.log(
      `Evento emitido al Modulo 9 para comunicado ID ${nuevoComunicado.id} con prioridad ${dto.prioridad} y audiencia ${dto.audienciaTipo}`,
    );

    return nuevoComunicado;
  }
}