/** Error de dominio: la unidad indicada no existe (violación de FK). */
export class UnitNotFoundError extends Error {
  constructor(public readonly unitId: string) {
    super(`La unidad "${unitId}" no existe.`);
    this.name = 'UnitNotFoundError';
  }
}
