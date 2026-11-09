import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  Emisor,
  EmitirNotificacionDto,
  EmitirResultado,
} from '@Notificaciones/dto';
import {
  DestinatariosRepository,
  NotificacionRepository,
} from '@Notificaciones/repositories';
import { EnvioService } from './envio.service.js';

const ROL_ADMINISTRADOR = 'ADMINISTRADOR'; // valor del enum Role de H13
const TIPOS_DESTINATARIO = ['RESIDENTE', 'UNIDAD', 'GRUPO'];

@Injectable()
export class NotificacionesService {
  constructor(
    private readonly destinatarios: DestinatariosRepository,
    private readonly notificaciones: NotificacionRepository,
    private readonly envio: EnvioService,
  ) {}

  /**
   * Convierte un aviso en una notificación por residente.
   * `emisor` es quien lo emite (lo pasa el módulo que llama, desde la sesión).
   */
  async emitir(
    dto: EmitirNotificacionDto,
    emisor?: Emisor,
  ): Promise<EmitirResultado> {
    this.validar(dto);

    const forzada = dto.forzada === true;
    if (forzada && emisor?.rol !== ROL_ADMINISTRADOR) {
      throw new ForbiddenException({
        codigo: 'ROL_NO_PERMITIDO',
        mensaje: 'Solo un administrador puede emitir notificaciones forzadas',
      });
    }

    const residentes = await this.destinatarios.resolver(dto.destinatario);
    if (residentes === null) {
      throw new NotFoundException({
        codigo: 'DESTINATARIO_INEXISTENTE',
        mensaje: 'El destinatario no existe',
      });
    }

    // Forzada ignora las preferencias. Sin registro de preferencia se asume activo.
    const apagados = forzada
      ? new Set<string>()
      : await this.destinatarios.desactivados(
          residentes.map((r) => r.id),
          dto.moduloOrigen,
        );
    const destinos = residentes
      .filter((r) => !apagados.has(r.id))
      .map((r) => ({ residenteId: r.id, unidadId: r.unidadId }));

    const loteId = await this.notificaciones.crearLote(
      { moduloOrigen: dto.moduloOrigen, emitidoPorId: emisor?.id ?? null },
      {
        tipo: dto.tipo,
        titulo: dto.titulo?.trim() || dto.tipo,
        mensaje: dto.mensaje,
        moduloOrigen: dto.moduloOrigen,
        enlaceAccion: dto.enlaceAccion ?? null,
        forzada,
      },
      destinos,
    );

    // Primer intento inmediato. Si falla, lo retoma la tarea programada.
    for (const n of await this.notificaciones.porLote(loteId)) {
      await this.envio.procesar(n);
    }

    return {
      loteId,
      creadas: destinos.length,
      omitidas: residentes.length - destinos.length,
    };
  }

  private validar(dto: EmitirNotificacionDto): void {
    const invalida = (mensaje: string) =>
      new BadRequestException({ codigo: 'SOLICITUD_INVALIDA', mensaje });

    const d = dto?.destinatario;
    if (!d || !d.tipo || d.id === undefined || d.id === null || d.id === '') {
      throw invalida('El destinatario es obligatorio');
    }
    if (!TIPOS_DESTINATARIO.includes(d.tipo)) {
      throw invalida('El tipo de destinatario debe ser RESIDENTE, UNIDAD o GRUPO');
    }
    if (!dto.tipo?.trim()) throw invalida('El tipo es obligatorio');
    if (!dto.mensaje?.trim()) throw invalida('El mensaje es obligatorio');
    if (!dto.moduloOrigen?.trim()) {
      throw invalida('El módulo de origen es obligatorio');
    }
  }
}
