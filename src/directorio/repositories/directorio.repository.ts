import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services';
import { ActualizarPrivacidadDto } from '../dto/index.js';

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
}