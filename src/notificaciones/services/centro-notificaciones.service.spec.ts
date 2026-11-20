import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CentroNotificacionesService } from './centro-notificaciones.service.js';
import { CentroNotificacionesRepository } from '../repositories/centro-notificaciones.repository.js';

const YO = { id: 'residente-1' };

describe('CentroNotificacionesService', () => {
  const repo = {
    listar: vi.fn(),
    contarNoLeidas: vi.fn(),
    buscarPropiedad: vi.fn(),
    actualizarLeida: vi.fn(),
  };
  let service: CentroNotificacionesService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new CentroNotificacionesService(repo as never);
  });

  describe('listar', () => {
    beforeEach(() => repo.listar.mockResolvedValue({ total: 42, items: [] }));

    it('por defecto pide la página 1 con 20 elementos', async () => {
      const res = await service.listar(YO, {});
      expect(repo.listar).toHaveBeenCalledWith(
        'residente-1',
        0,
        20,
        undefined,
        undefined,
      );
      expect(res).toEqual({ total: 42, page: 1, size: 20, items: [] });
    });

    it('calcula el desplazamiento de la página pedida', async () => {
      await service.listar(YO, { page: 3, size: 10 });
      expect(repo.listar).toHaveBeenCalledWith(
        'residente-1',
        20,
        10,
        undefined,
        undefined,
      );
    });

    it('pasa los filtros de modulo y leidas al repositorio', async () => {
      await service.listar(YO, { modulo: 'anuncios', leidas: 'sin_leer' });
      expect(repo.listar).toHaveBeenCalledWith(
        'residente-1',
        0,
        20,
        'anuncios',
        'sin_leer',
      );
    });

    it('nunca devuelve más de 20 por página', async () => {
      const res = await service.listar(YO, { size: 500 });
      expect(repo.listar).toHaveBeenCalledWith(
        'residente-1',
        0,
        20,
        undefined,
        undefined,
      );
      expect(res.size).toBe(20);
    });

    it('corrige página y tamaño inválidos (0 o negativos)', async () => {
      const res = await service.listar(YO, { page: 0, size: -5 });
      expect(repo.listar).toHaveBeenCalledWith(
        'residente-1',
        0,
        1,
        undefined,
        undefined,
      );
      expect(res.page).toBe(1);
      expect(res.size).toBe(1);
    });
  });

  describe('contarNoLeidas', () => {
    it('devuelve { count } del residente de la sesión', async () => {
      repo.contarNoLeidas.mockResolvedValue(5);
      expect(await service.contarNoLeidas(YO)).toEqual({ count: 5 });
      expect(repo.contarNoLeidas).toHaveBeenCalledWith('residente-1');
    });
  });

  describe('cambiarLeida', () => {
    const propia = {
      id: 901,
      residenteId: 'residente-1',
      leida: false,
      fechaLectura: null,
    };

    it('marcar como leída guarda la fecha y devuelve el cambio', async () => {
      const fecha = new Date('2026-11-03T20:10:00Z');
      repo.buscarPropiedad.mockResolvedValue(propia);
      repo.actualizarLeida.mockResolvedValue({
        id: 901,
        leida: true,
        fechaLectura: fecha,
      });

      const res = await service.cambiarLeida(YO, 901, true);
      expect(repo.actualizarLeida).toHaveBeenCalledWith(901, true);
      expect(res).toEqual({ id: 901, leida: true, fechaLectura: fecha });
    });

    it('repetir el mismo estado no toca la base ni pisa la fecha original', async () => {
      const original = new Date('2026-11-01T10:00:00Z');
      repo.buscarPropiedad.mockResolvedValue({
        ...propia,
        leida: true,
        fechaLectura: original,
      });

      const res = await service.cambiarLeida(YO, 901, true);
      expect(repo.actualizarLeida).not.toHaveBeenCalled();
      expect(res).toEqual({ id: 901, leida: true, fechaLectura: original });
    });

    it('notificación inexistente: 404 NOTIFICACION_INEXISTENTE', async () => {
      repo.buscarPropiedad.mockResolvedValue(null);
      const intento = service.cambiarLeida(YO, 999, true);
      await expect(intento).rejects.toBeInstanceOf(NotFoundException);
      await expect(intento).rejects.toMatchObject({
        response: { codigo: 'NOTIFICACION_INEXISTENTE' },
      });
    });

    it('notificación de otro residente: 403 RECURSO_AJENO', async () => {
      repo.buscarPropiedad.mockResolvedValue({
        ...propia,
        residenteId: 'otro-residente',
      });
      const intento = service.cambiarLeida(YO, 901, true);
      await expect(intento).rejects.toBeInstanceOf(ForbiddenException);
      await expect(intento).rejects.toMatchObject({
        response: { codigo: 'RECURSO_AJENO' },
      });
    });
  });
});

describe('CentroNotificacionesRepository', () => {
  function repoConPrisma() {
    const notificacion = {
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
    };
    const prisma = {
      notificacion,
      $transaction: vi.fn(async (consultas: Promise<unknown>[]) =>
        Promise.all(consultas),
      ),
    };
    return {
      repo: new CentroNotificacionesRepository(prisma as never),
      notificacion,
    };
  }

  it('el listado filtra por residente, excluye FALLIDO_PERMANENTE y ordena por fecha descendente', async () => {
    const { repo, notificacion } = repoConPrisma();
    await repo.listar('residente-1', 20, 10, 'anuncios', 'sin_leer');

    // Verificar count
    expect(notificacion.count).toHaveBeenCalledWith({
      where: {
        residenteId: 'residente-1',
        estado: { not: 'FALLIDO_PERMANENTE' },
        moduloOrigen: 'anuncios',
        leida: false,
      },
    });

    // Verificar findMany
    const args = notificacion.findMany.mock.calls[0][0];
    expect(args.where).toEqual({
      residenteId: 'residente-1',
      estado: { not: 'FALLIDO_PERMANENTE' },
      moduloOrigen: 'anuncios',
      leida: false,
    });
    expect(args.orderBy).toEqual([{ fechaCreacion: 'desc' }, { id: 'desc' }]);
    expect(args.skip).toBe(20);
    expect(args.take).toBe(10);
  });

  it('el conteo cuenta solo las no leídas del residente y excluye FALLIDO_PERMANENTE', async () => {
    const { repo, notificacion } = repoConPrisma();
    notificacion.count.mockResolvedValue(5);

    expect(await repo.contarNoLeidas('residente-1')).toBe(5);
    expect(notificacion.count).toHaveBeenCalledWith({
      where: {
        residenteId: 'residente-1',
        leida: false,
        estado: { not: 'FALLIDO_PERMANENTE' },
      },
    });
  });

  it('marcar guarda la hora actual y desmarcar guarda nulo', async () => {
    const { repo, notificacion } = repoConPrisma();

    await repo.actualizarLeida(1, true);
    const marcar = notificacion.update.mock.calls[0][0].data;
    expect(marcar.leida).toBe(true);
    expect(marcar.fechaLectura).toBeInstanceOf(Date);

    await repo.actualizarLeida(1, false);
    const desmarcar = notificacion.update.mock.calls[1][0].data;
    expect(desmarcar).toEqual({ leida: false, fechaLectura: null });
  });
});
