export interface OptionTally {
  optionId: string;
  text: string;
  votes: number;
  percentage: number;
}

export interface TopicTally {
  options: OptionTally[];
  totalVotes: number;
  unitsVoted: number;
  eligibleUnits: number;
  participation: number;
  outcome: 'GANADOR' | 'EMPATE' | 'SIN_VOTOS';
  winner: { optionId: string; text: string } | null;
  tiedOptions: string[];
  consistent: boolean;
}

export function percent(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 10_000) / 100;
}

export function tally(
  options: { id: string; text: string }[],
  votesByOption: Map<string, number>,
  unitsVoted: number,
  eligibleUnits: number,
): TopicTally {
  const totalVotes = options.reduce(
    (sum, option) => sum + (votesByOption.get(option.id) ?? 0),
    0,
  );
  const rows = options.map((option) => {
    const votes = votesByOption.get(option.id) ?? 0;
    return {
      optionId: option.id,
      text: option.text,
      votes,
      percentage: percent(votes, totalVotes),
    };
  });

  const max = Math.max(0, ...rows.map((row) => row.votes));
  const leaders = rows.filter((row) => row.votes === max && max > 0);
  const outcome =
    totalVotes === 0 ? 'SIN_VOTOS' : leaders.length > 1 ? 'EMPATE' : 'GANADOR';

  return {
    options: rows,
    totalVotes,
    unitsVoted,
    eligibleUnits,
    participation: percent(unitsVoted, eligibleUnits),
    outcome,
    winner:
      outcome === 'GANADOR'
        ? { optionId: leaders[0].optionId, text: leaders[0].text }
        : null,
    tiedOptions: outcome === 'EMPATE' ? leaders.map((row) => row.text) : [],
    consistent: totalVotes === unitsVoted,
  };
}
