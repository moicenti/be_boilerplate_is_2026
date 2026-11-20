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
// ✅ CORRECCIÓN 1: Importar el valor del catálogo por separado (no como 'type')
import { MODULOS_NOTIFICACION } from '@Notificaciones/dto';
import {
  DestinatariosRepository,
  NotificacionRepository,
} from '@Notificaciones/repositories';
import { EnvioService } from './envio.service.js';

const ROL_ADMINISTRADOR = 'ADMINISTRADOR';
const TIPOS_DESTINATARIO = ['RESIDENTE', 'UNIDAD', 'GRUPO'];

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
        titulo: dto.titulo?.trim() || dto.tipo,
        mensaje: dto.mensaje,
        moduloOrigen: dto.moduloOrigen,
        enlaceAccion: dto.enlaceAccion ?? null,
        forzada,
      },
      destinos,
    );

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
      throw invalida(
        'El tipo de destinatario debe ser RESIDENTE, UNIDAD o GRUPO',
      );
    }
    if (!dto.tipo?.trim()) throw invalida('El tipo es obligatorio');
    if (!dto.mensaje?.trim()) throw invalida('El mensaje es obligatorio');

    // ✅ CORRECCIÓN 2: Validación estricta del catálogo de 7 módulos
    if (
      !dto.moduloOrigen ||
      !(MODULOS_NOTIFICACION as readonly string[]).includes(dto.moduloOrigen)
    ) {
      throw new BadRequestException({
        codigo: 'MODULO_INVALIDO',
        mensaje: `El módulo debe ser uno de: ${MODULOS_NOTIFICACION.join(', ')}`,
      });
    }
  }
}
