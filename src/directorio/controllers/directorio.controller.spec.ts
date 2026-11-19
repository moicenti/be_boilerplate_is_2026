import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { DirectorioController } from './directorio.controller.js';
import { DirectorioService } from '../services/index.js';
import type { User } from '@PrismaClient';

describe('DirectorioController (H21 & H22)', () => {
  let controller: DirectorioController;
  let service: {
    obtenerPreferencias: ReturnType<typeof vi.fn>;
    actualizarPreferencias: ReturnType<typeof vi.fn>;
    buscarEnDirectorio: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    service = {
      obtenerPreferencias: vi.fn(),
      actualizarPreferencias: vi.fn(),
      buscarEnDirectorio: vi.fn(),
    };
    controller = new DirectorioController(service as unknown as DirectorioService);
  });

  // --- Pruebas H21 ---
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

  // --- Pruebas H22 ---
  it('debe delegar la búsqueda de contactos y respetar datos autorizados y "Contacto privado" (BE-22.1 & BE-22.2)', async () => {
    const userMock = { id: 'user-1', email: 'ana.martinez@example.com' } as User;
    const filtros = { q: 'A-', pagina: 1, tamano: 10 };

    service.buscarEnDirectorio.mockResolvedValue({
      total: 2,
      pagina: 1,
      tamano: 10,
      totalPaginas: 1,
      resumen: { perfilesVisibles: 1, conContacto: 1 },
      items: [
        {
          id: 'user-1',
          esPropio: true,
          esPrivado: false,
          visibleGlobal: true,
          nombreCompleto: 'Ana Martínez',
          unidad: 'A-304',
          correo: 'ana.martinez@example.com',
          telefono: null,
          etiquetaContacto: null,
        },
        {
          id: 'user-2',
          esPropio: false,
          esPrivado: true,
          visibleGlobal: false,
          nombreCompleto: 'Contacto privado',
          unidad: 'A-19',
          correo: null,
          telefono: null,
          etiquetaContacto: 'Contacto privado',
        },
      ],
    });

    const res = await controller.buscarDirectorio(userMock, filtros);

    expect(service.buscarEnDirectorio).toHaveBeenCalledWith('user-1', filtros);
    expect(res.items[0].correo).toBe('ana.martinez@example.com');
    expect(res.items[0].telefono).toBeNull();
    expect(res.items[1].esPrivado).toBe(true);
    expect(res.items[1].nombreCompleto).toBe('Contacto privado');
    expect(res.items[1].correo).toBeNull();
    expect(res.items[1].telefono).toBeNull();
  });
});