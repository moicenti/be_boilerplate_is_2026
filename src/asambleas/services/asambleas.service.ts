import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { NotificacionesService } from '@Notificaciones';
import {
  AssemblyRepository,
  type AssemblyData,
  type AssemblyWithRelations,
  type TopicData,
} from '@Asambleas/repositories';
import type {
  CreateAssemblyDto,
  ListAssembliesQueryDto,
  VotingTopicDto,
} from '@Asambleas/dto';
import { AssemblyType, Role, type User } from '@PrismaClient';
import { AssemblyStatus, assemblyStatus } from '../domain/assembly-status.js';

const PAGE_SIZE = 20;
const TIME_ZONE = 'America/El_Salvador';
const UTC_OFFSET = '-06:00';
const MODULO_ORIGEN = 'votaciones';

export interface AssemblyPage {
  items: AssemblyWithRelations[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  counts: Record<'TODAS' | AssemblyStatus, number>;
}

@Injectable()
export class AsambleasService {
  private readonly logger = new Logger(AsambleasService.name);

  constructor(
    private readonly assemblyRepository: AssemblyRepository,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  now(): Date {
    return new Date();
  }

  async create(
    dto: CreateAssemblyDto,
    admin: User,
  ): Promise<AssemblyWithRelations> {
    const data = this.toData(dto);
    this.assertValid(this.assemblyErrors(data, this.now()));

    const number = await this.assemblyRepository.nextNumber();
    return this.assemblyRepository.create(data, {
      number,
      folio: this.buildFolio(number, this.now()),
      createdById: admin.id,
    });
  }

  async updateDraft(
    id: string,
    dto: CreateAssemblyDto,
  ): Promise<AssemblyWithRelations> {
    const assembly = await this.findOrFail(id);
    if (assembly.publishedAt) throw this.alreadyPublished();

    const data = this.toData(dto);
    this.assertValid(this.assemblyErrors(data, this.now()));

    const updated = await this.assemblyRepository.replaceDraft(id, data);
    if (!updated) throw this.alreadyPublished();
    return updated;
  }

  async publish(id: string, admin: User): Promise<AssemblyWithRelations> {
    const assembly = await this.findOrFail(id);
    if (assembly.publishedAt) throw this.alreadyPublished();

    const now = this.now();
    this.assertValid(this.assemblyErrors(this.fromEntity(assembly), now));

    const published = await this.assemblyRepository.publishIfDraft(id, now);
    if (!published) throw this.alreadyPublished();

    const result = await this.findOrFail(id);
    await this.notifyCommunity(result, admin);
    return result;
  }

  async findOne(id: string, user: User): Promise<AssemblyWithRelations> {
    const assembly = await this.assemblyRepository.findById(id);
    if (
      !assembly ||
      (!assembly.publishedAt && user.role !== Role.ADMINISTRADOR)
    ) {
      throw new NotFoundException('La asamblea no existe.');
    }
    return assembly;
  }

  async list(query: ListAssembliesQueryDto, user: User): Promise<AssemblyPage> {
    const now = this.now();
    const all = await this.assemblyRepository.findAll({
      search: query.q,
      from: query.desde
        ? new Date(`${query.desde}T00:00:00${UTC_OFFSET}`)
        : undefined,
      to: query.hasta
        ? new Date(`${query.hasta}T23:59:59.999${UTC_OFFSET}`)
        : undefined,
      onlyPublished: user.role !== Role.ADMINISTRADOR,
    });

    const withStatus = all.map((assembly) => ({
      assembly,
      status: assemblyStatus(
        assembly.topics,
        assembly.publishedAt !== null,
        now,
      ),
    }));

    const counts = {
      TODAS: withStatus.length,
      BORRADOR: 0,
      PROGRAMADA: 0,
      ABIERTA: 0,
      CERRADA: 0,
    };
    for (const { status } of withStatus) counts[status] += 1;

    const filtered = query.estado
      ? withStatus.filter(({ status }) => status === query.estado)
      : withStatus;
    const start = (query.page - 1) * PAGE_SIZE;

    return {
      items: filtered
        .slice(start, start + PAGE_SIZE)
        .map(({ assembly }) => assembly),
      page: query.page,
      pageSize: PAGE_SIZE,
      total: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
      counts,
    };
  }

  async updateTopic(
    topicId: string,
    dto: VotingTopicDto,
  ): Promise<AssemblyWithRelations> {
    const topic = await this.assemblyRepository.findTopicById(topicId);
    if (!topic) throw new NotFoundException('La propuesta no existe.');

    const now = this.now();
    if (now >= topic.opensAt) throw this.votingAlreadyOpened();

    const data = this.toTopicData(dto);
    this.assertValid(this.topicErrors(data, now, ''));

    const updated = await this.assemblyRepository.updateTopicIfNotOpened(
      topicId,
      data,
      now,
    );
    if (!updated) throw this.votingAlreadyOpened();
    return this.findOrFail(topic.assemblyId);
  }

  async audience(): Promise<number> {
    return this.assemblyRepository.countActiveResidents();
  }

  buildFolio(number: number, date: Date): string {
    return `ASM-${date.getFullYear()}-${String(number).padStart(3, '0')}`;
  }

  assemblyErrors(data: AssemblyData, now: Date): string[] {
    const errors: string[] = [];
    const minute = this.startOfMinute(now);

    if (data.startsAt < minute) {
      errors.push(
        'La fecha y hora de la reunión deben ser posteriores a la actual.',
      );
    }
    if (data.endsAt <= data.startsAt) {
      errors.push('La hora de fin debe ser posterior a la hora de inicio.');
    }
    data.topics.forEach((topic, index) => {
      const prefix = data.topics.length > 1 ? `Propuesta ${index + 1}: ` : '';
      errors.push(...this.topicErrors(topic, now, prefix));
    });
    return errors;
  }

  topicErrors(topic: TopicData, now: Date, prefix: string): string[] {
    const errors: string[] = [];
    if (topic.opensAt < this.startOfMinute(now)) {
      errors.push(
        `${prefix}La apertura de la votación no puede ser anterior a la fecha y hora actuales.`,
      );
    }
    if (topic.closesAt <= topic.opensAt) {
      errors.push(
        `${prefix}El cierre de la votación debe ser posterior a la apertura.`,
      );
    }
    const normalized = topic.options.map((option) =>
      option.toLocaleLowerCase('es'),
    );
    if (new Set(normalized).size !== normalized.length) {
      errors.push(`${prefix}Las opciones no pueden repetirse.`);
    }
    return errors;
  }

  private async notifyCommunity(
    assembly: AssemblyWithRelations,
    admin: User,
  ): Promise<void> {
    const towers = await this.assemblyRepository.towers();
    const opensAt = Math.min(
      ...assembly.topics.map((t) => t.opensAt.getTime()),
    );
    const kind =
      assembly.type === AssemblyType.EXTRAORDINARIA
        ? 'extraordinaria'
        : 'ordinaria';
    const proposals =
      assembly.topics.length === 1
        ? '1 propuesta a votar'
        : `${assembly.topics.length} propuestas a votar`;
    const mensaje =
      `Asamblea ${kind} el ${this.format(assembly.startsAt)} en ${assembly.location}. ` +
      `${proposals}; la votación abre el ${this.format(new Date(opensAt))}.`;

    for (const tower of towers) {
      try {
        await this.notificacionesService.emitir(
          {
            destinatario: { tipo: 'GRUPO', id: tower },
            tipo: 'CONVOCATORIA_ASAMBLEA',
            titulo: `Convocatoria: ${assembly.title}`,
            mensaje,
            moduloOrigen: MODULO_ORIGEN,
            enlaceAccion: `/asambleas/${assembly.id}`,
          },
          { id: admin.id, rol: admin.role },
        );
      } catch (error) {
        this.logger.warn(
          `No se pudo avisar a ${tower} de la asamblea ${assembly.folio}: ${String(error)}`,
        );
      }
    }
  }

  private toData(dto: CreateAssemblyDto): AssemblyData {
    return {
      title: dto.title,
      type: dto.type,
      modality: dto.modality,
      startsAt: dto.startsAt,
      endsAt: dto.endsAt,
      location: dto.location,
      description: dto.description,
      agenda: dto.agenda.map((item) => ({
        title: item.title,
        description: item.description,
      })),
      topics: dto.topics.map((topic) => this.toTopicData(topic)),
    };
  }

  private toTopicData(dto: VotingTopicDto): TopicData {
    return {
      title: dto.title,
      description: dto.description,
      opensAt: dto.opensAt,
      closesAt: dto.closesAt,
      options: dto.options,
    };
  }

  private fromEntity(assembly: AssemblyWithRelations): AssemblyData {
    return {
      ...assembly,
      agenda: assembly.agendaItems,
      topics: assembly.topics.map((topic) => ({
        ...topic,
        options: topic.options.map((option) => option.text),
      })),
    };
  }

  private assertValid(errors: string[]): void {
    if (errors.length > 0) {
      throw new BadRequestException({
        message: errors,
        error: 'Bad Request',
        statusCode: 400,
      });
    }
  }

  private async findOrFail(id: string): Promise<AssemblyWithRelations> {
    const assembly = await this.assemblyRepository.findById(id);
    if (!assembly) throw new NotFoundException('La asamblea no existe.');
    return assembly;
  }

  private alreadyPublished(): ConflictException {
    return new ConflictException(
      'La convocatoria ya fue publicada. Solo se pueden editar las propuestas cuya votación no ha abierto.',
    );
  }

  private votingAlreadyOpened(): ConflictException {
    return new ConflictException(
      'La votación de esta propuesta ya abrió; no se puede modificar su texto ni sus opciones.',
    );
  }

  private startOfMinute(date: Date): Date {
    return new Date(Math.floor(date.getTime() / 60_000) * 60_000);
  }

  private format(date: Date): string {
    return new Intl.DateTimeFormat('es-SV', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: TIME_ZONE,
    }).format(date);
  }
}
