import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DirectorioRepository } from '../repositories/index.js';
import { ActualizarPrivacidadDto } from '../dto/index.js';

@Injectable()
export class DirectorioService {
  constructor(private readonly directorioRepository: DirectorioRepository) {}

  async obtenerPreferencias(userId: string) {
    const usuario = await this.directorioRepository.obtenerPerfilUsuario(userId);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const pref = usuario.perfilDirectorio;
    const nombreCompleto =
      [pref?.nombre, pref?.apellido].filter(Boolean).join(' ').trim() ||
      usuario.email.split('@')[0];

    // BE-21.1: Si no hay registro, devuelve todo en false
    return {
      residenteId: usuario.id,
      correo: usuario.email,
      nombreCompleto,
      telefono: pref?.telefono ?? null,
      unidad: usuario.unit
        ? {
            codigo: usuario.unit.code,
            torre: usuario.unit.tower,
            descripcion: usuario.unit.description,
          }
        : null,
      visibleGlobal: pref?.visibleGlobal ?? false,
      mostrarTelefono: pref?.mostrarTelefono ?? false,
      mostrarCorreo: pref?.mostrarCorreo ?? false,
      mostrarNombre: pref?.mostrarNombre ?? false,
      mostrarUnidad: pref?.mostrarUnidad ?? false,
      actualizadoEn: pref?.actualizadoEn ?? null,
    };
  }

  async actualizarPreferencias(userId: string, dto: ActualizarPrivacidadDto) {
    // BE-21.2: 403 Forbidden si intenta modificar preferencias de otro residente
    if (dto.residenteId && dto.residenteId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para modificar las preferencias de otro residente.',
      );
    }

    await this.directorioRepository.guardarPreferencias(userId, dto);
    return this.obtenerPreferencias(userId);
  }
}