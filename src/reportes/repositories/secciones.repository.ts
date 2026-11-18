import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services';

@Injectable()
export class SeccionesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * PENDIENTE DE DEFINIR CON EL EQUIPO (nota del diseño de H26): el filtro dice "sección",
   * pero el modelo separa torre y sección. Hoy Unit solo tiene `tower`, así que se valida
   * contra las torres existentes. Si se decide otra cosa, solo cambia este método.
   */
  async existe(seccion: string): Promise<boolean> {
    const unidad = await this.prisma.unit.findFirst({
      where: { tower: seccion },
      select: { id: true },
    });
    return unidad !== null;
  }
}
