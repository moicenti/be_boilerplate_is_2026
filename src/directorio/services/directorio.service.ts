import { Injectable, NotFoundException } from '@nestjs/common';
import { DirectorioRepository } from '../repositories/index.js';
import { ActualizarPrivacidadDto } from '../dto/index.js';

@Injectable()
export class DirectorioService {
  constructor(private readonly directorioRepository: DirectorioRepository) {}

  async obtenerMiPrivacidad(userId: string) {
    const usuario = await this.directorioRepository.obtenerPerfilUsuario(userId);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const perfil = usuario.perfilDirectorio;

    return {
      userId: usuario.id,
      correo: usuario.email,
      unidad: usuario.unit
        ? {
            codigo: usuario.unit.code,
            torre: usuario.unit.tower,
            descripcion: usuario.unit.description,
          }
        : null,
      nombre: perfil?.nombre ?? '',
      apellido: perfil?.apellido ?? '',
      telefono: perfil?.telefono ?? '',
      visibleEnDirectorio: perfil?.visibleEnDirectorio ?? true,
      mostrarTelefono: perfil?.mostrarTelefono ?? false,
      mostrarCorreo: perfil?.mostrarCorreo ?? false,
      actualizadoEn: perfil?.actualizadoEn ?? null,
    };
  }

  async actualizarMiPrivacidad(userId: string, dto: ActualizarPrivacidadDto) {
    await this.directorioRepository.guardarPrivacidad(userId, dto);
    return this.obtenerMiPrivacidad(userId);
  }
}