import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
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

    this.logger.log(
      `Evento emitido al Modulo 9 para comunicado ID ${nuevoComunicado.id} con prioridad ${dto.prioridad} y audiencia ${dto.audienciaTipo}`,
    );

    return nuevoComunicado;
  }

  private async verificarAccesoAudiencia(
    comunicado: { audienciaTipo: string; audienciaTarget: string | null },
    user: { id: string; role?: string; unitId?: string | null },
  ) {
    if (user.role === 'ADMINISTRADOR') return;
    if (comunicado.audienciaTipo === 'TODO_EL_CONDOMINIO') return;

    const ubicacion = await this.comunicadosRepository.obtenerUbicacionUsuario(
      user.id,
      user.unitId,
    );

    if (comunicado.audienciaTipo === 'POR_TORRE') {
      const coincideTorre =
        ubicacion?.tower &&
        comunicado.audienciaTarget &&
        ubicacion.tower.trim().toLowerCase() === comunicado.audienciaTarget.trim().toLowerCase();

      if (!coincideTorre) {
        throw new ForbiddenException('Este comunicado está dirigido a otra torre.');
      }
      return;
    }

    if (comunicado.audienciaTipo === 'POR_SECCION') {
      const target = comunicado.audienciaTarget?.trim().toLowerCase();
      const coincideSeccion =
        ubicacion &&
        target &&
        (ubicacion.description.trim().toLowerCase() === target ||
          ubicacion.code.trim().toLowerCase() === target);

      if (!coincideSeccion) {
        throw new ForbiddenException('Este comunicado está dirigido a otra sección.');
      }
    }
  }

  async obtenerMuro(user: { id: string; role?: string; unitId?: string | null }) {
    const ubicacion = await this.comunicadosRepository.obtenerUbicacionUsuario(
      user.id,
      user.unitId,
    );
    const lista = await this.comunicadosRepository.obtenerMuroResidente(user.id, ubicacion, user.role === 'ADMINISTRADOR');

    return lista.map(({ lecturas, ...comunicado }) => ({
      ...comunicado,
      leido: lecturas.length > 0,
      fechaLectura: lecturas[0]?.fechaLectura ?? null,
    }));
  }

  async obtenerDetalle(id: number, user: { id: string; role?: string; unitId?: string | null }) {
    const comunicado = await this.comunicadosRepository.obtenerPorId(id, user.id);

    if (!comunicado) {
      throw new NotFoundException('El comunicado solicitado no existe.');
    }

    await this.verificarAccesoAudiencia(comunicado, user);

    const { lecturas, ...datos } = comunicado;
    return {
      ...datos,
      leido: lecturas.length > 0,
      fechaLectura: lecturas[0]?.fechaLectura ?? null,
    };
  }

  async marcarComoLeido(id: number, user: { id: string; role?: string; unitId?: string | null }) {
    const comunicado = await this.comunicadosRepository.obtenerPorId(id, user.id);

    if (!comunicado) {
      throw new NotFoundException('El comunicado solicitado no existe.');
    }

    await this.verificarAccesoAudiencia(comunicado, user);

    const lectura = await this.comunicadosRepository.registrarLectura(id, user.id);

    return {
      comunicadoId: id,
      leido: true,
      fechaLectura: lectura.fechaLectura,
    };
  }
}