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

const ROL_ADMINISTRADOR = 'ADMINISTRADOR'; // AJUSTAR al valor real de tu enum Role

@Injectable()
export class NotificacionesService {
  constructor(
    private readonly destinatarios: DestinatariosRepository,
    private readonly notificaciones: NotificacionRepository,
    private readonly envio: EnvioService,
  ) {}

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
        titulo: dto.titulo ?? dto.tipo,
        mensaje: dto.mensaje,
        moduloOrigen: dto.moduloOrigen,
        enlaceAccion: dto.enlaceAccion ?? null,
        forzada,
      },
      destinos,
    );

    // Primer intento inmediato; si falla, lo retoma el cron. No afecta la respuesta.
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
    const falta = (campo: string, msg: string) =>
      new BadRequestException({
        codigo: 'SOLICITUD_INVALIDA',
        mensaje: msg,
        campo,
      });

    if (
      !dto?.destinatario?.tipo ||
      dto.destinatario.id === undefined ||
      dto.destinatario.id === ''
    ) {
      throw falta('destinatario', 'El destinatario es obligatorio');
    }
    if (!dto.tipo?.trim()) throw falta('tipo', 'El tipo es obligatorio');
    if (!dto.mensaje?.trim())
      throw falta('mensaje', 'El mensaje es obligatorio');
    if (!dto.moduloOrigen?.trim())
      throw falta('moduloOrigen', 'El módulo de origen es obligatorio');
  }
}
