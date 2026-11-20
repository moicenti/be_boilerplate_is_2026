export class GenerationInProgressError extends Error {
    constructor(ruleId, period) {
        super(`Ya hay una generación en curso para la regla ${ruleId} y el periodo ${period}.`);
        this.name = 'GenerationInProgressError';
    }
}
