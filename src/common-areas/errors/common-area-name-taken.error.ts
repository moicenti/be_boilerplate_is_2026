export class CommonAreaNameTakenError extends Error {
  constructor(public readonly areaName: string) {
    super(`Ya existe un área común activa llamada "${areaName}".`);
    this.name = 'CommonAreaNameTakenError';
  }
}
