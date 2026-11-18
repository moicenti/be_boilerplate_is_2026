export class PaymentReferenceTakenError extends Error {
    reference;
    constructor(reference) {
        super(`La referencia "${reference}" ya fue registrada en otro pago.`);
        this.reference = reference;
        this.name = 'PaymentReferenceTakenError';
    }
}
