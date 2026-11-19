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

  async guardarPrivacidad(userId: string, dto: ActualizarPrivacidadDto) {
    return this.prisma.perfilDirectorio.upsert({
      where: { userId },
      update: {
        ...(dto.nombre !== undefined ? { nombre: dto.nombre.trim() || null } : {}),
        ...(dto.apellido !== undefined ? { apellido: dto.apellido.trim() || null } : {}),
        ...(dto.telefono !== undefined ? { telefono: dto.telefono.trim() || null } : {}),
        ...(dto.visibleEnDirectorio !== undefined
          ? { visibleEnDirectorio: dto.visibleEnDirectorio }
          : {}),
        ...(dto.mostrarTelefono !== undefined ? { mostrarTelefono: dto.mostrarTelefono } : {}),
        ...(dto.mostrarCorreo !== undefined ? { mostrarCorreo: dto.mostrarCorreo } : {}),
      },
      create: {
        userId,
        nombre: dto.nombre?.trim() || null,
        apellido: dto.apellido?.trim() || null,
        telefono: dto.telefono?.trim() || null,
        visibleEnDirectorio: dto.visibleEnDirectorio ?? true,
        mostrarTelefono: dto.mostrarTelefono ?? false,
        mostrarCorreo: dto.mostrarCorreo ?? false,
      },
    });
  }
}