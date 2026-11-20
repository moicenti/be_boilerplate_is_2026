export class FeeRuleDuplicateError extends Error {
    constructor() {
        super('Ya existe una regla vigente con el mismo concepto y alcance.');
        this.name = 'FeeRuleDuplicateError';
    }
}
