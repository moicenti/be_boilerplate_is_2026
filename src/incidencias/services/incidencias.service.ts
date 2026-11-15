import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Priority, Role } from '@PrismaClient';
import { IncidenciaRepository } from '../repositories/index.js';
import {
  AsignarIncidenciaDto,
  CreateIncidenciaDto,
  FilterIncidenciaDto,
  ResolverIncidenciaDto,
} from '../dto/index.js';
import type { Unit } from '@PrismaClient';

const UNIT_REGEX = /^[A-Z]+-(?:[1-9]\d*)$/;
const ASSIGNABLE_STATUSES = ['Abierto', 'En atención'];
const RESOLVABLE_STATUSES = ['En atención'];

@Injectable()
export class IncidenciasService {
  constructor(private readonly incidenciaRepository: IncidenciaRepository) {}

  async create(
    user: { id: string; unit?: Unit | null },
    data: CreateIncidenciaDto,
    photoUrls: string[],
  ) {
    if (!user.unit) {
      throw new BadRequestException(
        'Tu usuario no tiene una unidad asignada. Contacta a la administración.',
      );
    }
    if (!UNIT_REGEX.test(user.unit.code)) {
      throw new BadRequestException(
        `La unidad "${user.unit.code}" no tiene un formato válido (esperado: A-12).`,
      );
    }

    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const folio = `INC-${year}-${randomNum}`;

    return this.incidenciaRepository.create(
      user.id,
      user.unit.code,
      folio,
      data,
      photoUrls,
    );
  }

  async findAll(userId: string) {
    return this.incidenciaRepository.findAllByUser(userId);
  }

  async findOne(id: string, userId: string) {
    const report = await this.incidenciaRepository.findOneByIdAndUser(id, userId);
    if (!report) {
      throw new NotFoundException(
        'Reporte no encontrado o no tienes permiso para verlo',
      );
    }
    return report;
  }

  async assignReport(
    reportId: string,
    dto: AsignarIncidenciaDto,
    adminUser: { id: string; role: Role },
  ) {
    if (adminUser.role !== Role.ADMINISTRADOR) {
      throw new ForbiddenException('Solo un administrador puede asignar reportes');
    }

    const report = await this.incidenciaRepository.findById(reportId);
    if (!report) {
      throw new NotFoundException('Reporte no encontrado');
    }

    if (!ASSIGNABLE_STATUSES.includes(report.status)) {
      throw new BadRequestException(
        `No se puede asignar un reporte en estado "${report.status}".`,
      );
    }

    if (dto.priority === Priority.CRITICA) {
      const justification = dto.priorityJustification?.trim() ?? '';
      if (justification.length < 10 || justification.length > 200) {
        throw new BadRequestException(
          'La justificación es obligatoria para prioridad Crítica (10-200 caracteres).',
        );
      }
    }

    const assignee = await this.incidenciaRepository.findActiveMaintenanceById(
      dto.assigneeId,
    );
    if (!assignee) {
      throw new BadRequestException(
        'El responsable debe ser un usuario de mantenimiento activo.',
      );
    }

    const newStatus = report.status === 'Abierto' ? 'En atención' : report.status;

    return this.incidenciaRepository.assign(reportId, {
      priority: dto.priority,
      assigneeId: dto.assigneeId,
      dueDate: new Date(dto.dueDate),
      priorityJustification:
        dto.priority === Priority.CRITICA
          ? dto.priorityJustification!.trim()
          : null,
      updatedById: adminUser.id,
      newStatus,
    });
  }

  async resolveReport(
    reportId: string,
    dto: ResolverIncidenciaDto,
    user: { id: string; role: Role },
  ) {
    if (user.role !== Role.ADMINISTRADOR && user.role !== Role.MANTENIMIENTO) {
      throw new ForbiddenException(
        'Solo administración o mantenimiento pueden resolver reportes',
      );
    }

    const report = await this.incidenciaRepository.findById(reportId);
    if (!report) {
      throw new NotFoundException('Reporte no encontrado');
    }

    if (!RESOLVABLE_STATUSES.includes(report.status)) {
      throw new BadRequestException(
        `Solo se pueden resolver reportes en estado "En atención". Estado actual: "${report.status}".`,
      );
    }

    const comment = dto.resolutionComment?.trim() ?? '';
    if (comment.length < 10 || comment.length > 200) {
      throw new BadRequestException(
        'El comentario de resolución es obligatorio (10-200 caracteres).',
      );
    }

    return this.incidenciaRepository.resolve(reportId, {
      resolutionComment: comment,
      resolvedById: user.id,
    });
  }

  async findAllForAdmin(filters: FilterIncidenciaDto) {
    const [reports, counts] = await Promise.all([
      this.incidenciaRepository.findAllAdmin(filters),
      this.incidenciaRepository.countOpenByPriority(),
    ]);
    return { reports, counts };
  }

  async findMaintenanceUsers() {
    return this.incidenciaRepository.findMaintenanceUsers();
  }
}