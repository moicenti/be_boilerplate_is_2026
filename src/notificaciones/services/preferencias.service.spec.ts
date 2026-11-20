import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PreferenciasService } from './preferencias.service.js';
import { NotificacionesService } from './notificaciones.service.js';
import { PreferenciasRepository } from '../repositories/preferencias.repository.js';
import { MODULOS_NOTIFICACION } from '../dto/modulos-notificacion.js';

const YO = { id: 'residente-1' };

describe('PreferenciasService', () => {
  const repo = { listar: vi.fn(), guardar: vi.fn() };
  let service: PreferenciasService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new PreferenciasService(repo as never);
  });

  describe('obtener', () => {
    it('sin ninguna fila devuelve los 7 módulos activos', async () => {
      repo.listar.mockResolvedValue([]);

      const res = await service.obtener(YO);

      expect(res).toHaveLength(7);
      expect(res.map((p) => p.modulo)).toEqual([...MODULOS_NOTIFICACION]);
      expect(res.every((p) => p.activo)).toBe(true);
    });

    it('respeta lo guardado y deja activos los que no tienen fila', async () => {
      repo.listar.mockResolvedValue([
        { moduloOrigen: 'paqueteria', activo: false },
        { moduloOrigen: 'pagos', activo: true },
      ]);

      const res = await service.obtener(YO);

      expect(res.find((p) => p.modulo === 'paqueteria')?.activo).toBe(false);
      expect(res.find((p) => p.modulo === 'pagos')?.activo).toBe(true);
      expect(res.find((p) => p.modulo === 'visitas')?.activo).toBe(true);
      expect(res).toHaveLength(7);
    });

    it('ignora filas de módulos que ya no están en el catálogo', async () => {
      repo.listar.mockResolvedValue([{ moduloOrigen: 'viejo', activo: false }]);
      expect(await service.obtener(YO)).toHaveLength(7);
    });

    it('consulta solo al residente de la sesión', async () => {
      repo.listar.mockResolvedValue([]);
      await service.obtener({ id: 'otro' });
      expect(repo.listar).toHaveBeenCalledWith('otro');
    });
  });

  describe('guardar', () => {
    it('guarda y devuelve la lista completa actualizada', async () => {
      repo.guardar.mockResolvedValue([
        { moduloOrigen: 'pagos', activo: true },
        { moduloOrigen: 'paqueteria', activo: false },
      ]);

      const res = await service.guardar(YO, [
        { modulo: 'pagos', activo: true },
        { modulo: 'paqueteria', activo: false },
      ]);

      expect(repo.guardar).toHaveBeenCalledWith('residente-1', [
        { modulo: 'pagos', activo: true },
        { modulo: 'paqueteria', activo: false },
      ]);
      expect(res).toHaveLength(7);
      expect(res.find((p) => p.modulo === 'paqueteria')?.activo).toBe(false);
    });

    it('un módulo fuera del catálogo devuelve 400 MODULO_INVALIDO y no guarda nada', async () => {
      const intento = service.guardar(YO, [
        { modulo: 'pagos', activo: false },
        { modulo: 'paquetes', activo: false }, // el nombre descartado del diseño
      ]);

      await expect(intento).rejects.toBeInstanceOf(BadRequestException);
      await expect(intento).rejects.toMatchObject({
        response: { codigo: 'MODULO_INVALIDO' },
      });
      expect(repo.guardar).not.toHaveBeenCalled();
    });

    it('preferencias de otro residente: 403 RECURSO_AJENO y no guarda nada', async () => {
      const intento = service.guardar(YO, [
        { modulo: 'pagos', activo: false, residenteId: 'otro-residente' },
      ]);

      await expect(intento).rejects.toBeInstanceOf(ForbiddenException);
      await expect(intento).rejects.toMatchObject({
        response: { codigo: 'RECURSO_AJENO' },
      });
      expect(repo.guardar).not.toHaveBeenCalled();
    });

    it('el 403 tiene prioridad sobre el 400', async () => {
      const intento = service.guardar(YO, [
        { modulo: 'no-existe', activo: true, residenteId: 'otro-residente' },
      ]);
      await expect(intento).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('acepta el propio residenteId', async () => {
      repo.guardar.mockResolvedValue([]);
      await expect(
        service.guardar(YO, [{ modulo: 'pagos', activo: true, residenteId: 'residente-1' }]),
      ).resolves.toHaveLength(7);
    });

    it('si un módulo viene repetido, vale el último', async () => {
      repo.guardar.mockResolvedValue([]);

      await service.guardar(YO, [
        { modulo: 'pagos', activo: true },
        { modulo: 'pagos', activo: false },
      ]);

      expect(repo.guardar).toHaveBeenCalledWith('residente-1', [
        { modulo: 'pagos', activo: false },
      ]);
    });

    it('una lista vacía no cambia nada y devuelve el estado actual', async () => {
      repo.guardar.mockResolvedValue([]);
      expect(await service.guardar(YO, [])).toHaveLength(7);
    });
  });
});

describe('PreferenciasRepository', () => {
  function conPrisma() {
    const tx = {
      preferenciaNotificacion: {
        upsert: vi.fn().mockResolvedValue({}),
        findMany: vi.fn().mockResolvedValue([{ moduloOrigen: 'pagos', activo: false }]),
      },
    };
    const prisma = {
      preferenciaNotificacion: { findMany: vi.fn().mockResolvedValue([]) },
      $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
    };
    return { repo: new PreferenciasRepository(prisma as never), tx, prisma };
  }

  it('hace upsert por (residente, módulo) dentro de una sola transacción', async () => {
    const { repo, tx, prisma } = conPrisma();

    const res = await repo.guardar('residente-1', [
      { modulo: 'pagos', activo: false },
      { modulo: 'visitas', activo: true },
    ]);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.preferenciaNotificacion.upsert).toHaveBeenCalledTimes(2);
    expect(tx.preferenciaNotificacion.upsert.mock.calls[0][0]).toEqual({
      where: {
        residenteId_moduloOrigen: { residenteId: 'residente-1', moduloOrigen: 'pagos' },
      },
      create: { residenteId: 'residente-1', moduloOrigen: 'pagos', activo: false },
      update: { activo: false },
    });
    expect(res).toEqual([{ moduloOrigen: 'pagos', activo: false }]);
  });

  it('si un upsert falla, la transacción falla y no devuelve un estado parcial', async () => {
    const { repo, tx } = conPrisma();
    tx.preferenciaNotificacion.upsert
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('db caída'));

    await expect(
      repo.guardar('residente-1', [
        { modulo: 'pagos', activo: false },
        { modulo: 'visitas', activo: false },
      ]),
    ).rejects.toThrow('db caída');
    expect(tx.preferenciaNotificacion.findMany).not.toHaveBeenCalled();
  });

  it('listar filtra por residente', async () => {
    const { repo, prisma } = conPrisma();
    await repo.listar('residente-1');
    expect(prisma.preferenciaNotificacion.findMany).toHaveBeenCalledWith({
      where: { residenteId: 'residente-1' },
      select: { moduloOrigen: true, activo: true },
    });
  });
});

describe('H25 + H23: la preferencia guardada se respeta al emitir', () => {
  const destinatarios = { resolver: vi.fn(), desactivados: vi.fn() };
  const notificaciones = { crearLote: vi.fn(), porLote: vi.fn() };
  const envio = { procesar: vi.fn() };
  let emisor: NotificacionesService;

  const dto = {
    destinatario: { tipo: 'RESIDENTE' as const, id: 'residente-1' },
    tipo: 'AVISO_PAQUETE',
    mensaje: 'Llegó un paquete',
    moduloOrigen: 'paqueteria' as const,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    destinatarios.resolver.mockResolvedValue([{ id: 'residente-1', unidadId: null }]);
    notificaciones.crearLote.mockResolvedValue(1);
    notificaciones.porLote.mockResolvedValue([]);
    emisor = new NotificacionesService(
      destinatarios as never,
      notificaciones as never,
      envio as never,
    );
  });

  it('paqueteria desactivada + envío normal → 0 notificaciones', async () => {
    destinatarios.desactivados.mockResolvedValue(new Set(['residente-1']));

    const res = await emisor.emitir(dto, { id: 'sistema', rol: 'RESIDENTE' });

    expect(res).toEqual({ loteId: 1, creadas: 0, omitidas: 1 });
  });

  it('paqueteria desactivada + envío forzado por un administrador → 1 notificación forzada', async () => {
    destinatarios.desactivados.mockResolvedValue(new Set(['residente-1']));

    const res = await emisor.emitir(
      { ...dto, forzada: true },
      { id: 'admin-1', rol: 'ADMINISTRADOR' },
    );

    expect(res).toEqual({ loteId: 1, creadas: 1, omitidas: 0 });
    expect(notificaciones.crearLote.mock.calls[0][1].forzada).toBe(true);
  });
});
