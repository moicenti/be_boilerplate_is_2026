import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services';
import { Prisma } from '@PrismaClient';

const topicInclude = {
  assembly: { include: { createdBy: true } },
  options: { orderBy: { position: 'asc' } },
} satisfies Prisma.VotingTopicInclude;

export type TopicWithResultsContext = Prisma.VotingTopicGetPayload<{
  include: typeof topicInclude;
}>;

export interface ParticipationRow {
  unitCode: string;
  unitDescription: string;
  votedAt: Date;
}

@Injectable()
export class ResultsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findTopic(topicId: string): Promise<TopicWithResultsContext | null> {
    return this.prisma.votingTopic.findUnique({
      where: { id: topicId },
      include: topicInclude,
    });
  }

  async votesByOption(topicId: string): Promise<Map<string, number>> {
    const rows = await this.prisma.vote.groupBy({
      by: ['optionId'],
      where: { topicId },
      _count: { _all: true },
    });
    return new Map(rows.map((row) => [row.optionId, row._count._all]));
  }

  countParticipations(topicId: string): Promise<number> {
    return this.prisma.participacionVotacion.count({
      where: { temaId: topicId },
    });
  }

  countUnitsRegisteredBy(date: Date): Promise<number> {
    return this.prisma.unit.count({ where: { createdAt: { lte: date } } });
  }

  async participations(topicId: string): Promise<ParticipationRow[]> {
    const rows = await this.prisma.participacionVotacion.findMany({
      where: { temaId: topicId },
      orderBy: { fecha: 'asc' },
      select: {
        fecha: true,
        unit: { select: { code: true, description: true } },
      },
    });
    return rows.map((row) => ({
      unitCode: row.unit.code,
      unitDescription: row.unit.description,
      votedAt: row.fecha,
    }));
  }
}
