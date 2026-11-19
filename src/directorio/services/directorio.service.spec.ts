import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { DirectorioService } from './directorio.service.js';
import { DirectorioRepository } from '../repositories/index.js';

describe('DirectorioService - Privacidad (H21)', () => {
  let service: DirectorioService;
  let repository: {
    obtenerPerfilUsuario: ReturnType<typeof vi.fn>;
    guardarPrivacidad: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    repository = {
      obtenerPerfilUsuario: vi.fn(),
      guardarPrivacidad: vi.fn(),
    };
    service = new DirectorioService(repository as unknown as DirectorioRepository);
  });

  it('debe devolver valores por defecto cuando el residente aún no configura su privacidad', async () => {
    repository.obtenerPerfilUsuario.mockResolvedValue({
      id: 'user-1',
      email: 'demo@example.com',
      role: 'RESIDENTE',
      unit: { id: 'u-1', code: 'A-19', tower: 'Torre A', description: 'Torre A, departamento 19' },
      perfilDirectorio: null,
    });

    const res = await service.obtenerMiPrivacidad('user-1');

    expect(res.visibleEnDirectorio).toBe(true);
    expect(res.mostrarTelefono).toBe(false);
    expect(res.mostrarCorreo).toBe(false);
    expect(res.unidad?.codigo).toBe('A-19');
  });

  it('debe lanzar NotFoundException si el usuario no existe', async () => {
    repository.obtenerPerfilUsuario.mockResolvedValue(null);

    await expect(service.obtenerMiPrivacidad('inexistente')).rejects.toThrow(NotFoundException);
  });

  it('debe actualizar la visibilidad global, teléfono y correo del perfil vecinal', async () => {
    repository.guardarPrivacidad.mockResolvedValue({});
    repository.obtenerPerfilUsuario.mockResolvedValue({
      id: 'user-1',
      email: 'demo@example.com',
      role: 'RESIDENTE',
      unit: { id: 'u-1', code: 'A-19', tower: 'Torre A', description: 'Torre A, departamento 19' },
      perfilDirectorio: {
        nombre: 'Jonatan',
        apellido: 'Segura',
        telefono: '7123-4567',
        visibleEnDirectorio: false,
        mostrarTelefono: true,
        mostrarCorreo: true,
        actualizadoEn: new Date('2026-11-18T22:00:00.000Z'),
      },
    });

    const res = await service.actualizarMiPrivacidad('user-1', {
      nombre: 'Jonatan',
      apellido: 'Segura',
      telefono: '7123-4567',
      visibleEnDirectorio: false,
      mostrarTelefono: true,
      mostrarCorreo: true,
    });

    expect(repository.guardarPrivacidad).toHaveBeenCalledTimes(1);
    expect(res.visibleEnDirectorio).toBe(false);
    expect(res.mostrarTelefono).toBe(true);
    expect(res.mostrarCorreo).toBe(true);
    expect(res.nombre).toBe('Jonatan');
  });
});