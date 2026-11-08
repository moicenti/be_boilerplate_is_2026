export class BlockOverlapError extends Error {
  constructor() {
    super('El bloqueo se superpone con otro bloqueo de la misma área.');
    this.name = 'BlockOverlapError';
  }
}
