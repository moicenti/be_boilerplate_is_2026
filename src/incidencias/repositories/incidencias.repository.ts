import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services'; // Ajusta según tu estructura
import { CreateIncidenciaDto } from '../dto/index.js';

@Injectable()
export class IncidenciaRepository {
  constructor(private readonly prisma: PrismaService) {}

 async create(
  userId: string,
  unit: string,   
  folio: string,
  data: CreateIncidenciaDto,
  photoUrls: string[],
) {
  return this.prisma.report.create({
    data: {
      folio,
      title: data.title,
      description: data.description,
      category: data.category,
      location: data.location,
      status: 'Abierto',
      unit,          // ← NUEVO
      userId,
      photos: { create: photoUrls.map((url) => ({ url })) },
    },
    include: {
      photos: true,
    },
  });
}

    async findAllByUser(userId: string) {
    return this.prisma.report.findMany({
      where: { userId },
      include: { photos: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneByIdAndUser(id: string, userId: string) {
    return this.prisma.report.findFirst({
      where: { id, userId },
      include: { photos: true },
    });
  }
}