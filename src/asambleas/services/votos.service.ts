import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { VoteRepository } from '@Asambleas/repositories';
import { Role, type User } from '@PrismaClient';
import { AssemblyStatus, topicStatus } from '../domain/assembly-status.js';
import { UnitAlreadyVotedError, VotingNotOpenError } from '../errors/index.js';

const TIME_ZONE = 'America/El_Salvador';

@Injectable()
export class VotosService {
  constructor(private readonly voteRepository: VoteRepository) {}

  now(): Date {
    return new Date();
  }

  async vote(
    topicId: string,
    optionId: string,
    user: User,
  ): Promise<{ topicId: string; votedAt: Date }> {
    if (user.role !== Role.RESIDENTE || !user.unitId) {
      throw new ForbiddenException(
        'Solo los residentes con una unidad asociada pueden votar.',
      );
    }

    const topic = await this.voteRepository.findTopicForVote(topicId);
    if (!topic || !topic.assembly.publishedAt) {
      throw new NotFoundException('La propuesta no existe.');
    }

    const now = this.now();
    const status = topicStatus(topic, true, now);
    if (status === AssemblyStatus.PROGRAMADA) {
      throw this.notOpen(`abre el ${this.format(topic.opensAt)}`);
    }
    if (status === AssemblyStatus.CERRADA) {
      throw this.notOpen(`cerró el ${this.format(topic.closesAt)}`);
    }

    if (!topic.options.some((option) => option.id === optionId)) {
      throw new BadRequestException('La opción no pertenece a esta propuesta.');
    }

    try {
      const votedAt = await this.voteRepository.castVote({
        topicId,
        optionId,
        unitId: user.unitId,
        residentId: user.id,
        now,
      });
      return { topicId, votedAt };
    } catch (error) {
      if (error instanceof UnitAlreadyVotedError) {
        throw new ConflictException('Tu unidad ya votó en este tema.');
      }
      if (error instanceof VotingNotOpenError) {
        throw this.notOpen(`cerró el ${this.format(topic.closesAt)}`);
      }
      throw error;
    }
  }

  async unitVotesFor(
    user: User,
    topicIds: string[],
  ): Promise<Map<string, Date> | null> {
    if (user.role !== Role.RESIDENTE || !user.unitId) return null;
    return this.voteRepository.unitVotes(user.unitId, topicIds);
  }

  private notOpen(detail: string): UnprocessableEntityException {
    return new UnprocessableEntityException(
      `La votación no está abierta: ${detail}.`,
    );
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
