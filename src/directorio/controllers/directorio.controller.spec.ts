import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { DirectorioController } from './index.js';
import { DirectorioService } from '../services/index.js';
import type { User } from '@PrismaClient';

describe('DirectorioController - Privacidad (H21)', () => {
  let controller: DirectorioController;
  let service: {
    obtenerPreferencias: ReturnType<typeof vi.fn>;
    actualizarPreferencias: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    service = {
      obtenerPreferencias: vi.fn(),
      actualizarPreferencias: vi.fn(),
    };
    controller = new DirectorioController(service as unknown as DirectorioService);
  });

  it('debe consultar las preferencias de privacidad del residente autenticado (BE-21.1)', async () => {
    const userMock = { id: 'user-1', email: 'demo@example.com' } as User;
    service.obtenerPreferencias.mockResolvedValue({
      residenteId: 'user-1',
      correo: 'demo@example.com',
      visibleGlobal: false,
      mostrarTelefono: false,
      mostrarCorreo: false,
      mostrarNombre: false,
      mostrarUnidad: false,
    });

    const result = await controller.obtenerPreferencias(userMock);

    expect(service.obtenerPreferencias).toHaveBeenCalledWith('user-1');
    expect(result.visibleGlobal).toBe(false);
    expect(result.mostrarTelefono).toBe(false);
    expect(result.mostrarCorreo).toBe(false);
  });

  it('debe actualizar y retornar las preferencias de privacidad del residente (BE-21.2)', async () => {
    const userMock = { id: 'user-1', email: 'demo@example.com' } as User;
    const dto = {
      visibleGlobal: true,
      mostrarTelefono: false,
      mostrarCorreo: true,
      mostrarNombre: true,
      mostrarUnidad: true,
    };
    service.actualizarPreferencias.mockResolvedValue({
      residenteId: 'user-1',
      ...dto,
    });

    const result = await controller.actualizarPreferencias(userMock, dto);

    expect(service.actualizarPreferencias).toHaveBeenCalledWith('user-1', dto);
    expect(result.visibleGlobal).toBe(true);
    expect(result.mostrarCorreo).toBe(true);
    expect(result.mostrarTelefono).toBe(false);
  });

  it('debe propagar ForbiddenException (403) si intenta modificar preferencias de otro residente', async () => {
    const userMock = { id: 'user-1', email: 'demo@example.com' } as User;
    const dtoAjeno = {
      residenteId: 'otro-usuario-id',
      visibleGlobal: true,
      mostrarTelefono: true,
      mostrarCorreo: true,
    };
    service.actualizarPreferencias.mockRejectedValue(
      new ForbiddenException('No tienes permiso para modificar las preferencias de otro residente.'),
    );

    await expect(controller.actualizarPreferencias(userMock, dtoAjeno)).rejects.toThrow(
      ForbiddenException,
    );
  });
});