import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ResultsRepository,
  type ParticipationRow,
  type TopicWithResultsContext,
} from '@Asambleas/repositories';
import { AssemblyType } from '@PrismaClient';
import { AssemblyStatus, topicStatus } from '../domain/assembly-status.js';
import { tally, type TopicTally } from '../domain/results.js';

const TIME_ZONE = 'America/El_Salvador';
const SYSTEM = 'Sistema Habita';

export interface TopicResults {
  topicId: string;
  title: string;
  status: AssemblyStatus;
  opensAt: Date;
  closesAt: Date;
  unitsVoted: number;
  eligibleUnits: number | null;
  results: TopicTally | null;
}

export interface AuditEvent {
  at: Date;
  event: string;
  responsible: string;
  detail: string;
}

export interface TopicAudit {
  assembly: {
    id: string;
    folio: string;
    title: string;
    type: AssemblyType;
    startsAt: Date;
    endsAt: Date;
    location: string;
  };
  topic: {
    id: string;
    title: string;
    description: string;
    opensAt: Date;
    closesAt: Date;
    position: number;
  };
  results: TopicTally;
  participations: ParticipationRow[];
  events: AuditEvent[];
}

@Injectable()
export class ResultadosService {
  constructor(private readonly resultsRepository: ResultsRepository) {}

  now(): Date {
    return new Date();
  }

  async results(topicId: string): Promise<TopicResults> {
    const topic = await this.findPublished(topicId);
    const status = topicStatus(topic, true, this.now());
    const unitsVoted =
      await this.resultsRepository.countParticipations(topicId);
    const base = {
      topicId: topic.id,
      title: topic.title,
      status,
      opensAt: topic.opensAt,
      closesAt: topic.closesAt,
      unitsVoted,
    };

    if (status === AssemblyStatus.PROGRAMADA) {
      return { ...base, eligibleUnits: null, results: null };
    }
    const eligibleUnits = await this.resultsRepository.countUnitsRegisteredBy(
      topic.opensAt,
    );
    if (status === AssemblyStatus.ABIERTA) {
      return { ...base, eligibleUnits, results: null };
    }

    const votes = await this.resultsRepository.votesByOption(topicId);
    return {
      ...base,
      eligibleUnits,
      results: tally(topic.options, votes, unitsVoted, eligibleUnits),
    };
  }

  async audit(topicId: string): Promise<TopicAudit> {
    const topic = await this.findPublished(topicId);
    const status = topicStatus(topic, true, this.now());
    if (status !== AssemblyStatus.CERRADA) {
      throw new ConflictException(
        status === AssemblyStatus.ABIERTA
          ? 'La votación sigue abierta; la auditoría estará disponible al cierre.'
          : 'La votación aún no abre; la auditoría estará disponible al cierre.',
      );
    }

    const [votes, participations, eligibleUnits] = await Promise.all([
      this.resultsRepository.votesByOption(topicId),
      this.resultsRepository.participations(topicId),
      this.resultsRepository.countUnitsRegisteredBy(topic.opensAt),
    ]);
    const results = tally(
      topic.options,
      votes,
      participations.length,
      eligibleUnits,
    );

    return {
      assembly: {
        id: topic.assembly.id,
        folio: topic.assembly.folio,
        title: topic.assembly.title,
        type: topic.assembly.type,
        startsAt: topic.assembly.startsAt,
        endsAt: topic.assembly.endsAt,
        location: topic.assembly.location,
      },
      topic: {
        id: topic.id,
        title: topic.title,
        description: topic.description,
        opensAt: topic.opensAt,
        closesAt: topic.closesAt,
        position: topic.position,
      },
      results,
      participations,
      events: this.events(topic, results),
    };
  }

  format(date: Date): string {
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

  private events(
    topic: TopicWithResultsContext,
    results: TopicTally,
  ): AuditEvent[] {
    const summary = results.options
      .map((o) => `${o.votes} ${o.text.toLocaleLowerCase('es')}`)
      .join(', ');
    return [
      {
        at: topic.assembly.publishedAt!,
        event: 'Convocatoria publicada',
        responsible: topic.assembly.createdBy.email,
        detail: 'Convocatoria disponible para consulta de los residentes.',
      },
      {
        at: topic.opensAt,
        event: 'Votación abierta',
        responsible: SYSTEM,
        detail: `Apertura programada. Padrón fijado: ${results.eligibleUnits} unidades habilitadas.`,
      },
      {
        at: topic.closesAt,
        event: 'Votación cerrada',
        responsible: SYSTEM,
        detail: 'Plazo finalizado. Se bloquearon nuevas respuestas.',
      },
      {
        at: topic.closesAt,
        event: 'Recuento consolidado',
        responsible: SYSTEM,
        detail: `${results.totalVotes} votos: ${summary}.`,
      },
    ];
  }

  private async findPublished(
    topicId: string,
  ): Promise<TopicWithResultsContext> {
    const topic = await this.resultsRepository.findTopic(topicId);
    if (!topic || !topic.assembly.publishedAt) {
      throw new NotFoundException('La propuesta no existe.');
    }
    return topic;
  }
}
