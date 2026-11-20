import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DirectorioRepository } from '../repositories/index.js';
import { ActualizarPrivacidadDto, BuscarDirectorioDto } from '../dto/index.js';

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
    if (dto.residenteId && dto.residenteId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para modificar las preferencias de otro residente.',
      );
    }

    await this.directorioRepository.guardarPreferencias(userId, dto);
    return this.obtenerPreferencias(userId);
  }

  async buscarEnDirectorio(userIdActual: string, filtros: BuscarDirectorioDto) {
    const registros = await this.directorioRepository.buscarResidentesDirectorio(
      userIdActual,
      filtros,
    );

    const itemsMapeados = registros.map((item) => {
      const pref = item.perfilDirectorio;
      const esPropio = item.id === userIdActual;
      const visibleGlobal = pref?.visibleGlobal ?? false;

      // Criterio 2 de H22: Si visibilidad global está desactivada, no revelar datos personales
      if (!visibleGlobal) {
        return {
          id: item.id,
          esPropio,
          esPrivado: true,
          visibleGlobal: false,
          nombreCompleto: 'Contacto privado',
          iniciales: 'CP',
          unidad: item.unit?.code ?? 'Sin unidad',
          unidadVisible: true,
          torre: item.unit?.tower ?? 'Sin torre',
          correo: null,
          telefono: null,
          etiquetaContacto: 'Contacto privado',
        };
      }

      const mostrarNombre = pref?.mostrarNombre ?? true;
      const mostrarUnidad = pref?.mostrarUnidad ?? true;
      const mostrarCorreo = pref?.mostrarCorreo ?? false;
      const mostrarTelefono = pref?.mostrarTelefono ?? false;

      const nombreReal =
        [pref?.nombre, pref?.apellido].filter(Boolean).join(' ').trim() ||
        item.email.split('@')[0];

      const nombreMostrado = mostrarNombre ? nombreReal : 'Vecino de Los Olivos';
      const iniciales = mostrarNombre
        ? nombreReal
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p[0]?.toUpperCase())
            .join('')
        : 'VL';

      const correoMostrado = mostrarCorreo ? item.email : null;
      const telefonoMostrado = mostrarTelefono && pref?.telefono ? pref.telefono : null;

      return {
        id: item.id,
        esPropio,
        esPrivado: false,
        visibleGlobal: true,
        nombreCompleto: nombreMostrado,
        iniciales,
        unidad: mostrarUnidad ? (item.unit?.code ?? 'Sin unidad') : 'No compartida',
        unidadVisible: mostrarUnidad,
        torre: item.unit?.tower ?? 'Sin torre',
        correo: correoMostrado,
        telefono: telefonoMostrado,
        etiquetaContacto:
          !correoMostrado && !telefonoMostrado ? 'Sin datos de contacto compartidos' : null,
      };
    });

    // Orden alfabético A-Z por nombre mostrado
    itemsMapeados.sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, 'es'));

    const pagina = filtros.pagina ?? 1;
    const tamano = filtros.tamano ?? 10;
    const total = itemsMapeados.length;
    const inicio = (pagina - 1) * tamano;
    const items = itemsMapeados.slice(inicio, inicio + tamano);

    const conContactoCount = itemsMapeados.filter(
      (v) => !v.esPrivado && (Boolean(v.correo) || Boolean(v.telefono)),
    ).length;

    return {
      total,
      pagina,
      tamano,
      totalPaginas: Math.max(1, Math.ceil(total / tamano)),
      resumen: {
        perfilesVisibles: itemsMapeados.filter((v) => !v.esPrivado).length,
        conContacto: conContactoCount,
      },
      items,
    };
  }
}