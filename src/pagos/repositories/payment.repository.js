var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
import { Injectable } from '@nestjs/common';
import { FeeStatus, Prisma } from '@PrismaClient';
import { PaymentReferenceTakenError } from '../errors/index.js';
import { totalBalance } from '../utils/index.js';
/** Código de Prisma para violación de restricción única. */
const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';
const ZERO = new Prisma.Decimal(0);
let PaymentRepository = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var PaymentRepository = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            PaymentRepository = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        constructor(prisma) {
            this.prisma = prisma;
        }
        async findAccountStatement(unitId) {
            const [fees, lines] = await Promise.all([
                this.findFeesWithPaid(this.prisma, { unitId }, [{ dueDate: 'desc' }, { id: 'desc' }]),
                this.prisma.paymentAllocation.findMany({
                    where: { fee: { unitId } },
                    select: {
                        id: true,
                        paymentId: true,
                        feeId: true,
                        amount: true,
                        payment: { select: { paidAt: true } },
                    },
                    orderBy: [{ payment: { paidAt: 'desc' } }, { id: 'desc' }],
                }),
            ]);
            return {
                fees,
                payments: lines.map(({ payment, ...line }) => ({ ...line, paidAt: payment.paidAt })),
            };
        }
        /** Cuotas de la unidad entre `feeIds`; las de otra unidad no aparecen. */
        findFeeBalances(unitId, feeIds) {
            return this.findFeesWithPaid(this.prisma, { unitId, id: { in: feeIds } });
        }
        referenceExists(reference) {
            return this.prisma.payment
                .count({ where: { reference } })
                .then((count) => count > 0);
        }
        /**
         * Registra un pago en una sola transacción: bloquea las cuotas elegidas, vuelve a calcular
         * su saldo, le pasa las cuotas a `plan` (que valida y reparte el monto, o lanza), guarda el
         * pago con lo aplicado a cada cuota y actualiza sus estados. Si algo falla, no queda nada.
         */
        async recordPayment(input, plan) {
            try {
                return await this.prisma.$transaction(async (tx) => {
                    // Dos pagos simultáneos sobre la misma cuota no pueden aplicar el mismo saldo:
                    // el segundo espera aquí y luego ve lo que registró el primero.
                    await tx.$queryRaw `
          SELECT id FROM cuota
          WHERE unidad_id = ${input.unitId}::uuid AND id = ANY(${input.feeIds}::int[])
          ORDER BY id
          FOR UPDATE`;
                    const fees = await this.findFeesWithPaid(tx, {
                        unitId: input.unitId,
                        id: { in: input.feeIds },
                    });
                    const allocations = plan(fees);
                    const applied = allocations.filter((a) => a.amount.gt(0));
                    const payment = await tx.payment.create({
                        data: {
                            unitId: input.unitId,
                            userId: input.userId,
                            amount: input.amount,
                            reference: input.reference,
                        },
                        select: { id: true, paidAt: true },
                    });
                    await tx.paymentAllocation.createMany({
                        data: applied.map((a) => ({
                            paymentId: payment.id,
                            feeId: a.feeId,
                            amount: a.amount,
                        })),
                    });
                    for (const allocation of applied) {
                        await tx.fee.update({
                            where: { id: allocation.feeId },
                            data: { status: allocation.resultingStatus },
                        });
                    }
                    const unitFees = await this.findFeesWithPaid(tx, {
                        unitId: input.unitId,
                        status: { not: FeeStatus.ANULADA },
                    });
                    return {
                        paymentId: payment.id,
                        paidAt: payment.paidAt,
                        allocations,
                        unitBalance: totalBalance(unitFees),
                    };
                });
            }
            catch (error) {
                // Carrera entre la verificación previa y el insert: lo resuelve el índice único.
                if (input.reference !== null &&
                    error instanceof Prisma.PrismaClientKnownRequestError &&
                    error.code === UNIQUE_CONSTRAINT_VIOLATION) {
                    throw new PaymentReferenceTakenError(input.reference);
                }
                throw error;
            }
        }
        async findFeesWithPaid(db, where, orderBy) {
            const fees = await db.fee.findMany({
                where,
                select: {
                    id: true,
                    concept: true,
                    period: true,
                    amount: true,
                    dueDate: true,
                    status: true,
                    allocations: { select: { amount: true } },
                },
                orderBy,
            });
            return fees.map(({ allocations, ...fee }) => ({
                ...fee,
                paid: allocations.reduce((sum, a) => sum.plus(a.amount), ZERO),
            }));
        }
    };
    return PaymentRepository = _classThis;
})();
export { PaymentRepository };
