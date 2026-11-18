import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services';
import {
  Prisma,
  Role,
  type AssemblyModality,
  type AssemblyType,
} from '@PrismaClient';

const assemblyInclude = {
  createdBy: true,
  agendaItems: { orderBy: { position: 'asc' } },
  topics: {
    orderBy: { position: 'asc' },
    include: { options: { orderBy: { position: 'asc' } } },
  },
} satisfies Prisma.AssemblyInclude;

export type AssemblyWithRelations = Prisma.AssemblyGetPayload<{
  include: typeof assemblyInclude;
}>;

export type TopicWithAssembly = Prisma.VotingTopicGetPayload<{
  include: { assembly: true };
}>;

export interface TopicData {
  title: string;
  description: string;
  opensAt: Date;
  closesAt: Date;
  options: string[];
}

export interface AssemblyData {
  title: string;
  type: AssemblyType;
  modality: AssemblyModality;
  startsAt: Date;
  endsAt: Date;
  location: string;
  description: string;
  agenda: { title: string; description?: string | null }[];
  topics: TopicData[];
}

export interface AssemblyFilters {
  search?: string;
  from?: Date;
  to?: Date;
  onlyPublished: boolean;
}

function fields(data: AssemblyData) {
  return {
    title: data.title,
    type: data.type,
    modality: data.modality,
    startsAt: data.startsAt,
    endsAt: data.endsAt,
    location: data.location,
    description: data.description,
  };
}

function agendaCreate(data: AssemblyData) {
  return data.agenda.map((item, position) => ({
    title: item.title,
    description: item.description || null,
    position,
  }));
}

function topicCreate(topic: TopicData, position: number) {
  return {
    title: topic.title,
    description: topic.description,
    opensAt: topic.opensAt,
    closesAt: topic.closesAt,
    position,
    options: {
      create: topic.options.map((text, index) => ({ text, position: index })),
    },
  };
}

@Injectable()
export class AssemblyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async nextNumber(): Promise<number> {
    const [row] = await this.prisma.$queryRaw<{ value: bigint }[]>`
      SELECT nextval(pg_get_serial_sequence('asambleas', 'number')) AS value
    `;
    return Number(row.value);
  }

  create(
    data: AssemblyData,
    meta: { number: number; folio: string; createdById: string },
  ): Promise<AssemblyWithRelations> {
    return this.prisma.assembly.create({
      data: {
        ...fields(data),
        ...meta,
        agendaItems: { create: agendaCreate(data) },
        topics: { create: data.topics.map(topicCreate) },
      },
      include: assemblyInclude,
    });
  }

  replaceDraft(
    id: string,
    data: AssemblyData,
  ): Promise<AssemblyWithRelations | null> {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.assembly.updateMany({
        where: { id, publishedAt: null },
        data: fields(data),
      });
      if (count === 0) return null;

      await tx.agendaItem.deleteMany({ where: { assemblyId: id } });
      await tx.votingTopic.deleteMany({ where: { assemblyId: id } });
      await tx.agendaItem.createMany({
        data: agendaCreate(data).map((item) => ({ ...item, assemblyId: id })),
      });
      for (const [position, topic] of data.topics.entries()) {
        await tx.votingTopic.create({
          data: { ...topicCreate(topic, position), assemblyId: id },
        });
      }

      return tx.assembly.findUniqueOrThrow({
        where: { id },
        include: assemblyInclude,
      });
    });
  }

  findById(id: string): Promise<AssemblyWithRelations | null> {
    return this.prisma.assembly.findUnique({
      where: { id },
      include: assemblyInclude,
    });
  }

  findAll(filters: AssemblyFilters): Promise<AssemblyWithRelations[]> {
    const where: Prisma.AssemblyWhereInput = {};
    if (filters.onlyPublished) where.publishedAt = { not: null };
    if (filters.from || filters.to) {
      where.startsAt = {
        ...(filters.from ? { gte: filters.from } : {}),
        ...(filters.to ? { lte: filters.to } : {}),
      };
    }
    if (filters.search) {
      const insensitive = Prisma.QueryMode.insensitive;
      where.OR = [
        { title: { contains: filters.search, mode: insensitive } },
        { folio: { contains: filters.search, mode: insensitive } },
      ];
    }

    return this.prisma.assembly.findMany({
      where,
      include: assemblyInclude,
      orderBy: [{ startsAt: 'desc' }, { number: 'desc' }],
    });
  }

  async publishIfDraft(id: string, publishedAt: Date): Promise<boolean> {
    const { count } = await this.prisma.assembly.updateMany({
      where: { id, publishedAt: null },
      data: { publishedAt },
    });
    return count === 1;
  }

  findTopicById(topicId: string): Promise<TopicWithAssembly | null> {
    return this.prisma.votingTopic.findUnique({
      where: { id: topicId },
      include: { assembly: true },
    });
  }

  updateTopicIfNotOpened(
    topicId: string,
    data: TopicData,
    now: Date,
  ): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.votingTopic.updateMany({
        where: { id: topicId, opensAt: { gt: now } },
        data: {
          title: data.title,
          description: data.description,
          opensAt: data.opensAt,
          closesAt: data.closesAt,
        },
      });
      if (count === 0) return false;

      await tx.votingOption.deleteMany({ where: { topicId } });
      await tx.votingOption.createMany({
        data: data.options.map((text, position) => ({
          topicId,
          text,
          position,
        })),
      });
      return true;
    });
  }

  countActiveResidents(): Promise<number> {
    return this.prisma.user.count({
      where: { role: Role.RESIDENTE, isActive: true, unitId: { not: null } },
    });
  }

  async towers(): Promise<string[]> {
    const rows = await this.prisma.unit.findMany({
      distinct: ['tower'],
      select: { tower: true },
      orderBy: { tower: 'asc' },
    });
    return rows.map((row) => row.tower);
  }
}
