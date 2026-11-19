import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services';
import { ActualizarPrivacidadDto, BuscarDirectorioDto } from '../dto/index.js';

@Injectable()
export class DirectorioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerPerfilUsuario(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        unit: {
          select: {
            id: true,
            code: true,
            tower: true,
            description: true,
          },
        },
        perfilDirectorio: true,
      },
    });
  }

  async guardarPreferencias(userId: string, dto: ActualizarPrivacidadDto) {
    return this.prisma.perfilDirectorio.upsert({
      where: { userId },
      update: {
        visibleGlobal: dto.visibleGlobal,
        mostrarTelefono: dto.mostrarTelefono,
        mostrarCorreo: dto.mostrarCorreo,
        ...(dto.mostrarNombre !== undefined ? { mostrarNombre: dto.mostrarNombre } : {}),
        ...(dto.mostrarUnidad !== undefined ? { mostrarUnidad: dto.mostrarUnidad } : {}),
      },
      create: {
        userId,
        visibleGlobal: dto.visibleGlobal,
        mostrarTelefono: dto.mostrarTelefono,
        mostrarCorreo: dto.mostrarCorreo,
        mostrarNombre: dto.mostrarNombre ?? false,
        mostrarUnidad: dto.mostrarUnidad ?? false,
      },
    });
  }

  async buscarResidentesDirectorio(userIdActual: string, filtros: BuscarDirectorioDto) {
    const termino = filtros.q?.trim();
    const torreFiltro = filtros.torre?.trim();
    const filtroTab = filtros.filtro ?? 'TODOS';

    return this.prisma.user.findMany({
      where: {
        isActive: true,
        role: 'RESIDENTE',
        unitId: { not: null },
        ...(filtroTab === 'MI_PERFIL' ? { id: userIdActual } : {}),
        ...(torreFiltro
          ? {
              unit: {
                tower: { equals: torreFiltro, mode: 'insensitive' },
              },
            }
          : {}),
        ...(filtroTab === 'CON_CONTACTO'
          ? {
              perfilDirectorio: {
                visibleGlobal: true,
                OR: [{ mostrarCorreo: true }, { mostrarTelefono: true }],
              },
            }
          : {}),
        ...(termino
          ? {
              OR: [
                // Si el perfil es visible globalmente, permite buscar por unidad, nombre o apellido
                {
                  perfilDirectorio: { visibleGlobal: true },
                  OR: [
                    { unit: { code: { contains: termino, mode: 'insensitive' } } },
                    { perfilDirectorio: { apellido: { contains: termino, mode: 'insensitive' } } },
                    { perfilDirectorio: { nombre: { contains: termino, mode: 'insensitive' } } },
                  ],
                },
                // Criterio 2 de H22: Si visibleGlobal es false, SOLO coincide si buscan su departamento/unidad
                {
                  OR: [
                    { perfilDirectorio: null },
                    { perfilDirectorio: { visibleGlobal: false } },
                  ],
                  unit: {
                    code: { contains: termino, mode: 'insensitive' },
                  },
                },
              ],
            }
          : filtroTab === 'MI_PERFIL'
            ? {}
            : {
                // En listado general sin término de búsqueda, mostrar solo perfiles con visibilidad activa
                perfilDirectorio: {
                  visibleGlobal: true,
                },
              }),
      },
      select: {
        id: true,
        email: true,
        unit: {
          select: {
            code: true,
            tower: true,
            description: true,
          },
        },
        perfilDirectorio: {
          select: {
            nombre: true,
            apellido: true,
            telefono: true,
            visibleGlobal: true,
            mostrarTelefono: true,
            mostrarCorreo: true,
            mostrarNombre: true,
            mostrarUnidad: true,
          },
        },
      },
      orderBy: [
        { perfilDirectorio: { nombre: 'asc' } },
        { unit: { code: 'asc' } },
      ],
    });
  }
}