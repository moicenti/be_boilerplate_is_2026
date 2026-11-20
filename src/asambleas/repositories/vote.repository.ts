import { Injectable } from '@nestjs/common';
import { PrismaService } from '@Prisma/services';
import { Prisma } from '@PrismaClient';
import { UnitAlreadyVotedError, VotingNotOpenError } from '../errors/index.js';

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

export type TopicForVote = Prisma.VotingTopicGetPayload<{
  include: { assembly: true; options: true };
}>;

export interface CastVoteData {
  topicId: string;
  optionId: string;
  unitId: string;
  residentId: string;
  now: Date;
}

@Injectable()
export class VoteRepository {
  constructor(private readonly prisma: PrismaService) {}

  findTopicForVote(topicId: string): Promise<TopicForVote | null> {
    return this.prisma.votingTopic.findUnique({
      where: { id: topicId },
      include: { assembly: true, options: true },
    });
  }

  async castVote(data: CastVoteData): Promise<Date> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const open = await tx.votingTopic.count({
          where: {
            id: data.topicId,
            opensAt: { lte: data.now },
            closesAt: { gt: data.now },
          },
        });
        if (open === 0) throw new VotingNotOpenError();

        const participation = await tx.participacionVotacion.create({
          data: {
            temaId: data.topicId,
            unidadId: data.unitId,
            residenteId: data.residentId,
            fecha: data.now,
          },
        });
        await tx.vote.create({
          data: { topicId: data.topicId, optionId: data.optionId },
        });
        return participation.fecha;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_CONSTRAINT_VIOLATION
      ) {
        throw new UnitAlreadyVotedError();
      }
      throw error;
    }
  }

  async unitVotes(
    unitId: string,
    topicIds: string[],
  ): Promise<Map<string, Date>> {
    if (topicIds.length === 0) return new Map();
    const rows = await this.prisma.participacionVotacion.findMany({
      where: { unidadId: unitId, temaId: { in: topicIds } },
      select: { temaId: true, fecha: true },
    });
    return new Map(rows.map((row) => [row.temaId, row.fecha]));
  }
}
