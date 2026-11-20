import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificacionesService } from './notificaciones.service.js';
import { DestinatariosRepository } from '../repositories/destinatarios.repository.js';
import { NotificacionRepository } from '../repositories/notificacion.repository.js';
import { EnvioService } from './envio.service.js';
import { MODULOS_NOTIFICACION } from '@Notificaciones/dto';

describe('NotificacionesService', () => {
  const destinatariosRepo = {
    resolver: vi.fn(),
    desactivados: vi.fn(),
  };
  const notificacionesRepo = {
    crearLote: vi.fn(),
    porLote: vi.fn(),
  };
  const envioService = {
    procesar: vi.fn(),
  };

  let service: NotificacionesService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new NotificacionesService(
      destinatariosRepo as never,
      notificacionesRepo as never,
      envioService as never,
    );
  });

  describe('emitir', () => {
    const dtoValido = {
      destinatario: { tipo: 'RESIDENTE' as const, id: 'user-1' },
      tipo: 'URGENTE',
      mensaje: 'Mensaje de prueba',
      moduloOrigen: 'anuncios' as const,
    };

    it('debe validar que el módulo de origen sea parte del catálogo permitido', async () => {
      const dtoInvalido = { ...dtoValido, moduloOrigen: 'paquetes' }; // Error común: paquetes vs paqueteria

      const intento = service.emitir(dtoInvalido as never, {
        id: 'admin-1',
        rol: 'ADMINISTRADOR',
      });

      await expect(intento).rejects.toBeInstanceOf(BadRequestException);
      await expect(intento).rejects.toMatchObject({
        response: {
          codigo: 'MODULO_INVALIDO',
          mensaje: expect.stringContaining('El módulo debe ser uno de:'),
        },
      });
    });

    it('debe rechazar notificaciones forzadas si no es ADMINISTRADOR', async () => {
      const dtoForzada = { ...dtoValido, forzada: true };
      const emisorNoAdmin = { id: 'user-1', rol: 'RESIDENTE' };

      const intento = service.emitir(dtoForzada, emisorNoAdmin);

      await expect(intento).rejects.toBeInstanceOf(ForbiddenException);
      await expect(intento).rejects.toMatchObject({
        response: { codigo: 'ROL_NO_PERMITIDO' },
      });
    });

    it('debe lanzar 404 si el destinatario no existe', async () => {
      destinatariosRepo.resolver.mockResolvedValue(null);

      const intento = service.emitir(dtoValido, {
        id: 'admin-1',
        rol: 'ADMINISTRADOR',
      });

      await expect(intento).rejects.toBeInstanceOf(NotFoundException);
      await expect(intento).rejects.toMatchObject({
        response: { codigo: 'DESTINATARIO_INEXISTENTE' },
      });
    });

    it('debe crear el lote y procesar el envío para los destinos válidos', async () => {
      destinatariosRepo.resolver.mockResolvedValue([
        { id: 'user-1', unidadId: 'unit-1' },
      ]);
      destinatariosRepo.desactivados.mockResolvedValue(new Set()); // Ninguno desactivado
      notificacionesRepo.crearLote.mockResolvedValue(99);
      notificacionesRepo.porLote.mockResolvedValue([{ id: 1 }]);

      const resultado = await service.emitir(dtoValido, {
        id: 'admin-1',
        rol: 'ADMINISTRADOR',
      });

      expect(notificacionesRepo.crearLote).toHaveBeenCalled();
      expect(envioService.procesar).toHaveBeenCalledWith({ id: 1 });
      expect(resultado).toEqual({ loteId: 99, creadas: 1, omitidas: 0 });
    });
  });
});
