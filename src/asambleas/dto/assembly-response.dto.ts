import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssemblyModality, AssemblyType } from '@PrismaClient';
import type { AssemblyWithRelations } from '@Asambleas/repositories';
import {
  AssemblyStatus,
  assemblyStatus,
  topicStatus,
} from '../domain/assembly-status.js';

const STATUS_VALUES = Object.values(AssemblyStatus);

class VotingOptionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'A favor' })
  text!: string;

  @ApiProperty({ example: 0 })
  position!: number;
}

class VotingTopicResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  opensAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  closesAt!: Date;

  @ApiProperty({ example: 0 })
  position!: number;

  @ApiProperty({ enum: STATUS_VALUES })
  status!: AssemblyStatus;

  @ApiProperty({ type: [VotingOptionResponseDto] })
  options!: VotingOptionResponseDto[];

  @ApiPropertyOptional({
    nullable: true,
    example: { votedAt: '2026-11-05T02:10:00.000Z' },
    description:
      'Solo para residentes con unidad: cuándo votó su unidad. Nunca incluye la opción elegida.',
  })
  unitVote!: { votedAt: Date } | null;
}

export type UnitVotes = Map<string, Date>;

class AgendaItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description!: string | null;

  @ApiProperty({ example: 0 })
  position!: number;
}

export class AssemblySummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'ASM-2026-011' })
  folio!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ enum: AssemblyType })
  type!: AssemblyType;

  @ApiProperty({ enum: AssemblyModality })
  modality!: AssemblyModality;

  @ApiProperty({ type: String, format: 'date-time' })
  startsAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  endsAt!: Date;

  @ApiProperty()
  location!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  publishedAt!: Date | null;

  @ApiProperty({ enum: STATUS_VALUES })
  status!: AssemblyStatus;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  votingOpensAt!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  votingClosesAt!: Date | null;

  @ApiProperty({ example: 1 })
  topicCount!: number;

  @ApiProperty({ example: 3 })
  agendaCount!: number;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    example: 1,
    description:
      'Solo para residentes con unidad: votaciones abiertas en las que su unidad aún no votó.',
  })
  pendingVotesForUnit!: number | null;

  static fromEntity(
    assembly: AssemblyWithRelations,
    now: Date,
    unitVotes: UnitVotes | null = null,
  ): AssemblySummaryDto {
    return summaryFields(assembly, now, unitVotes);
  }
}

function summaryFields(
  assembly: AssemblyWithRelations,
  now: Date,
  unitVotes: UnitVotes | null,
): Pick<AssemblySummaryDto, keyof AssemblySummaryDto> {
  const opens = assembly.topics.map((t) => t.opensAt.getTime());
  const closes = assembly.topics.map((t) => t.closesAt.getTime());
  const published = assembly.publishedAt !== null;
  return {
    pendingVotesForUnit: unitVotes
      ? assembly.topics.filter(
          (t) =>
            topicStatus(t, published, now) === AssemblyStatus.ABIERTA &&
            !unitVotes.has(t.id),
        ).length
      : null,
    id: assembly.id,
    folio: assembly.folio,
    title: assembly.title,
    type: assembly.type,
    modality: assembly.modality,
    startsAt: assembly.startsAt,
    endsAt: assembly.endsAt,
    location: assembly.location,
    publishedAt: assembly.publishedAt,
    status: assemblyStatus(assembly.topics, assembly.publishedAt !== null, now),
    votingOpensAt: opens.length ? new Date(Math.min(...opens)) : null,
    votingClosesAt: closes.length ? new Date(Math.max(...closes)) : null,
    topicCount: assembly.topics.length,
    agendaCount: assembly.agendaItems.length,
  };
}

export class AssemblyResponseDto extends AssemblySummaryDto {
  @ApiProperty()
  description!: string;

  @ApiProperty({ example: { id: 'uuid', email: 'admin@example.com' } })
  createdBy!: { id: string; email: string };

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: [AgendaItemResponseDto] })
  agenda!: AgendaItemResponseDto[];

  @ApiProperty({ type: [VotingTopicResponseDto] })
  topics!: VotingTopicResponseDto[];

  static fromEntity(
    assembly: AssemblyWithRelations,
    now: Date,
    unitVotes: UnitVotes | null = null,
  ): AssemblyResponseDto {
    const published = assembly.publishedAt !== null;
    return {
      ...summaryFields(assembly, now, unitVotes),
      description: assembly.description,
      createdBy: { id: assembly.createdBy.id, email: assembly.createdBy.email },
      createdAt: assembly.createdAt,
      agenda: assembly.agendaItems.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        position: item.position,
      })),
      topics: assembly.topics.map((topic) => ({
        id: topic.id,
        title: topic.title,
        description: topic.description,
        opensAt: topic.opensAt,
        closesAt: topic.closesAt,
        position: topic.position,
        status: topicStatus(topic, published, now),
        options: topic.options.map((option) => ({
          id: option.id,
          text: option.text,
          position: option.position,
        })),
        unitVote: unitVotes?.has(topic.id)
          ? { votedAt: unitVotes.get(topic.id)! }
          : null,
      })),
    };
  }
}

export class AssemblyStatusCountsDto {
  @ApiProperty({ example: 5 })
  TODAS!: number;

  @ApiProperty({ example: 1 })
  BORRADOR!: number;

  @ApiProperty({ example: 1 })
  PROGRAMADA!: number;

  @ApiProperty({ example: 0 })
  ABIERTA!: number;

  @ApiProperty({ example: 3 })
  CERRADA!: number;
}

export class AssemblyPageResponseDto {
  @ApiProperty({ type: [AssemblySummaryDto] })
  items!: AssemblySummaryDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;

  @ApiProperty({ example: 5 })
  total!: number;

  @ApiProperty({ example: 1 })
  totalPages!: number;

  @ApiProperty({
    type: AssemblyStatusCountsDto,
    description: 'Cantidad por estado con la búsqueda y el periodo aplicados.',
  })
  counts!: AssemblyStatusCountsDto;
}

export class AudienceResponseDto {
  @ApiProperty({ example: 47, description: 'Residentes activos con unidad.' })
  residents!: number;
}
