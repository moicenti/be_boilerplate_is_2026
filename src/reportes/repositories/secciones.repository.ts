import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services';

export interface Seccion {
  id: number;
  nombre: string;
  torre: string;
}

@Injectable()
export class SeccionesRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ✅ MÉTODO listar EXPLÍCITO Y PÚBLICO
  async listar(): Promise<Seccion[]> {
    const unidades = await this.prisma.unit.findMany({
      select: { id: true, code: true, tower: true },
    });

    const porTorre = new Map<string, { torre: string; unidades: string[] }>();
    for (const u of unidades) {
      const grupo = porTorre.get(u.tower) ?? { torre: u.tower, unidades: [] };
      grupo.unidades.push(u.code);
      porTorre.set(u.tower, grupo);
    }

    return [...porTorre.entries()].map(([torre, g], i) => ({
      id: i + 1,
      nombre: `Torre ${torre}`,
      torre,
    }));
  }
}
