export class PaymentPlanError extends Error {
    reason;
    feeIds;
    debt;
    constructor(reason, 
    /** Cuotas que causan el error (inexistentes o ya cerradas). */
    feeIds = [], 
    /** Lo adeudado en las cuotas elegidas, para MONTO_EXCEDE_DEUDA. */
    debt) {
        super(reason);
        this.reason = reason;
        this.feeIds = feeIds;
        this.debt = debt;
        this.name = 'PaymentPlanError';
    }
}
