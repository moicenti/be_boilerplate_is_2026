export class PaymentReferenceTakenError extends Error {
  constructor(public readonly reference: string) {
    super(`La referencia "${reference}" ya fue registrada en otro pago.`);
    this.name = 'PaymentReferenceTakenError';
  }
}
