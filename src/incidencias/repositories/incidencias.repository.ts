import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services';
import { Priority } from '@PrismaClient';
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
        unit,
        userId,
        photos: {
          create: photoUrls.map((url) => ({ url })),
        },
        events: {
          create: {
            action: 'CREADO',
            userId,
            metadata: { status: 'Abierto' },
          },
        },
      },
      include: { photos: true, events: true },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.report.findMany({
      where: { userId },
      include: { photos: true, assignee: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneByIdAndUser(id: string, userId: string) {
    return this.prisma.report.findFirst({
      where: { id, userId },
      include: { photos: true, events: true, assignee: true },
    });
  }

  async findById(id: string) {
    return this.prisma.report.findUnique({
      where: { id },
      include: {
        photos: true,
        events: true,
        assignee: true,
        user: true,
      },
    });
  }

  async assign(
    id: string,
    data: {
      priority: Priority;
      assigneeId: string;
      dueDate: Date;
      priorityJustification: string | null;
      updatedById: string;
      newStatus?: string;
    },
  ) {
    return this.prisma.report.update({
      where: { id },
      data: {
        priority: data.priority,
        assigneeId: data.assigneeId,
        dueDate: data.dueDate,
        priorityJustification: data.priorityJustification,
        ...(data.newStatus && { status: data.newStatus }),
        events: {
          create: {
            action: 'ASIGNADO',
            userId: data.updatedById,
            metadata: {
              priority: data.priority,
              assigneeId: data.assigneeId,
              dueDate: data.dueDate.toISOString(),
              ...(data.priorityJustification && {
                priorityJustification: data.priorityJustification,
              }),
            },
          },
        },
      },
      include: { photos: true, assignee: true, events: true },
    });
  }

  async resolve(
    id: string,
    data: {
      resolutionComment: string;
      resolvedById: string;
    },
  ) {
    return this.prisma.report.update({
      where: { id },
      data: {
        status: 'Resuelto',
        resolutionComment: data.resolutionComment,
        resolvedAt: new Date(),
        resolvedById: data.resolvedById,
        events: {
          create: {
            action: 'RESUELTO',
            userId: data.resolvedById,
            metadata: { resolutionComment: data.resolutionComment },
          },
        },
      },
      include: { photos: true, events: true },
    });
  }

  async findAllAdmin(filters: {
    status?: string;
    priority?: Priority;
    unit?: string;
  }) {
    return this.prisma.report.findMany({
      where: {
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.unit && { unit: filters.unit }),
      },
      include: {
        photos: true,
        assignee: true,
        user: true,
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async countOpenByPriority() {
    const groups = await this.prisma.report.groupBy({
      by: ['priority'],
      where: { status: { in: ['Abierto', 'En atención'] } },
      _count: { _all: true },
    });

    const result: Record<string, number> = {
      BAJA: 0,
      MEDIA: 0,
      ALTA: 0,
      CRITICA: 0,
      SIN_PRIORIDAD: 0,
    };

    for (const group of groups) {
      if (group.priority) {
        result[group.priority] = group._count._all;
      } else {
        result.SIN_PRIORIDAD = group._count._all;
      }
    }

    return result;
  }

  async findMaintenanceUsers() {
    return this.prisma.user.findMany({
      where: { role: 'MANTENIMIENTO', isActive: true },
      select: { id: true, email: true, role: true },
      orderBy: { email: 'asc' },
    });
  }

  async findActiveMaintenanceById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, role: 'MANTENIMIENTO', isActive: true },
    });
  }
}