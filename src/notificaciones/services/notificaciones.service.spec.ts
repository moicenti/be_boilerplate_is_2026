import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificacionesService } from './notificaciones.service.js';
import { EnvioService } from './envio.service.js';
import { ReintentosService } from './reintentos.service.js';
import { NotificacionRepository } from '../repositories/notificacion.repository.js';

const ADMIN = { id: 'admin-1', rol: 'ADMINISTRADOR' };
const RESIDENTE = { id: 'res-1', rol: 'RESIDENTE' };

const dtoBase = {
  destinatario: { tipo: 'UNIDAD' as const, id: 'unidad-12' },
  tipo: 'AVISO_PAQUETE',
  titulo: 'Llegó un paquete',
  mensaje: 'Paquete de DHL. Código de retiro: 482913',
  moduloOrigen: 'paqueteria',
  enlaceAccion: '/paquetes/55',
};

describe('NotificacionesService.emitir', () => {
  const destinatarios = { resolver: vi.fn(), desactivados: vi.fn() };
  const notificaciones = { crearLote: vi.fn(), porLote: vi.fn() };
  const envio = { procesar: vi.fn() };
  let service: NotificacionesService;

  beforeEach(() => {
    vi.resetAllMocks();
    destinatarios.desactivados.mockResolvedValue(new Set());
    notificaciones.crearLote.mockResolvedValue(310);
    notificaciones.porLote.mockResolvedValue([]);
    service = new NotificacionesService(
      destinatarios as never,
      notificaciones as never,
      envio as never,
    );
  });

  it('una unidad con 3 residentes genera 3 notificaciones', async () => {
    destinatarios.resolver.mockResolvedValue([
      { id: 'r1', unidadId: 'unidad-12' },
      { id: 'r2', unidadId: 'unidad-12' },
      { id: 'r3', unidadId: 'unidad-12' },
    ]);

    const res = await service.emitir(dtoBase, RESIDENTE);

    expect(res).toEqual({ loteId: 310, creadas: 3, omitidas: 0 });
    const destinos = notificaciones.crearLote.mock.calls[0][2];
    expect(destinos).toHaveLength(3);
  });

  it('cuenta como omitida a quien desactivó el módulo', async () => {
    destinatarios.resolver.mockResolvedValue([
      { id: 'r1', unidadId: 'u' },
      { id: 'r2', unidadId: 'u' },
      { id: 'r3', unidadId: 'u' },
    ]);
    destinatarios.desactivados.mockResolvedValue(new Set(['r2']));

    const res = await service.emitir(dtoBase, RESIDENTE);

    expect(res).toEqual({ loteId: 310, creadas: 2, omitidas: 1 });
    const ids = notificaciones.crearLote.mock.calls[0][2].map(
      (d: { residenteId: string }) => d.residenteId,
    );
    expect(ids).toEqual(['r1', 'r3']);
  });

  it('sin registro de preferencia se asume activo', async () => {
    destinatarios.resolver.mockResolvedValue([{ id: 'r1', unidadId: 'u' }]);
    destinatarios.desactivados.mockResolvedValue(new Set());

    const res = await service.emitir(dtoBase, RESIDENTE);

    expect(res.creadas).toBe(1);
    expect(res.omitidas).toBe(0);
  });

  it('forzada por un ADMINISTRADOR ignora las preferencias y se guarda forzada', async () => {
    destinatarios.resolver.mockResolvedValue([
      { id: 'r1', unidadId: 'u' },
      { id: 'r2', unidadId: 'u' },
    ]);

    const res = await service.emitir({ ...dtoBase, forzada: true }, ADMIN);

    expect(destinatarios.desactivados).not.toHaveBeenCalled();
    expect(res).toEqual({ loteId: 310, creadas: 2, omitidas: 0 });
    expect(notificaciones.crearLote.mock.calls[0][1].forzada).toBe(true);
  });

  it('forzada por quien no es ADMINISTRADOR devuelve 403 ROL_NO_PERMITIDO', async () => {
    const intento = service.emitir({ ...dtoBase, forzada: true }, RESIDENTE);

    await expect(intento).rejects.toBeInstanceOf(ForbiddenException);
    await expect(intento).rejects.toMatchObject({
      response: { codigo: 'ROL_NO_PERMITIDO' },
    });
    expect(notificaciones.crearLote).not.toHaveBeenCalled();
  });

  it('forzada sin emisor también devuelve 403', async () => {
    await expect(
      service.emitir({ ...dtoBase, forzada: true }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('destinatario inexistente devuelve 404 DESTINATARIO_INEXISTENTE', async () => {
    destinatarios.resolver.mockResolvedValue(null);

    const intento = service.emitir(dtoBase, RESIDENTE);

    await expect(intento).rejects.toBeInstanceOf(NotFoundException);
    await expect(intento).rejects.toMatchObject({
      response: { codigo: 'DESTINATARIO_INEXISTENTE' },
    });
  });

  it('destinatario existente sin residentes activos crea el lote con 0 notificaciones', async () => {
    destinatarios.resolver.mockResolvedValue([]);

    const res = await service.emitir(dtoBase, RESIDENTE);

    expect(res).toEqual({ loteId: 310, creadas: 0, omitidas: 0 });
  });

  it.each([
    ['destinatario', { destinatario: undefined }, 'El destinatario es obligatorio'],
    ['tipo', { tipo: '' }, 'El tipo es obligatorio'],
    ['mensaje', { mensaje: '  ' }, 'El mensaje es obligatorio'],
  ])('falta %s: 400 SOLICITUD_INVALIDA', async (_campo, cambio, mensaje) => {
    const intento = service.emitir({ ...dtoBase, ...cambio } as never, ADMIN);

    await expect(intento).rejects.toBeInstanceOf(BadRequestException);
    await expect(intento).rejects.toMatchObject({
      response: { codigo: 'SOLICITUD_INVALIDA', mensaje },
    });
  });

  it('intenta el envío inmediato de cada notificación creada', async () => {
    destinatarios.resolver.mockResolvedValue([{ id: 'r1', unidadId: 'u' }]);
    notificaciones.porLote.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    await service.emitir(dtoBase, RESIDENTE);

    expect(envio.procesar).toHaveBeenCalledTimes(2);
  });
});

describe('NotificacionRepository.registrarFallo', () => {
  function repoConIntentosPrevios(previos: number) {
    const tx = {
      intentoEnvio: {
        count: vi.fn().mockResolvedValue(previos),
        create: vi.fn().mockResolvedValue({}),
      },
      notificacion: { update: vi.fn().mockResolvedValue({}) },
    };
    const prisma = {
      $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
    };
    return { repo: new NotificacionRepository(prisma as never), tx };
  }

  it('el primer fallo deja FALLIDO y registra el intento 1', async () => {
    const { repo, tx } = repoConIntentosPrevios(0);

    const estado = await repo.registrarFallo(7, 'timeout');

    expect(estado).toBe('FALLIDO');
    expect(tx.intentoEnvio.create).toHaveBeenCalledWith({
      data: { notificacionId: 7, numeroIntento: 1, motivoFallo: 'timeout' },
    });
    expect(tx.notificacion.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { estado: 'FALLIDO' },
    });
  });

  it('el segundo fallo sigue en FALLIDO', async () => {
    const { repo } = repoConIntentosPrevios(1);
    expect(await repo.registrarFallo(7, 'x')).toBe('FALLIDO');
  });

  it('el tercer fallo deja FALLIDO_PERMANENTE', async () => {
    const { repo, tx } = repoConIntentosPrevios(2);

    const estado = await repo.registrarFallo(7, 'x');

    expect(estado).toBe('FALLIDO_PERMANENTE');
    expect(tx.intentoEnvio.create.mock.calls[0][0].data.numeroIntento).toBe(3);
    expect(tx.notificacion.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { estado: 'FALLIDO_PERMANENTE' },
    });
  });
});

describe('EnvioService.procesar', () => {
  const repo = { marcarEnviada: vi.fn(), registrarFallo: vi.fn() };
  let service: EnvioService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new EnvioService(repo as never);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('si el envío funciona, marca la notificación como ENVIADA', async () => {
    await service.procesar({ id: 1 });

    expect(repo.marcarEnviada).toHaveBeenCalledWith(1);
    expect(repo.registrarFallo).not.toHaveBeenCalled();
  });

  it('si el envío falla, registra el fallo con su motivo', async () => {
    vi.stubEnv('NOTIFICACIONES_SIMULAR_FALLO', 'true');
    repo.registrarFallo.mockResolvedValue('FALLIDO');

    await service.procesar({ id: 1 });

    expect(repo.registrarFallo).toHaveBeenCalledWith(1, 'Fallo simulado de envío');
    expect(repo.marcarEnviada).not.toHaveBeenCalled();
  });

  it('no lanza aunque la base falle al registrar', async () => {
    vi.stubEnv('NOTIFICACIONES_SIMULAR_FALLO', 'true');
    repo.registrarFallo.mockRejectedValue(new Error('db caída'));

    await expect(service.procesar({ id: 1 })).resolves.toBeUndefined();
  });
});

describe('ReintentosService.reintentar', () => {
  const repo = { reintentables: vi.fn() };
  const envio = { procesar: vi.fn() };
  let service: ReintentosService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new ReintentosService(repo as never, envio as never);
  });

  it('procesa todas las notificaciones PENDIENTE o FALLIDO', async () => {
    repo.reintentables.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);

    await service.reintentar();

    expect(envio.procesar).toHaveBeenCalledTimes(3);
  });

  it('no solapa ejecuciones', async () => {
    let liberar!: () => void;
    repo.reintentables.mockResolvedValue([{ id: 1 }]);
    envio.procesar.mockImplementation(
      () => new Promise<void>((r) => (liberar = r)),
    );

    const primera = service.reintentar();
    await Promise.resolve();
    await Promise.resolve();
    await service.reintentar(); // segunda llamada mientras la primera sigue
    liberar();
    await primera;

    expect(repo.reintentables).toHaveBeenCalledTimes(1);
  });
});
