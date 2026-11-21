export class UnitAlreadyVotedError extends Error {
  constructor() {
    super('La unidad ya votó en este tema.');
    this.name = 'UnitAlreadyVotedError';
  }
}

export class VotingNotOpenError extends Error {
  constructor() {
    super('La votación no está abierta.');
    this.name = 'VotingNotOpenError';
  }
}
