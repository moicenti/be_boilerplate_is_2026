export class ReservationOverlapError extends Error {
    constructor() {
        super('El espacio ya está reservado en ese horario.');
        this.name = 'ReservationOverlapError';
    }
}
